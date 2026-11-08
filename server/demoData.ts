// Made-up demo catalogue for trying the shop out: products, prices, ingredients, nutrition and
// illustrated photos (drawn for this project, in server/demo-images). Everything here is invented.
// Load it with `pnpm db:demo`; remove it with `pnpm db:demo -- --remove`.

const FROZEN_SHELF = "Keep frozen at -18°C. Cook from frozen. Do not refreeze once thawed.";

export type DemoProduct = {
  slug: string;
  category: "dairy" | "frozen-foods" | "foods" | "desserts";
  name: string;
  description: string;
  price: number;
  unit: string;
  ingredients: string[];
  allergens: string[];
  dietary: string[];
  calories: number;
  servingSize: string;
  healthNotes: string;
  shelfLife: string;
  /** Days from today for a packed-stock expiry date; omitted for freshly made items. */
  expiresInDays?: number;
  featured?: boolean;
  sortOrder: number;
};

export const demoProducts: DemoProduct[] = [
  // Foods
  { slug: "biryani", category: "foods", name: "Biryani", description: "Fragrant basmati rice layered with spiced chicken, slow-cooked on dum with fried onions, mint and a touch of saffron.", price: 650, unit: "1 plate", ingredients: ["Basmati rice", "Chicken", "Yogurt", "Onions", "Tomatoes", "Ghee", "Mint", "Coriander", "Biryani spices"], allergens: ["Milk"], dietary: ["Halal", "Spicy", "Freshly made"], calories: 650, servingSize: "1 plate", healthNotes: "Calories are approximate.", shelfLife: "Best eaten within 2 hours. Refrigerate leftovers and eat within 24 hours.", featured: true, sortOrder: 1 },
  { slug: "bun-kebab", category: "foods", name: "Bun Kebab", description: "Lahore's street-side favourite: a spiced lentil and chicken kebab, egg and onion in a soft toasted bun with tamarind chutney.", price: 250, unit: "1 piece", ingredients: ["Bun", "Chicken and lentil kebab", "Egg", "Onion", "Tamarind chutney", "Ketchup"], allergens: ["Wheat (gluten)", "Egg"], dietary: ["Halal", "Contains egg", "Spicy", "Freshly made"], calories: 420, servingSize: "1 piece", healthNotes: "Calories are approximate.", shelfLife: "Best eaten hot, within 1 hour.", featured: true, sortOrder: 2 },
  { slug: "chicken-burger", category: "foods", name: "Chicken Burger", description: "A crisp golden chicken fillet with lettuce, cheese and house mayo in a sesame bun.", price: 450, unit: "1 burger", ingredients: ["Sesame bun", "Crispy chicken fillet", "Lettuce", "Cheese slice", "Tomato", "Mayonnaise"], allergens: ["Wheat (gluten)", "Egg", "Milk", "Sesame"], dietary: ["Halal", "Contains egg", "Freshly made"], calories: 560, servingSize: "1 burger", healthNotes: "Calories are approximate.", shelfLife: "Best eaten hot, within 1 hour.", sortOrder: 3 },
  { slug: "chicken-karahi", category: "foods", name: "Chicken Karahi", description: "Chicken cooked hot and fast in a karahi with tomatoes, ginger, garlic and green chillies. Serves 2 to 3 with naan or rice.", price: 1450, unit: "Half kg", ingredients: ["Chicken", "Tomatoes", "Ginger", "Garlic", "Green chillies", "Black pepper", "Oil", "Coriander"], allergens: [], dietary: ["Halal", "Spicy", "High protein", "Freshly made"], calories: 380, servingSize: "250 g", healthNotes: "Calories are approximate. Naan and rice are not included.", shelfLife: "Refrigerate and eat within 24 hours.", featured: true, sortOrder: 4 },
  { slug: "daal-chawal", category: "foods", name: "Daal Chawal", description: "Comforting yellow daal with a cumin and garlic tarka, served with steamed rice and a green chilli on the side.", price: 480, unit: "1 plate", ingredients: ["Rice", "Yellow lentils", "Onion", "Garlic", "Cumin", "Turmeric", "Oil", "Green chilli"], allergens: [], dietary: ["Halal", "Vegetarian", "Freshly made"], calories: 520, servingSize: "1 plate", healthNotes: "Calories are approximate.", shelfLife: "Refrigerate and eat within 24 hours.", sortOrder: 5 },
  { slug: "chicken-shawarma", category: "foods", name: "Chicken Shawarma", description: "Marinated chicken with garlic sauce, pickles, cabbage and a few fries, rolled in soft pita.", price: 380, unit: "1 wrap", ingredients: ["Pita bread", "Chicken", "Garlic sauce", "Pickles", "Cabbage", "Fries"], allergens: ["Wheat (gluten)", "Egg", "Sesame"], dietary: ["Halal", "Contains egg", "Freshly made"], calories: 610, servingSize: "1 wrap", healthNotes: "Calories are approximate.", shelfLife: "Best eaten within 1 hour.", sortOrder: 6 },

  // Desserts
  { slug: "banana-cake", category: "desserts", name: "Banana Cake", description: "A soft, moist banana loaf with walnuts, baked in small batches and topped with banana slices.", price: 900, unit: "1 loaf", ingredients: ["Flour", "Bananas", "Sugar", "Eggs", "Butter", "Walnuts", "Baking soda"], allergens: ["Wheat (gluten)", "Egg", "Milk", "Nuts"], dietary: ["Contains egg"], calories: 320, servingSize: "1 slice", healthNotes: "Calories are approximate. About 8 slices per loaf.", shelfLife: "Keeps 3 days in an airtight box, or 5 days refrigerated.", sortOrder: 1 },
  { slug: "chocolate-brownie", category: "desserts", name: "Chocolate Brownie", description: "Dense, fudgy dark chocolate brownie with a crackly top.", price: 250, unit: "1 piece", ingredients: ["Dark chocolate", "Butter", "Sugar", "Eggs", "Flour", "Cocoa"], allergens: ["Wheat (gluten)", "Egg", "Milk"], dietary: ["Contains egg"], calories: 290, servingSize: "1 piece", healthNotes: "Calories are approximate.", shelfLife: "Keeps 4 days in an airtight box.", featured: true, sortOrder: 2 },
  { slug: "kheer", category: "desserts", name: "Kheer", description: "Slow-cooked rice pudding with cardamom, finished with almonds and pistachios. Served chilled.", price: 350, unit: "250 g bowl", ingredients: ["Milk", "Rice", "Sugar", "Cardamom", "Almonds", "Pistachios"], allergens: ["Milk", "Nuts"], dietary: ["Vegetarian"], calories: 330, servingSize: "1 bowl", healthNotes: "Calories are approximate.", shelfLife: "Keep refrigerated. Eat within 2 days.", sortOrder: 3 },
  { slug: "gulab-jamun", category: "desserts", name: "Gulab Jamun", description: "Soft khoya dumplings soaked in rose and cardamom syrup.", price: 600, unit: "Box of 6", ingredients: ["Khoya (milk solids)", "Flour", "Ghee", "Sugar syrup", "Cardamom", "Rose water"], allergens: ["Milk", "Wheat (gluten)"], dietary: ["Vegetarian"], calories: 150, servingSize: "1 piece", healthNotes: "Calories are approximate.", shelfLife: "Keeps 4 days at room temperature, longer refrigerated.", featured: true, sortOrder: 4 },
  { slug: "gajar-ka-halwa", category: "desserts", name: "Gajar ka Halwa", description: "Winter's favourite: grated carrots slow-cooked in milk and ghee with khoya and almonds.", price: 900, unit: "500 g", ingredients: ["Carrots", "Milk", "Sugar", "Ghee", "Khoya", "Almonds", "Cardamom"], allergens: ["Milk", "Nuts"], dietary: ["Vegetarian"], calories: 360, servingSize: "100 g", healthNotes: "Calories are approximate.", shelfLife: "Keep refrigerated. Eat within 5 days. Warm before serving.", sortOrder: 5 },

  // Dairy
  { slug: "fresh-milk", category: "dairy", name: "Fresh Milk", description: "Fresh cow milk from the Living Foods farm, bottled the same morning.", price: 220, unit: "1 litre", ingredients: ["Fresh cow milk"], allergens: ["Milk"], dietary: ["Vegetarian"], calories: 64, servingSize: "100 ml", healthNotes: "Calories are approximate. Unprocessed: boil before drinking.", shelfLife: "Keep refrigerated and use within 2 days.", featured: true, sortOrder: 1 },
  { slug: "desi-dahi", category: "dairy", name: "Desi Dahi", description: "Thick yogurt set overnight in a clay pot, the way it is made at home.", price: 300, unit: "1 kg clay pot", ingredients: ["Milk", "Live yogurt cultures"], allergens: ["Milk"], dietary: ["Vegetarian"], calories: 61, servingSize: "100 g", healthNotes: "Calories are approximate.", shelfLife: "Keep refrigerated. Best within 4 days.", sortOrder: 2 },
  { slug: "sweet-lassi", category: "dairy", name: "Sweet Lassi", description: "Chilled yogurt lassi whisked with a little sugar and cardamom, topped with malai.", price: 180, unit: "300 ml", ingredients: ["Yogurt", "Milk", "Sugar", "Cardamom", "Malai"], allergens: ["Milk"], dietary: ["Vegetarian"], calories: 210, servingSize: "1 glass", healthNotes: "Calories are approximate.", shelfLife: "Keep chilled and drink the same day.", featured: true, sortOrder: 3 },
  { slug: "desi-makhan", category: "dairy", name: "Desi Makhan", description: "Hand-churned white butter made from farm cream. Perfect on parathas.", price: 650, unit: "250 g", ingredients: ["Cream from cow milk", "Salt"], allergens: ["Milk"], dietary: ["Vegetarian"], calories: 717, servingSize: "100 g", healthNotes: "Calories are approximate. High in saturated fat; enjoy in moderation.", shelfLife: "Keep refrigerated. Use within 2 weeks.", expiresInDays: 14, sortOrder: 4 },
  { slug: "fresh-paneer", category: "dairy", name: "Fresh Paneer", description: "Soft, fresh cottage cheese pressed in-house, ready for karahi or tikka.", price: 550, unit: "250 g", ingredients: ["Milk", "Lemon juice"], allergens: ["Milk"], dietary: ["Vegetarian", "High protein"], calories: 265, servingSize: "100 g", healthNotes: "Calories are approximate.", shelfLife: "Keep refrigerated in water. Use within 4 days.", sortOrder: 5 },
  { slug: "desi-ghee", category: "dairy", name: "Desi Ghee", description: "Golden clarified butter, slow-cooked from farm butter for a nutty aroma.", price: 1600, unit: "500 g jar", ingredients: ["Clarified butter from cow milk"], allergens: ["Milk"], dietary: ["Vegetarian"], calories: 900, servingSize: "100 g", healthNotes: "Calories are approximate. High in saturated fat; enjoy in moderation.", shelfLife: "Store in a cool, dry place with the lid closed.", expiresInDays: 180, sortOrder: 6 },

  // Frozen foods
  { slug: "chicken-seekh-kebab", category: "frozen-foods", name: "Chicken Seekh Kebab", description: "Spiced chicken mince kebabs, ready to grill, air-fry or pan-fry in minutes.", price: 1100, unit: "Pack of 12", ingredients: ["Chicken mince", "Onion", "Ginger", "Garlic", "Green chilli", "Spices"], allergens: [], dietary: ["Halal", "Spicy", "High protein"], calories: 140, servingSize: "1 kebab", healthNotes: "Calories are approximate.", shelfLife: FROZEN_SHELF, expiresInDays: 90, featured: true, sortOrder: 1 },
  { slug: "chicken-nuggets", category: "frozen-foods", name: "Chicken Nuggets", description: "Breaded chicken breast nuggets. Fry or air-fry from frozen for a quick snack.", price: 950, unit: "500 g", ingredients: ["Chicken breast", "Breadcrumbs", "Flour", "Egg", "Spices"], allergens: ["Wheat (gluten)", "Egg"], dietary: ["Halal", "Contains egg"], calories: 270, servingSize: "100 g", healthNotes: "Calories are approximate, before frying.", shelfLife: FROZEN_SHELF, expiresInDays: 90, sortOrder: 2 },
  { slug: "aloo-samosa", category: "frozen-foods", name: "Aloo Samosa", description: "Crisp pastry filled with spiced potatoes and peas. Fry straight from frozen.", price: 650, unit: "Pack of 12", ingredients: ["Flour", "Potatoes", "Peas", "Onion", "Spices", "Oil"], allergens: ["Wheat (gluten)"], dietary: ["Vegetarian", "Spicy"], calories: 130, servingSize: "1 samosa", healthNotes: "Calories are approximate, after frying.", shelfLife: FROZEN_SHELF, expiresInDays: 90, sortOrder: 3 },
  { slug: "chicken-shami-kebab", category: "frozen-foods", name: "Chicken Shami Kebab", description: "Soft chicken and chana daal kebabs, egg-coated and ready to shallow fry.", price: 1000, unit: "Pack of 12", ingredients: ["Chicken", "Chana daal", "Egg", "Onion", "Spices"], allergens: ["Egg"], dietary: ["Halal", "Contains egg", "High protein"], calories: 110, servingSize: "1 kebab", healthNotes: "Calories are approximate.", shelfLife: FROZEN_SHELF, expiresInDays: 90, sortOrder: 4 },
  { slug: "plain-paratha", category: "frozen-foods", name: "Plain Paratha", description: "Flaky layered parathas made with ghee. Cook on a hot tawa from frozen.", price: 450, unit: "Pack of 5", ingredients: ["Wheat flour", "Ghee", "Salt", "Water"], allergens: ["Wheat (gluten)", "Milk"], dietary: ["Vegetarian"], calories: 260, servingSize: "1 paratha", healthNotes: "Calories are approximate.", shelfLife: FROZEN_SHELF, expiresInDays: 90, sortOrder: 5 },
  { slug: "chicken-spring-rolls", category: "frozen-foods", name: "Chicken Spring Rolls", description: "Crunchy rolls filled with chicken and stir-fried vegetables.", price: 800, unit: "Pack of 12", ingredients: ["Spring roll sheets", "Chicken", "Cabbage", "Carrots", "Capsicum", "Soy sauce"], allergens: ["Wheat (gluten)", "Soy"], dietary: ["Halal"], calories: 90, servingSize: "1 roll", healthNotes: "Calories are approximate, after frying.", shelfLife: FROZEN_SHELF, expiresInDays: 90, sortOrder: 6 },
];

/** Packing photo shown on each product page, by category. */
export const packingImageFor: Record<DemoProduct["category"], string> = {
  foods: "packing-box",
  desserts: "packing-dessert-box",
  dairy: "packing-insulated-bag",
  "frozen-foods": "packing-insulated-bag",
};

/** Photos for the two starter packing options, by name. */
export const packingOptionImages: Record<string, string> = {
  "Standard box": "packing-box",
  "Insulated bag with ice packs": "packing-insulated-bag",
};

/** Products the plain starter seed also creates; the demo only fills in their empty details. */
export const STARTER_SLUGS = new Set(["biryani", "bun-kebab", "chicken-burger", "banana-cake", "chocolate-brownie"]);
