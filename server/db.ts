import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  categories,
  kitchenBookings,
  orderItems,
  orders,
  packingOptions,
  products,
  shopSettings,
  users,
  type Category,
  type InsertProduct,
  type KitchenBooking,
  type Order,
  type OrderItem,
  type PackingOption,
  type ShopSettings,
} from "../drizzle/schema";
import { deliveryFeeFor, priceFor, selectionKey, type BookingStatus, type OrderChannel, type OrderStatus, type Selection } from "../shared/shop";

let _db: ReturnType<typeof drizzle> | null = null;

/** The drizzle instance. Created lazily so tooling and unit tests can load this module without a database. */
export function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set. Add it to your .env file.");
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db;
}

/** A problem the customer or admin caused and can fix, as opposed to a server fault. */
export class ShopError extends Error {}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function getUserById(id: number) {
  const [user] = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await getDb().select().from(users).where(eq(users.email, email)).limit(1);
  return user;
}

export async function createUser(values: { email: string; name: string; phone?: string | null; passwordHash: string }) {
  const [result] = await getDb().insert(users).values(values).$returningId();
  return (await getUserById(result.id))!;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getSettings(): Promise<ShopSettings> {
  const [settings] = await getDb().select().from(shopSettings).where(eq(shopSettings.id, 1)).limit(1);
  if (!settings) throw new Error("Shop settings are missing. Run `pnpm db:seed`.");
  return settings;
}

export async function updateSettings(values: Omit<ShopSettings, "id">) {
  await getDb().update(shopSettings).set(values).where(eq(shopSettings.id, 1));
}

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

/** Everything the storefront needs, in one call: active categories, available products, active packing options and contact details. */
export async function getCatalog() {
  const db = getDb();
  const [cats, items, packing, settings] = await Promise.all([
    db.select().from(categories).where(eq(categories.active, true)).orderBy(asc(categories.sortOrder), asc(categories.id)),
    db.select().from(products).where(eq(products.available, true)).orderBy(asc(products.sortOrder), asc(products.id)),
    db.select().from(packingOptions).where(eq(packingOptions.active, true)).orderBy(asc(packingOptions.sortOrder), asc(packingOptions.id)),
    getSettings(),
  ]);
  const activeIds = new Set(cats.map(category => category.id));
  const { id: _settingsId, deliveryFee, freeDeliveryOver, ...contact } = settings;
  return {
    categories: cats,
    products: items.filter(product => activeIds.has(product.categoryId)),
    packingOptions: packing,
    shop: { ...contact, deliveryFee, freeDeliveryOver },
  };
}

export async function listCategories() {
  return getDb().select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
}

export async function slugTaken(table: "categories" | "products", slug: string, exceptId?: number) {
  const target = table === "categories" ? categories : products;
  const rows = await getDb().select({ id: target.id }).from(target).where(eq(target.slug, slug)).limit(1);
  return rows.length > 0 && rows[0].id !== exceptId;
}

export async function saveCategory(values: Omit<Category, "id">, id?: number) {
  const db = getDb();
  if (id) {
    await db.update(categories).set(values).where(eq(categories.id, id));
    return id;
  }
  const [result] = await db.insert(categories).values(values).$returningId();
  return result.id;
}

export async function deleteCategory(id: number) {
  const db = getDb();
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.categoryId, id));
  if (Number(count) > 0) throw new ShopError("Move or delete the products in this category first.");
  await db.delete(categories).where(eq(categories.id, id));
}

export async function listAllProducts() {
  return getDb().select().from(products).orderBy(asc(products.categoryId), asc(products.sortOrder), asc(products.id));
}

export async function getProductById(id: number) {
  const [product] = await getDb().select().from(products).where(eq(products.id, id)).limit(1);
  return product;
}

export async function getCategoryById(id: number) {
  const [category] = await getDb().select().from(categories).where(eq(categories.id, id)).limit(1);
  return category;
}

export async function saveProduct(values: Omit<InsertProduct, "id" | "createdAt" | "updatedAt">, id?: number) {
  const db = getDb();
  if (id) {
    await db.update(products).set(values).where(eq(products.id, id));
    return id;
  }
  const [result] = await db.insert(products).values(values).$returningId();
  return result.id;
}

export async function deleteProduct(id: number) {
  await getDb().delete(products).where(eq(products.id, id));
}

export async function listPackingOptions() {
  return getDb().select().from(packingOptions).orderBy(asc(packingOptions.sortOrder), asc(packingOptions.id));
}

export async function savePackingOption(values: Omit<PackingOption, "id">, id?: number) {
  const db = getDb();
  return db.transaction(async tx => {
    // Only one option can be the default.
    if (values.isDefault) await tx.update(packingOptions).set({ isDefault: false });
    if (id) {
      await tx.update(packingOptions).set(values).where(eq(packingOptions.id, id));
      return id;
    }
    const [result] = await tx.insert(packingOptions).values(values).$returningId();
    return result.id;
  });
}

export async function deletePackingOption(id: number) {
  await getDb().delete(packingOptions).where(eq(packingOptions.id, id));
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export type NewOrder = {
  userId: number | null;
  channel: OrderChannel;
  customerName: string;
  phone: string;
  address: string;
  area: string;
  notes?: string | null;
  packingOptionId: number;
  items: ({ productId: number; quantity: number } & Selection)[];
};

/** Prices, packing charge and delivery fee are all worked out here from the database; the browser only sends ids, choices and quantities. */
export async function createOrder(input: NewOrder): Promise<Order & { items: OrderItem[] }> {
  const db = getDb();
  // The same product with the same choices becomes one line.
  const merged = new Map<string, { productId: number; quantity: number } & Selection>();
  for (const item of input.items) {
    const key = selectionKey(item.productId, item);
    const existing = merged.get(key);
    merged.set(key, existing ? { ...existing, quantity: existing.quantity + item.quantity } : { ...item });
  }

  const orderId = await db.transaction(async tx => {
    const ids = [...new Set([...merged.values()].map(item => item.productId))];
    const rows = await tx.select().from(products).where(inArray(products.id, ids));
    const byId = new Map(rows.map(row => [row.id, row]));
    const lines = [...merged.values()].map(item => {
      const product = byId.get(item.productId);
      if (!product || !product.available) throw new ShopError("Something in your bag is no longer on the menu. Please review your bag.");
      try {
        return { product, quantity: item.quantity, ...priceFor(product, item) };
      } catch (error) {
        throw new ShopError(`${product.name}: ${error instanceof Error ? error.message : "check your choices"}`);
      }
    });

    const [packing] = await tx.select().from(packingOptions).where(eq(packingOptions.id, input.packingOptionId)).limit(1);
    if (!packing || !packing.active) throw new ShopError("Please choose a packing option.");

    const [settings] = await tx.select().from(shopSettings).where(eq(shopSettings.id, 1)).limit(1);
    const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const deliveryFee = deliveryFeeFor(subtotal, settings?.deliveryFee ?? 0, settings?.freeDeliveryOver ?? 0);

    const [created] = await tx.insert(orders).values({
      userId: input.userId,
      channel: input.channel,
      customerName: input.customerName,
      phone: input.phone,
      address: input.address,
      area: input.area,
      notes: input.notes || null,
      packingName: packing.name,
      packingPrice: packing.price,
      subtotal,
      deliveryFee,
      total: subtotal + packing.price + deliveryFee,
    }).$returningId();
    await tx.update(orders).set({ orderNumber: `MP-${1000 + created.id}` }).where(eq(orders.id, created.id));
    await tx.insert(orderItems).values(lines.map(({ product, quantity, unitPrice, details }) => ({
      orderId: created.id,
      productId: product.id,
      name: product.name,
      unit: product.unit,
      unitPrice,
      quantity,
      details: details.slice(0, 255),
    })));
    return created.id;
  });

  return (await getOrderById(orderId))!;
}

/** Orders the kitchen is still working on, for the public "kitchen queue" meter. Only a count leaves the server. */
export async function countActiveOrders() {
  const [{ count }] = await getDb().select({ count: sql<number>`count(*)` }).from(orders)
    .where(inArray(orders.status, ["new", "confirmed", "preparing", "out_for_delivery"]));
  return Number(count);
}

// ---------------------------------------------------------------------------
// Kitchen hire
// ---------------------------------------------------------------------------

export async function createBooking(values: Omit<KitchenBooking, "id" | "status" | "createdAt">) {
  const [result] = await getDb().insert(kitchenBookings).values(values).$returningId();
  return result.id;
}

export async function listBookings(limit = 200) {
  return getDb().select().from(kitchenBookings).orderBy(desc(kitchenBookings.id)).limit(limit);
}

export async function setBookingStatus(id: number, status: BookingStatus) {
  const [result] = await getDb().update(kitchenBookings).set({ status }).where(eq(kitchenBookings.id, id));
  return result.affectedRows > 0;
}

async function withItems(rows: Order[]) {
  if (rows.length === 0) return [];
  const items = await getDb().select().from(orderItems).where(inArray(orderItems.orderId, rows.map(row => row.id)));
  return rows.map(row => ({ ...row, items: items.filter(item => item.orderId === row.id) }));
}

export async function getOrderById(id: number) {
  const rows = await getDb().select().from(orders).where(eq(orders.id, id)).limit(1);
  return (await withItems(rows))[0];
}

export async function getOrderByNumber(orderNumber: string) {
  const rows = await getDb().select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return (await withItems(rows))[0];
}

export async function listOrdersForUser(userId: number) {
  return withItems(await getDb().select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.id)).limit(50));
}

export async function listOrders(limit = 200) {
  return withItems(await getDb().select().from(orders).orderBy(desc(orders.id)).limit(limit));
}

export async function setOrderStatus(id: number, status: OrderStatus) {
  const [result] = await getDb().update(orders).set({ status }).where(eq(orders.id, id));
  return result.affectedRows > 0;
}
