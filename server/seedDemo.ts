// Adds the made-up demo catalogue (see demoData.ts):  pnpm db:demo
// Removes it again:                                   pnpm db:demo -- --remove
// Run `pnpm db:setup` first so the categories exist.
import "dotenv/config";
import { eq, inArray, like } from "drizzle-orm";
import fs from "node:fs/promises";
import path from "node:path";
import { categories, packingOptions, products } from "../drizzle/schema";
import { getDb } from "./db";
import { demoProducts, packingImageFor, packingOptionImages, STARTER_SLUGS } from "./demoData";
import { mediaDir } from "./media";

const SOURCE = path.resolve(import.meta.dirname, "demo-images");
const mediaPath = (name: string) => `/media/demo-${name}.webp`;

/** Copies one drawing into the uploads folder, where the site serves photos from. */
async function publish(name: string) {
  await fs.mkdir(mediaDir(), { recursive: true });
  await fs.copyFile(path.join(SOURCE, `${name}.webp`), path.join(mediaDir(), `demo-${name}.webp`));
  return mediaPath(name);
}

const isoDateIn = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

async function add() {
  const db = getDb();
  const categoryIds = new Map((await db.select().from(categories)).map(category => [category.slug, category.id]));
  let added = 0;
  let filled = 0;

  for (const demo of demoProducts) {
    const categoryId = categoryIds.get(demo.category);
    if (!categoryId) throw new Error(`Category "${demo.category}" is missing. Run \`pnpm db:setup\` first.`);
    const details = {
      image: await publish(demo.slug),
      packingImage: await publish(packingImageFor[demo.category]),
      ingredients: demo.ingredients,
      allergens: demo.allergens,
      dietary: demo.dietary,
      calories: demo.calories,
      servingSize: demo.servingSize,
      healthNotes: demo.healthNotes,
      shelfLife: demo.shelfLife,
      expiryDate: demo.expiresInDays ? isoDateIn(demo.expiresInDays) : null,
    };
    const [existing] = await db.select().from(products).where(eq(products.slug, demo.slug)).limit(1);
    if (!existing) {
      await db.insert(products).values({
        slug: demo.slug, categoryId, name: demo.name, description: demo.description, price: demo.price, unit: demo.unit,
        featured: demo.featured ?? false, sortOrder: demo.sortOrder, available: true, ...details,
      });
      added++;
    } else {
      // An existing product (usually a starter one): fill only what is still empty, never its name, price or edits.
      const { image, packingImage, ...info } = details;
      const changes = {
        ...(existing.image ? {} : { image }),
        ...(existing.packingImage ? {} : { packingImage }),
        ...(existing.ingredients.length === 0 && existing.calories == null ? info : {}),
      };
      if (Object.keys(changes).length > 0) {
        await db.update(products).set(changes).where(eq(products.id, existing.id));
        filled++;
      }
    }
  }

  for (const [name, image] of Object.entries(packingOptionImages)) {
    const [option] = await db.select().from(packingOptions).where(eq(packingOptions.name, name)).limit(1);
    if (option && !option.image) await db.update(packingOptions).set({ image: await publish(image) }).where(eq(packingOptions.id, option.id));
  }

  console.log(`Demo menu: added ${added} products, filled in details for ${filled} starter products.`);
  console.log("All demo products, prices and nutrition figures are made up. Remove them with: pnpm db:demo -- --remove");
}

async function remove() {
  const db = getDb();
  const demoOnly = demoProducts.filter(item => !STARTER_SLUGS.has(item.slug)).map(item => item.slug);
  const [result] = await db.delete(products).where(inArray(products.slug, demoOnly));
  // Starter products and packing options keep everything except the demo drawings.
  await db.update(products).set({ image: null }).where(like(products.image, "/media/demo-%"));
  await db.update(products).set({ packingImage: null }).where(like(products.packingImage, "/media/demo-%"));
  await db.update(packingOptions).set({ image: null }).where(like(packingOptions.image, "/media/demo-%"));
  console.log(`Demo menu removed: deleted ${result.affectedRows} demo products and cleared the demo drawings.`);
}

(process.argv.includes("--remove") ? remove() : add())
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
