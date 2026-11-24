import { boolean, customType, date, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { BOOKING_STATUSES, ORDER_CHANNELS, ORDER_STATUSES, type ProductAddon, type ProductChoice, type ProductSize } from "../shared/shop";

/**
 * JSON column that reads the same on MySQL and MariaDB. MariaDB stores JSON as
 * text and hands it back as a string, so parse it here instead of trusting the driver.
 */
const json = <T>(name: string) =>
  customType<{ data: T; driverData: unknown }>({
    dataType: () => "json",
    toDriver: value => JSON.stringify(value),
    fromDriver: value => (typeof value === "string" ? JSON.parse(value) : value) as T,
  })(name);

/** Accounts are optional for customers; `role` gates the admin portal. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 120 }),
  phone: varchar("phone", { length: 32 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  description: varchar("description", { length: 255 }).notNull().default(""),
  /** Which kitchen (department) the category belongs to, e.g. "Chacha's" or "Dairy Shop". Groups the menu. */
  kitchen: varchar("kitchen", { length: 40 }).notNull().default(""),
  sortOrder: int("sortOrder").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description").notNull(),
  /** Whole rupees (PKR). 0 = price on request (told on the call, e.g. items on the display counter). With sizes, the lowest size price. */
  price: int("price").notNull(),
  /** Optional sizes, each with its own price, e.g. Regular 200 / Large 270. */
  sizes: json<ProductSize[]>("sizes"),
  /** Optional single choice the customer must make, e.g. Flavour: Mango, Strawberry. */
  choices: json<ProductChoice>("choices"),
  /** Optional extras added to the price, e.g. Whipped cream +50. */
  addons: json<ProductAddon[]>("addons"),
  /** What one unit is, e.g. "1 plate", "500 g", "Box of 6". */
  unit: varchar("unit", { length: 60 }).notNull().default(""),
  /** Paths under /media, set from the admin portal. */
  image: varchar("image", { length: 255 }),
  packingImage: varchar("packingImage", { length: 255 }),
  ingredients: json<string[]>("ingredients").notNull(),
  allergens: json<string[]>("allergens").notNull(),
  dietary: json<string[]>("dietary").notNull(),
  calories: int("calories"),
  servingSize: varchar("servingSize", { length: 60 }),
  healthNotes: text("healthNotes"),
  /** A fixed expiry date for packed stock, when there is one. */
  expiryDate: date("expiryDate", { mode: "string" }),
  /** Shelf life and storage in words, e.g. "Best eaten within 24 hours. Keep refrigerated." */
  shelfLife: varchar("shelfLife", { length: 255 }),
  available: boolean("available").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("products_categoryId_idx").on(table.categoryId)]);

/** Ways an order can be packed. One is chosen per order. */
export const packingOptions = mysqlTable("packingOptions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  description: varchar("description", { length: 255 }).notNull().default(""),
  /** Extra charge per order, whole rupees. */
  price: int("price").notNull().default(0),
  image: varchar("image", { length: 255 }),
  /** Categories whose items make this the suggested choice (e.g. dairy and frozen for an insulated bag). */
  recommendedFor: json<number[]>("recommendedFor").notNull(),
  isDefault: boolean("isDefault").notNull().default(false),
  active: boolean("active").notNull().default(true),
  sortOrder: int("sortOrder").notNull().default(0),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  /** Customer-facing reference, e.g. LF-1042. Set right after insert. */
  orderNumber: varchar("orderNumber", { length: 32 }).unique(),
  userId: int("userId"),
  channel: mysqlEnum("channel", ORDER_CHANNELS).notNull(),
  status: mysqlEnum("status", ORDER_STATUSES).notNull().default("new"),
  customerName: varchar("customerName", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  address: text("address").notNull(),
  area: varchar("area", { length: 120 }).notNull(),
  notes: text("notes"),
  packingName: varchar("packingName", { length: 80 }).notNull(),
  packingPrice: int("packingPrice").notNull(),
  subtotal: int("subtotal").notNull(),
  deliveryFee: int("deliveryFee").notNull(),
  total: int("total").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("orders_userId_idx").on(table.userId)]);

/** Name and price are copied at order time so later menu edits never change an order. */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  unit: varchar("unit", { length: 60 }).notNull().default(""),
  unitPrice: int("unitPrice").notNull(),
  quantity: int("quantity").notNull(),
  /** Size, flavour and add-ons the customer chose, e.g. "Large · Mango · + Whipped cream". */
  details: varchar("details", { length: 255 }).notNull().default(""),
}, table => [index("orderItems_orderId_idx").on(table.orderId)]);

/** Requests from outside cooks and caterers to hire the MPlace kitchen by the hour. */
export const kitchenBookings = mysqlTable("kitchenBookings", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  date: date("date", { mode: "string" }).notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  hours: int("hours").notNull(),
  purpose: varchar("purpose", { length: 255 }).notNull().default(""),
  status: mysqlEnum("status", BOOKING_STATUSES).notNull().default("new"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** One row (id 1) of shop details the admin can change without touching code. */
export const shopSettings = mysqlTable("shopSettings", {
  id: int("id").primaryKey(),
  phone: varchar("phone", { length: 32 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 32 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  openingHours: varchar("openingHours", { length: 120 }).notNull().default(""),
  /** Whole rupees. 0 = delivery charge confirmed on the call. */
  deliveryFee: int("deliveryFee").notNull().default(0),
  /** Orders at or above this subtotal deliver free. 0 = never automatic. */
  freeDeliveryOver: int("freeDeliveryOver").notNull().default(0),
  deliveryNote: varchar("deliveryNote", { length: 255 }).notNull().default(""),
  /** Chacha's meal of the day, Sunday first (7 entries). */
  dailySpecials: json<string[]>("dailySpecials"),
});

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type PackingOption = typeof packingOptions.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type ShopSettings = typeof shopSettings.$inferSelect;
export type KitchenBooking = typeof kitchenBookings.$inferSelect;
