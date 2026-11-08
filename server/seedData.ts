// Starter data for a fresh database. `pnpm db:seed` adds anything missing and never
// overwrites what the admin has changed since. Prices marked PLACEHOLDER must be
// replaced from the admin portal before the shop goes live.

export const categories = [
  { slug: "dairy", name: "Dairy", description: "Fresh milk, yogurt and dairy treats from our farm.", sortOrder: 1 },
  { slug: "frozen-foods", name: "Frozen Foods", description: "Ready to cook, frozen fresh for busy days.", sortOrder: 2 },
  { slug: "foods", name: "Foods", description: "Ready-made meals from the Living Foods kitchen.", sortOrder: 3 },
  { slug: "desserts", name: "Desserts", description: "Cakes and bakes, made in small batches.", sortOrder: 4 },
];

type SeedProduct = { slug: string; category: string; name: string; description: string; price: number; unit: string; featured?: boolean; sortOrder: number };

/** Prices are PLACEHOLDERS until the real price list is entered in the admin portal. Ingredients, nutrition and shelf life are left empty on purpose so nothing unverified is shown to customers. */
export const products: SeedProduct[] = [
  { slug: "biryani", category: "foods", name: "Biryani", description: "Fragrant rice layered with spiced meat, cooked in the Living Foods kitchen.", price: 650, unit: "1 plate", featured: true, sortOrder: 1 },
  { slug: "bun-kebab", category: "foods", name: "Bun Kebab", description: "Lahore's street-side favourite: a spiced kebab in a soft bun with chutney.", price: 250, unit: "1 piece", featured: true, sortOrder: 2 },
  { slug: "chicken-burger", category: "foods", name: "Chicken Burger", description: "A crisp chicken fillet in a toasted bun with fresh salad and sauce.", price: 450, unit: "1 burger", featured: true, sortOrder: 3 },
  { slug: "banana-cake", category: "desserts", name: "Banana Cake", description: "A soft, moist banana cake baked in small batches.", price: 900, unit: "1 loaf", featured: true, sortOrder: 1 },
  { slug: "chocolate-brownie", category: "desserts", name: "Chocolate Brownie", description: "Dense, fudgy chocolate brownie with a crackly top.", price: 250, unit: "1 piece", featured: true, sortOrder: 2 },
];

export const packingOptions = [
  { name: "Standard box", description: "Food-grade box, sealed for delivery.", price: 0, recommendedForSlugs: [] as string[], isDefault: true, sortOrder: 1 },
  { name: "Insulated bag with ice packs", description: "Keeps dairy and frozen items cold on the way to you.", price: 100, recommendedForSlugs: ["dairy", "frozen-foods"], isDefault: false, sortOrder: 2 },
];

/** Phone and WhatsApp number come from livingfoodspk.com; confirm them in the admin portal. */
export const settings = {
  id: 1,
  phone: "0345 9024745",
  whatsapp: "0345 9024745",
  address: "7/83 Shahrah-e-Quaid-e-Azam, Mall Road, Lahore",
  openingHours: "",
  deliveryFee: 0,
  freeDeliveryOver: 0,
  deliveryNote: "We deliver across Lahore and confirm the delivery charge when we call or message you.",
};
