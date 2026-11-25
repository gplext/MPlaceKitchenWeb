// Loads the starter menu, packing options, shop details and (optionally) an admin account.
// Safe to run again: it only adds what is missing and never changes what the admin edited.
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { categories, packingOptions, products, shopSettings, users } from "../drizzle/schema";
import { hashPassword } from "./_core/auth";
import { getDb, getUserByEmail } from "./db";
import { mediaDir } from "./media";
import * as seed from "./seedData";

/** Photos cut from Chacha's printed menu card live in server/menu-images, named by product slug. */
const MENU_IMAGES = path.resolve(import.meta.dirname, "menu-images");

const fileSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Photos for each option of a choice, e.g. server/menu-images/brain-freeze--mango.webp. */
async function choiceImages(slug: string, choices: { label: string; options: string[] } | null | undefined) {
  if (!choices) return null;
  const images: Record<string, string> = {};
  for (const option of choices.options) {
    const image = await menuImage(`${slug}--${fileSlug(option)}`);
    if (image) images[option] = image;
  }
  return { ...choices, ...(Object.keys(images).length ? { images } : {}) };
}

/** Copies a menu photo into the uploads folder and returns its /media address, or null when there is none. */
async function menuImage(slug: string): Promise<string | null> {
  const file = `${slug}.webp`;
  try {
    await fs.access(path.join(MENU_IMAGES, file));
  } catch {
    return null;
  }
  await fs.mkdir(mediaDir(), { recursive: true });
  await fs.copyFile(path.join(MENU_IMAGES, file), path.join(mediaDir(), `menu-${file}`));
  return `/media/menu-${file}`;
}

async function main() {
  const db = getDb();

  for (const category of seed.categories) {
    const [existing] = await db.select().from(categories).where(eq(categories.slug, category.slug)).limit(1);
    if (!existing) await db.insert(categories).values({ ...category, active: true });
    // Categories made before kitchens existed get their kitchen once; a kitchen the admin set is never changed.
    else if (!existing.kitchen) await db.update(categories).set({ kitchen: category.kitchen }).where(eq(categories.id, existing.id));
  }
  const categoryIds = new Map((await db.select().from(categories)).map(category => [category.slug, category.id]));

  // Missing items are added each run. To take one off the menu, hide it in the admin portal rather than deleting it.
  const menu = [...seed.chachaProducts, ...seed.products];
  for (const { category, ...product } of menu) {
    const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.slug, product.slug)).limit(1);
    const categoryId = categoryIds.get(category);
    if (existing || !categoryId) continue;
    await db.insert(products).values({
      ...product,
      image: await menuImage(product.slug),
      categoryId,
      sizes: product.sizes ?? null,
      choices: await choiceImages(product.slug, product.choices),
      addons: product.addons ?? null,
      featured: product.featured ?? false,
      ingredients: [],
      allergens: [],
      dietary: [],
      available: product.available ?? true,
    });
  }

  // Chacha's items without a photo get the one from the menu card; a photo the admin uploaded is never replaced.
  // Items from an earlier version of the menu that were replaced are hidden (never deleted, so old orders keep their link).
  for (const slug of seed.retiredSlugs) await db.update(products).set({ available: false }).where(eq(products.slug, slug));

  // Photos from earlier runs (/media/menu-…) are refreshed with the current files.
  let photos = 0;
  const photoSources = [...seed.chachaProducts.map(product => [product.slug, product.slug] as const), ...Object.entries(seed.sharedPhotos)];
  for (const [slug, photo] of photoSources) {
    const [existing] = await db.select({ id: products.id, image: products.image, choices: products.choices }).from(products).where(eq(products.slug, slug)).limit(1);
    if (!existing) continue;
    if (!existing.image || existing.image.startsWith("/media/menu-")) {
      const image = await menuImage(photo);
      if (image) { await db.update(products).set({ image }).where(eq(products.id, existing.id)); photos++; }
    }
    if (existing.choices && !existing.choices.images) {
      const choices = await choiceImages(slug, existing.choices);
      if (choices?.images) await db.update(products).set({ choices }).where(eq(products.id, existing.id));
    }
  }

  for (const { recommendedForSlugs, ...option } of seed.packingOptions) {
    const [existing] = await db.select({ id: packingOptions.id }).from(packingOptions).where(eq(packingOptions.name, option.name)).limit(1);
    if (existing) continue;
    const recommendedFor = recommendedForSlugs.flatMap(slug => categoryIds.get(slug) ?? []);
    await db.insert(packingOptions).values({ ...option, recommendedFor, active: true });
  }

  const [settings] = await db.select({ id: shopSettings.id, dailySpecials: shopSettings.dailySpecials }).from(shopSettings).where(eq(shopSettings.id, 1)).limit(1);
  if (!settings) await db.insert(shopSettings).values(seed.settings);
  else if (!settings.dailySpecials) await db.update(shopSettings).set({ dailySpecials: seed.dailySpecials }).where(eq(shopSettings.id, 1));

  console.log(`Menu ready: ${seed.categories.length} categories, ${seed.chachaProducts.length} Chacha's items (${photos} with menu photos), ${seed.products.length} starter products, ${seed.packingOptions.length} packing options.`);

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
