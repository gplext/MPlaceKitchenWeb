// Shop rules shared by the server (which enforces them) and the browser (which displays them).

export const ORDER_STATUSES = ["new", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const BOOKING_STATUSES = ["new", "confirmed", "declined", "done"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = { new: "New", confirmed: "Confirmed", declined: "Declined", done: "Done" };
export const BOOKING_HOURS = [2, 4, 6, 8] as const;

/** How the customer chose to send the order. */
export const ORDER_CHANNELS = ["whatsapp", "phone"] as const;
export type OrderChannel = (typeof ORDER_CHANNELS)[number];
export const ORDER_CHANNEL_LABELS: Record<OrderChannel, string> = { whatsapp: "WhatsApp", phone: "Phone call" };

/** Common allergens, offered as tick boxes in the admin portal. */
export const ALLERGENS = ["Milk", "Egg", "Wheat (gluten)", "Nuts", "Peanuts", "Soy", "Sesame", "Fish", "Shellfish", "Mustard"] as const;
/** Dietary labels, offered as tick boxes in the admin portal. */
export const DIETARY_TAGS = ["Halal", "Vegetarian", "Contains egg", "Spicy", "Sugar-free", "High protein", "Freshly made"] as const;

/** Photos the admin portal may upload. */
export const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const formatPKR = (amount: number) => `PKR ${amount.toLocaleString("en-PK")}`;

/** Kitchens (departments) that group the menu categories. Admins may type another name. */
export const KITCHENS = ["Chacha's", "Dairy Shop", "MPlace Kitchen", "Ready-made"] as const;
export const DEFAULT_KITCHEN = "MPlace Kitchen";

/** Sunday first, matching Date.getDay(). */
export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/** Customer choices a product can offer. Sizes replace the base price; add-ons are added to it. */
export type ProductSize = { label: string; price: number };
/** `images` optionally maps an option to its own photo (e.g. each slush flavour). */
export type ProductChoice = { label: string; options: string[]; images?: Record<string, string> };
export type ProductAddon = { name: string; price: number };
export type ProductOptions = { price: number; sizes: ProductSize[] | null; choices: ProductChoice | null; addons: ProductAddon[] | null };
export type Selection = { size?: string | null; choice?: string | null; addons?: string[] | null };

export const hasOptions = (product: Pick<ProductOptions, "sizes" | "choices" | "addons">) =>
  Boolean(product.sizes?.length || product.choices?.options.length || product.addons?.length);

/** A price of 0 means the shop tells the customer the price (e.g. items on the food display counter). */
export const isPriceOnRequest = (product: Pick<ProductOptions, "price" | "sizes">) => !product.sizes?.length && product.price === 0;

/** Lowest price a customer can pay, for "from PKR 50" labels. */
export const startingPrice = (product: Pick<ProductOptions, "price" | "sizes">) =>
  product.sizes?.length ? Math.min(...product.sizes.map(size => size.price)) : product.price;

/** Checks a selection against the product and works out one unit's price. Throws a readable message when the selection does not fit. */
export function priceFor(product: ProductOptions, selection: Selection = {}): { unitPrice: number; details: string } {
  const parts: string[] = [];
  let unitPrice = product.price;
  if (product.sizes?.length) {
    const size = product.sizes.find(option => option.label === selection.size);
    if (!size) throw new Error("Please choose a size.");
    unitPrice = size.price;
    parts.push(size.label);
  } else if (selection.size) throw new Error("This item has no sizes.");
  if (product.choices?.options.length) {
    if (!selection.choice || !product.choices.options.includes(selection.choice)) throw new Error(`Please choose a ${product.choices.label.toLowerCase() || "flavour"}.`);
    parts.push(selection.choice);
  } else if (selection.choice) throw new Error("This item has no options to choose.");
  for (const name of [...new Set(selection.addons ?? [])]) {
    const addon = product.addons?.find(option => option.name === name);
    if (!addon) throw new Error("An add-on is no longer available.");
    unitPrice += addon.price;
    parts.push(`+ ${addon.name}`);
  }
  return { unitPrice, details: parts.join(" · ") };
}

/** Same product with the same choices is one bag line. */
/** The photo for what the customer picked, falling back to the product photo. */
export const photoFor = (product: { image: string | null; choices: ProductChoice | null }, choice?: string | null) =>
  (choice && product.choices?.images?.[choice]) || product.image;

export const selectionKey = (productId: number, selection: Selection = {}) =>
  [productId, selection.size ?? "", selection.choice ?? "", [...(selection.addons ?? [])].sort().join("+")].join("|");

/** Delivery charge for an order. A threshold of 0 means delivery is never free automatically. */
export const deliveryFeeFor = (subtotal: number, fee: number, freeOver: number) =>
  subtotal === 0 || (freeOver > 0 && subtotal >= freeOver) ? 0 : fee;

/** Turns a Pakistani number as people type it (0345 1234567, +92 345-1234567) into the digits wa.me expects: 923451234567. */
export function toWhatsAppDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0092")) return digits.slice(2);
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}

export type OrderMessage = {
  orderNumber: string;
  items: { name: string; quantity: number; lineTotal: number; details?: string | null; priceOnRequest?: boolean }[];
  packingName: string;
  packingPrice: number;
  deliveryFee: number;
  total: number;
  customerName: string;
  phone: string;
  address: string;
  area: string;
  notes?: string | null;
};

/** The WhatsApp message a customer sends to place an order. Plain text so it reads well in any WhatsApp client. */
export function buildOrderMessage(order: OrderMessage): string {
  const askPrice = order.items.some(item => item.priceOnRequest);
  const lines = [
    `Assalam-o-Alaikum MPlace! I would like to place order ${order.orderNumber}.`,
    "",
    ...order.items.map(item => `${item.quantity} x ${item.name}${item.details ? ` (${item.details})` : ""} - ${item.priceOnRequest ? "price to confirm" : formatPKR(item.lineTotal)}`),
    `Packing: ${order.packingName}${order.packingPrice ? ` (+${formatPKR(order.packingPrice)})` : ""}`,
    `Delivery: ${order.deliveryFee ? formatPKR(order.deliveryFee) : "to be confirmed"}`,
    `Total: ${formatPKR(order.total)}${askPrice ? " + items priced on confirmation" : ""}`,
    "",
    `Name: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address}, ${order.area}`,
  ];
  if (order.notes) lines.push(`Notes: ${order.notes}`);
  return lines.join("\n");
}

export const whatsAppLink = (number: string, message?: string) =>
  `https://wa.me/${toWhatsAppDigits(number)}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
