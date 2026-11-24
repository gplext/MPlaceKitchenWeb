import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ALLERGENS, BOOKING_HOURS, BOOKING_STATUSES, DIETARY_TAGS, ORDER_CHANNELS, ORDER_STATUSES } from "@shared/shop";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { hashPassword, signSession, toPublicUser, verifyPassword } from "./_core/auth";
import type { TrpcContext } from "./_core/context";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { alertStatus, SAMPLE_ORDER, sendOrderAlerts } from "./alerts";
import * as db from "./db";
import { saveImage } from "./media";

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(320);
const text = (max: number) => z.string().trim().min(1, "This field is required").max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional().transform(value => value || null);
const phone = z.string().trim().regex(/^\+?[0-9][0-9 -]{8,18}$/, "Enter a valid phone number, for example 0345 1234567");
const money = z.number().int().min(0).max(10_000_000);
const mediaPath = z.string().regex(/^\/media\/[A-Za-z0-9_-]+\.(jpg|png|webp)$/).nullable();
const id = z.number().int().positive();

const slugify = (value: string) =>
  value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "item";

async function startSession(ctx: TrpcContext, userId: number) {
  const token = await signSession(userId, ONE_YEAR_MS);
  ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
}

/** Customers and admins should see why something failed; everything else stays a generic server error. */
const asBadRequest = (error: unknown): never => {
  if (error instanceof db.ShopError) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  throw error;
};

async function uniqueSlug(table: "categories" | "products", name: string, exceptId?: number) {
  const base = slugify(name);
  let slug = base;
  for (let n = 2; await db.slugTaken(table, slug, exceptId); n++) slug = `${base}-${n}`;
  return slug;
}

const optionName = z.string().trim().min(1).max(60);
const productInput = z.object({
  categoryId: id,
  name: text(120),
  description: z.string().trim().max(2000).default(""),
  /** 0 = price on request. With sizes the server stores the lowest size price here. */
  price: money,
  sizes: z.array(z.object({ label: optionName, price: money.refine(value => value > 0, "Give every size a price") })).max(8).nullable()
    .refine(list => !list || new Set(list.map(size => size.label.toLowerCase())).size === list.length, "Size names must be different"),
  choices: z.object({ label: z.string().trim().max(40), options: z.array(optionName).max(30) }).nullable(),
  addons: z.array(z.object({ name: optionName, price: money })).max(20).nullable(),
  unit: z.string().trim().max(60).default(""),
  image: mediaPath,
  packingImage: mediaPath,
  ingredients: z.array(z.string().trim().min(1).max(80)).max(60),
  allergens: z.array(z.enum(ALLERGENS)).max(ALLERGENS.length),
  dietary: z.array(z.enum(DIETARY_TAGS)).max(DIETARY_TAGS.length),
  calories: z.number().int().min(0).max(20000).nullable(),
  servingSize: optionalText(60),
  healthNotes: optionalText(2000),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date").nullable(),
  shelfLife: optionalText(255),
  available: z.boolean(),
  featured: z.boolean(),
  sortOrder: z.number().int().min(0).max(10000).default(0),
});

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(({ ctx }) => (ctx.user ? toPublicUser(ctx.user) : null)),

    register: publicProcedure
      .input(z.object({ name: text(120), email, phone: phone.optional().or(z.literal("").transform(() => undefined)), password: z.string().min(8, "Use at least 8 characters").max(200) }))
      .mutation(async ({ ctx, input }) => {
        if (await db.getUserByEmail(input.email)) {
          throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists. Try signing in." });
        }
        const user = await db.createUser({ email: input.email, name: input.name, phone: input.phone ?? null, passwordHash: await hashPassword(input.password) });
        await startSession(ctx, user.id);
        return toPublicUser(user);
      }),

    login: publicProcedure
      .input(z.object({ email, password: z.string().min(1).max(200) }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserByEmail(input.email);
        // Same message either way, so the form never reveals which emails have accounts.
        if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email or password is incorrect." });
        }
        await startSession(ctx, user.id);
        return toPublicUser(user);
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, getSessionCookieOptions(ctx.req));
      return { success: true } as const;
    }),
  }),

  catalog: router({
    all: publicProcedure.query(() => db.getCatalog()),
    /** How busy the kitchen is right now, shown as a meter on the home page. */
    queue: publicProcedure.query(async () => ({ active: await db.countActiveOrders() })),
  }),

  kitchenHire: router({
    /** Outside cooks and caterers ask to hire the kitchen; the shop confirms on WhatsApp or by phone. */
    request: publicProcedure
      .input(z.object({
        name: text(120),
        phone,
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
        startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a start time"),
        hours: z.number().int().refine(value => (BOOKING_HOURS as readonly number[]).includes(value), "Choose how many hours"),
        purpose: z.string().trim().max(255).default(""),
      }))
      .mutation(async ({ input }) => {
        if (input.date < new Date().toISOString().slice(0, 10)) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose today or a later date." });
        return { id: await db.createBooking(input) };
      }),
  }),

  orders: router({
    /** No account needed. Signed-in customers also see the order in their account. */
    create: publicProcedure
      .input(z.object({
        channel: z.enum(ORDER_CHANNELS),
        items: z.array(z.object({
          productId: id,
          quantity: z.number().int().min(1).max(50),
          size: z.string().max(60).nullish(),
          choice: z.string().max(60).nullish(),
          addons: z.array(z.string().max(60)).max(20).nullish(),
        })).min(1, "Your bag is empty").max(40),
        packingOptionId: id,
        customerName: text(120),
        phone,
        address: text(500),
        area: text(120),
        notes: optionalText(500),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await db.createOrder({ ...input, userId: ctx.user?.id ?? null }).catch(asBadRequest);
        // Not awaited: the customer gets their confirmation straight away, alerts follow in the background.
        void sendOrderAlerts(order);
        return order;
      }),

    /** Order lookup by reference. Anyone holding the number can see it, so name, phone and address are left out. */
    byNumber: publicProcedure.input(z.object({ orderNumber: z.string().min(1).max(32) })).query(async ({ input }) => {
      const order = await db.getOrderByNumber(input.orderNumber);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "We could not find that order." });
      const { orderNumber, status, channel, packingName, packingPrice, subtotal, deliveryFee, total, createdAt, items } = order;
      return { orderNumber: orderNumber!, status, channel, packingName, packingPrice, subtotal, deliveryFee, total, createdAt, items };
    }),

    mine: protectedProcedure.query(({ ctx }) => db.listOrdersForUser(ctx.user.id)),
  }),

  admin: router({
    orders: adminProcedure.query(() => db.listOrders()),
    setOrderStatus: adminProcedure
      .input(z.object({ id, status: z.enum(ORDER_STATUSES) }))
      .mutation(async ({ input }) => {
        if (!(await db.setOrderStatus(input.id, input.status))) throw new TRPCError({ code: "NOT_FOUND" });
        return { success: true } as const;
      }),

    categories: adminProcedure.query(() => db.listCategories()),
    saveCategory: adminProcedure
      .input(z.object({ id: id.optional(), name: text(80), description: z.string().trim().max(255).default(""), kitchen: z.string().trim().max(40).default(""), sortOrder: z.number().int().min(0).max(10000).default(0), active: z.boolean() }))
      .mutation(async ({ input: { id: categoryId, ...values } }) => {
        const slug = await uniqueSlug("categories", values.name, categoryId);
        return { id: await db.saveCategory({ ...values, slug }, categoryId) };
      }),
    deleteCategory: adminProcedure.input(z.object({ id })).mutation(async ({ input }) => {
      await db.deleteCategory(input.id).catch(asBadRequest);
      return { success: true } as const;
    }),

    products: adminProcedure.query(() => db.listAllProducts()),
    saveProduct: adminProcedure
      .input(productInput.extend({ id: id.optional() }))
      .mutation(async ({ input: { id: productId, ...values } }) => {
        if (!(await db.getCategoryById(values.categoryId))) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a category." });
        // A product keeps its web address when renamed, so shared links and the starter menu never break.
        const existing = productId ? await db.getProductById(productId) : undefined;
        if (productId && !existing) throw new TRPCError({ code: "NOT_FOUND" });
        const slug = existing?.slug ?? await uniqueSlug("products", values.name);
        const sizes = values.sizes?.length ? values.sizes : null;
        const choices = values.choices?.options.length ? { label: values.choices.label || "Flavour", options: values.choices.options } : null;
        const addons = values.addons?.length ? values.addons : null;
        const price = sizes ? Math.min(...sizes.map(size => size.price)) : values.price;
        return { id: await db.saveProduct({ ...values, price, sizes, choices, addons, slug }, productId), slug };
      }),
    deleteProduct: adminProcedure.input(z.object({ id })).mutation(async ({ input }) => {
      await db.deleteProduct(input.id);
      return { success: true } as const;
    }),

    packingOptions: adminProcedure.query(() => db.listPackingOptions()),
    savePackingOption: adminProcedure
      .input(z.object({
        id: id.optional(),
        name: text(80),
        description: z.string().trim().max(255).default(""),
        price: money,
        image: mediaPath,
        recommendedFor: z.array(id).max(50),
        isDefault: z.boolean(),
        active: z.boolean(),
        sortOrder: z.number().int().min(0).max(10000).default(0),
      }))
      .mutation(async ({ input: { id: optionId, ...values } }) => ({ id: await db.savePackingOption(values, optionId) })),
    deletePackingOption: adminProcedure.input(z.object({ id })).mutation(async ({ input }) => {
      await db.deletePackingOption(input.id);
      return { success: true } as const;
    }),

    /** Photos arrive as base64 inside the JSON body; the server checks the bytes and picks the file name. */
    uploadImage: adminProcedure
      .input(z.object({ dataBase64: z.string().min(1).max(8_000_000) }))
      .mutation(async ({ input }) => ({ path: await saveImage(input.dataBase64).catch(asBadRequest) })),

    bookings: adminProcedure.query(() => db.listBookings()),
    setBookingStatus: adminProcedure
      .input(z.object({ id, status: z.enum(BOOKING_STATUSES) }))
      .mutation(async ({ input }) => {
        if (!(await db.setBookingStatus(input.id, input.status))) throw new TRPCError({ code: "NOT_FOUND" });
        return { success: true } as const;
      }),

    alerts: adminProcedure.query(() => alertStatus()),
    sendTestAlert: adminProcedure.mutation(() => sendOrderAlerts(SAMPLE_ORDER)),

    settings: adminProcedure.query(() => db.getSettings()),
    saveSettings: adminProcedure
      .input(z.object({
        phone,
        whatsapp: phone,
        address: text(255),
        openingHours: z.string().trim().max(120).default(""),
        deliveryFee: money,
        freeDeliveryOver: money,
        deliveryNote: z.string().trim().max(255).default(""),
        dailySpecials: z.array(z.string().trim().max(80)).length(7),
      }))
      .mutation(async ({ input }) => {
        await db.updateSettings(input);
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
