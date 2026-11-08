// Loads the starter menu, packing options, shop details and (optionally) an admin account.
// Safe to run again: it only adds what is missing and never changes what the admin edited.
import "dotenv/config";
import { eq } from "drizzle-orm";
import { categories, packingOptions, products, shopSettings, users } from "../drizzle/schema";
import { hashPassword } from "./_core/auth";
import { getDb, getUserByEmail } from "./db";
import * as seed from "./seedData";

async function main() {
  const db = getDb();

  for (const category of seed.categories) {
    const [existing] = await db.select().from(categories).where(eq(categories.slug, category.slug)).limit(1);
    if (!existing) await db.insert(categories).values({ ...category, active: true });
  }
  const categoryIds = new Map((await db.select().from(categories)).map(category => [category.slug, category.id]));

  for (const { category, ...product } of seed.products) {
    const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.slug, product.slug)).limit(1);
    const categoryId = categoryIds.get(category);
    if (existing || !categoryId) continue;
    await db.insert(products).values({ ...product, categoryId, featured: product.featured ?? false, ingredients: [], allergens: [], dietary: [], available: true });
  }

  for (const { recommendedForSlugs, ...option } of seed.packingOptions) {
    const [existing] = await db.select({ id: packingOptions.id }).from(packingOptions).where(eq(packingOptions.name, option.name)).limit(1);
    if (existing) continue;
    const recommendedFor = recommendedForSlugs.flatMap(slug => categoryIds.get(slug) ?? []);
    await db.insert(packingOptions).values({ ...option, recommendedFor, active: true });
  }

  const [settings] = await db.select({ id: shopSettings.id }).from(shopSettings).where(eq(shopSettings.id, 1)).limit(1);
  if (!settings) await db.insert(shopSettings).values(seed.settings);

  console.log(`Menu ready: ${seed.categories.length} categories, ${seed.products.length} starter products, ${seed.packingOptions.length} packing options.`);

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
    const existing = await getUserByEmail(adminEmail);
    if (existing) {
      await db.update(users).set({ role: "admin" }).where(eq(users.id, existing.id));
      console.log(`Admin: ${adminEmail} already exists; made sure it has the admin role (password unchanged).`);
    } else {
      await db.insert(users).values({ email: adminEmail, name: "Admin", role: "admin", passwordHash: await hashPassword(adminPassword) });
      console.log(`Admin: created ${adminEmail}.`);
    }
  } else {
    console.log("Admin: skipped (set ADMIN_EMAIL and ADMIN_PASSWORD in .env to create one).");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
