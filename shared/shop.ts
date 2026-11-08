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
  items: { name: string; quantity: number; lineTotal: number }[];
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
  const lines = [
    `Assalam-o-Alaikum Living Foods! I would like to place order ${order.orderNumber}.`,
    "",
    ...order.items.map(item => `${item.quantity} x ${item.name} - ${formatPKR(item.lineTotal)}`),
    `Packing: ${order.packingName}${order.packingPrice ? ` (+${formatPKR(order.packingPrice)})` : ""}`,
    `Delivery: ${order.deliveryFee ? formatPKR(order.deliveryFee) : "to be confirmed"}`,
    `Total: ${formatPKR(order.total)}`,
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
