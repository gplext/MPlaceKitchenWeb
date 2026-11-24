// Starter data for a fresh database, plus Chacha's menu. `pnpm db:seed` adds anything missing and never
// overwrites what the admin has changed since. Prices marked PLACEHOLDER must be
// replaced from the admin portal before the shop goes live.

import type { ProductAddon, ProductChoice, ProductSize } from "../shared/shop";

/** Chacha's menu comes first, then the Living Foods kitchens. `kitchen` groups categories on the menu page. */
export const categories = [
  { slug: "chai", name: "Chai", kitchen: "Chacha's", description: "Brewed fresh at Chacha's, from the signature spice blend to pink Kashmiri chai.", sortOrder: 1 },
  { slug: "coffee", name: "Coffee", kitchen: "Chacha's", description: "Bold brews, whipped coffee and hot chocolate.", sortOrder: 2 },
  { slug: "burgers-sandwiches", name: "Burgers & Sandwiches", kitchen: "Chacha's", description: "Make it a Chacha Combo: add any drink for Rs. 20 off.", sortOrder: 3 },
  { slug: "ice-cream", name: "Ice-cream", kitchen: "Chacha's", description: "Soft serve and Chacha's ice-cream burger, with toppings and real fruit.", sortOrder: 4 },
  { slug: "slush", name: "Slush", kitchen: "Chacha's", description: "Ice-cold fruit slush in bold flavours.", sortOrder: 5 },
  { slug: "sip-station", name: "Sip Station", kitchen: "Chacha's", description: "Milkshakes, fruit smoothies and lassi.", sortOrder: 6 },
  { slug: "fresh-from-the-oven", name: "Fresh from the Oven", kitchen: "Chacha's", description: "Patties, cakes and buns baked fresh every day.", sortOrder: 7 },
  { slug: "desi-delights", name: "Desi Delights", kitchen: "Chacha's", description: "Rabri kheer, dahi bhalla and chana chaat.", sortOrder: 8 },
  { slug: "daily-meal-special", name: "Chacha's Daily Meal Special", kitchen: "Chacha's", description: "A different home-style meal every day. Add any Chacha's drink for Rs. 20 off.", sortOrder: 9 },
  { slug: "dairy", name: "Dairy", kitchen: "Dairy Shop", description: "Fresh milk, yogurt and dairy treats from our farm.", sortOrder: 20 },
  { slug: "foods", name: "Foods", kitchen: "MPlace Kitchen", description: "Ready-made meals from the MPlace kitchen.", sortOrder: 30 },
  { slug: "desserts", name: "Desserts", kitchen: "MPlace Kitchen", description: "Cakes and bakes, made in small batches.", sortOrder: 31 },
  { slug: "frozen-foods", name: "Frozen Foods", kitchen: "Ready-made", description: "Ready to cook, frozen fresh for busy days.", sortOrder: 40 },
];

type SeedProduct = {
  slug: string; category: string; name: string; description: string; price: number; unit: string; featured?: boolean; sortOrder: number;
  sizes?: ProductSize[]; choices?: ProductChoice; addons?: ProductAddon[];
};

const R_L = (regular: number, large: number): ProductSize[] => [{ label: "Regular", price: regular }, { label: "Large", price: large }];
const ICE_CREAM_FLAVOURS: ProductChoice = { label: "Flavour", options: ["Chocolate", "Blueberry", "Mango", "Cherry", "Strawberry", "Caramel"] };
const ICE_CREAM_ADDONS: ProductAddon[] = [
  { name: "Any 2 toppings (sprinkles, nuts, coconut dust, biscuit crumbs, wafer)", price: 30 },
  { name: "Real fruit (mixed, pineapple, peach or seasonal)", price: 50 },
];

/** Chacha's menu, taken from the printed menu card. Price 0 = "see the food display station": the price is confirmed with the customer. */
export const chachaProducts: SeedProduct[] = [
  // Chai
  { slug: "the-og-chacha", category: "chai", name: "The OG Chacha (Signature Chai)", description: "Our signature chai brewed with a secret spice blend. Comfort in its finest form.", price: 120, unit: "1 cup", featured: true, sortOrder: 1 },
  { slug: "everyday-chai", category: "chai", name: "Everyday Chai", description: "A perfectly balanced cup of karak milk tea, brewed fresh every time. Add silky malai to make it richer and creamier.", price: 80, unit: "1 cup", featured: true, sortOrder: 2, addons: [{ name: "Extra malai", price: 20 }] },
  { slug: "zen-chai", category: "chai", name: "Zen Chai (Green Chai)", description: "Light green tea infused with warming spices for a refreshing, calming sip.", price: 70, unit: "1 cup", sortOrder: 3 },
  { slug: "pink-velvet-chai", category: "chai", name: "Pink Velvet Chai", description: "Creamy Kashmiri pink tea with a velvety finish and delicate flavour.", price: 100, unit: "1 cup", sortOrder: 4 },
  { slug: "chai-chiller", category: "chai", name: "Chai Chiller (Flavoured Iced Tea)", description: "Refreshing iced tea in fruity flavours that keep every sip exciting.", price: 100, unit: "1 glass", featured: true, sortOrder: 5 },
  // Coffee
  { slug: "bold-brew", category: "coffee", name: "Bold Brew (Americano)", description: "Bold Arabica coffee with a clean finish for true coffee lovers.", price: 120, unit: "1 cup", sortOrder: 1, addons: [{ name: "Milk", price: 30 }] },
  { slug: "cloud-coffee", category: "coffee", name: "Cloud Coffee (Whipped Coffee)", description: "Silky whipped coffee layered over steamed, frothy milk. Smooth, creamy and Instagram-worthy.", price: 200, unit: "1 cup", sortOrder: 2 },
  { slug: "chocolate-therapy", category: "coffee", name: "Chocolate Therapy (Hot Chocolate)", description: "Rich melted chocolate served warm for the ultimate comfort drink.", price: 200, unit: "1 cup", sortOrder: 3 },
  { slug: "affogato-vibes", category: "coffee", name: "Affogato Vibes (Cold Coffee with Ice Cream)", description: "Creamy cold coffee finished with your favourite scoop of ice cream.", price: 200, unit: "1 glass", sortOrder: 4, sizes: R_L(200, 270), addons: [{ name: "Whipped cream", price: 50 }] },
  // Burgers & sandwiches
  { slug: "house-burger", category: "burgers-sandwiches", name: "House Burger (Signature Chicken Burger)", description: "Succulent chicken patty, fresh toppings and our signature house sauce.", price: 350, unit: "1 burger", featured: true, sortOrder: 1 },
  { slug: "classic-stack", category: "burgers-sandwiches", name: "Classic Stack (Chicken Sandwich)", description: "Tender chicken layered inside perfectly toasted bread.", price: 220, unit: "1 sandwich", sortOrder: 2 },
  { slug: "ocean-club", category: "burgers-sandwiches", name: "Ocean Club (Tuna Sandwich)", description: "Creamy tuna filling paired with crisp vegetables.", price: 330, unit: "1 sandwich", sortOrder: 3 },
  { slug: "eggcellent", category: "burgers-sandwiches", name: "Eggcellent (Egg Sandwich)", description: "Soft eggs, simple flavours and everyday comfort.", price: 220, unit: "1 sandwich", sortOrder: 4 },
  { slug: "beef-boss", category: "burgers-sandwiches", name: "Beef Boss (Hunter Beef Sandwich)", description: "Juicy hunter beef stacked high with bold flavours.", price: 330, unit: "1 sandwich", sortOrder: 5 },
  // Ice-cream
  { slug: "ice-cream-burger", category: "ice-cream", name: "Ice-cream Burger", description: "Creamy ice cream tucked inside a warm bun.", price: 120, unit: "1 piece", featured: true, sortOrder: 1, choices: ICE_CREAM_FLAVOURS, addons: ICE_CREAM_ADDONS },
  { slug: "classic-soft-serve", category: "ice-cream", name: "Classic Soft Serve", description: "Rich, creamy ice cream freshly swirled into a crispy cone or cup. A timeless classic made to satisfy every craving.", price: 50, unit: "cone or cup", sortOrder: 2, sizes: [{ label: "Regular", price: 50 }, { label: "Medium", price: 100 }, { label: "Large", price: 150 }], choices: ICE_CREAM_FLAVOURS, addons: ICE_CREAM_ADDONS },
  // Slush
  { slug: "brain-freeze", category: "slush", name: "Brain Freeze (Fruit Slush)", description: "Ice-cold slush blended with bold fruit flavours for the perfect refresh.", price: 70, unit: "1 glass", sortOrder: 1, sizes: [{ label: "Medium", price: 70 }, { label: "Large", price: 100 }], choices: { label: "Flavour", options: ["Blueberry", "Cherry", "Strawberry", "Mango", "Peach", "Orange", "Pineapple", "Apple", "Pomegranate", "Lemon"] } },
  { slug: "chachas-special-slush", category: "slush", name: "Chacha's Special", description: "Our house favourite: plum, tamarind and badam mix, made from real fruits and served with icy goodness.", price: 80, unit: "1 glass", featured: true, sortOrder: 2, sizes: R_L(80, 120) },
  // Sip station
  { slug: "shake-it", category: "sip-station", name: "Shake It (Milkshakes)", description: "Thick, creamy shakes blended with real fruit puree or sauce and fresh full-cream milk.", price: 150, unit: "1 glass", sortOrder: 1, sizes: R_L(150, 220), choices: { label: "Flavour", options: ["Blueberry", "Cherry", "Strawberry", "Mango", "Peach", "Pineapple", "Chocolate", "Caramel", "Pistachio", "Banana"] }, addons: [{ name: "Whipped cream", price: 50 }] },
  { slug: "smooth-moves", category: "sip-station", name: "Smooth Moves (Fruit Smoothies)", description: "Real fruits or fruit purees blended with creamy yoghurt and bananas into a naturally refreshing drink.", price: 200, unit: "1 glass", sortOrder: 2, sizes: R_L(200, 270), choices: { label: "Flavour", options: ["Mango", "Strawberry", "Peach"] } },
  { slug: "desi-chill-lassi", category: "sip-station", name: "Desi Chill (Lassi)", description: "Fresh homemade yoghurt blended into Pakistan's favourite chilled classic.", price: 120, unit: "1 glass", sortOrder: 3, sizes: R_L(120, 200), choices: { label: "Taste", options: ["Sweet", "Salty"] } },
  // Fresh from the oven
  { slug: "chachas-favourite-patties", category: "fresh-from-the-oven", name: "Chacha's Favourite Patties & Bakes", description: "Fresh from the oven at the food display station. We confirm the price when we call or message you.", price: 0, unit: "1 piece", sortOrder: 1, choices: { label: "Item", options: ["Chicken Patty", "Vegetable Patty", "Signature Plain Cake (slice)", "Penny Fruit Cake (slice)", "Lemon Tart", "Black Forest Cake", "Tea Biscuits"] } },
  { slug: "butter-bun", category: "fresh-from-the-oven", name: "Butter Bun", description: "Warm toasted bun generously layered with creamy butter.", price: 120, unit: "1 bun", sortOrder: 2, addons: [{ name: "Egg", price: 70 }, { name: "Shami kabab", price: 80 }, { name: "Shami kabab and egg", price: 150 }] },
  { slug: "fruit-bun-with-butter", category: "fresh-from-the-oven", name: "Fruit Bun with Butter", description: "Soft, fluffy bun filled with sweet fruity goodness.", price: 130, unit: "1 bun", sortOrder: 3 },
  // Desi delights (priced at the food display station)
  { slug: "rabri-kheer", category: "desi-delights", name: "Rabri Kheer", description: "Creamy kheer finished with rich rabri for the perfect dessert.", price: 0, unit: "1 bowl", sortOrder: 1 },
  { slug: "dahi-bhalla", category: "desi-delights", name: "Dahi Bhalla", description: "Soft bhallas topped with creamy yoghurt and tangy chutneys.", price: 0, unit: "1 plate", sortOrder: 2 },
  { slug: "chana-chaat", category: "desi-delights", name: "Chana Chaat", description: "Chickpeas tossed with fresh herbs, spices and bold flavours.", price: 0, unit: "1 plate", sortOrder: 3 },
  // Daily meal special
  { slug: "meal-of-the-day", category: "daily-meal-special", name: "Meal of the Day", description: "Chacha's home-style meal, different every day. Add any Chacha's drink for Rs. 20 off.", price: 0, unit: "1 plate", featured: true, sortOrder: 1 },
];

/** Chacha's meal of the day from the menu card, Sunday first. Editable in the admin portal, Shop details. */
export const dailySpecials = ["Chicken Haleem", "Chicken Biryani", "Chicken Pasta", "Anda Chana", "Chicken Kabab", "Chicken Biryani", "Chicken Karahi"];

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
  dailySpecials,
};
