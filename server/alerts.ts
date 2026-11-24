// Tells the shop about new orders by email and WhatsApp, so nobody has to watch the admin portal.
// Each channel is switched on by its environment variables (see README, "Order alerts").
// Alerts are sent after the order is saved and never hold up or fail the customer's checkout.
import nodemailer from "nodemailer";
import { formatPKR, ORDER_CHANNEL_LABELS, toWhatsAppDigits, type OrderChannel } from "../shared/shop";

export type AlertOrder = {
  orderNumber: string | null;
  channel: OrderChannel;
  customerName: string;
  phone: string;
  address: string;
  area: string;
  notes: string | null;
  packingName: string;
  total: number;
  items: { name: string; quantity: number; details?: string | null }[];
};

export type AlertResult = { channel: "email" | "whatsapp"; ok: boolean; detail: string };

const list = (value: string | undefined) => (value ?? "").split(",").map(part => part.trim()).filter(Boolean);

/** Read at use time, so a changed Coolify variable takes effect on the next deploy without code changes. */
const config = {
  get email() {
    const host = process.env.SMTP_HOST?.trim();
    const to = list(process.env.ALERT_EMAIL_TO);
    if (!host || to.length === 0) return null;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER?.trim() || undefined;
    return {
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass: process.env.SMTP_PASS ?? "" } : undefined,
      from: process.env.ALERT_EMAIL_FROM?.trim() || user || `orders@${host}`,
      to,
    };
  },
  get whatsapp() {
    const token = process.env.WHATSAPP_TOKEN?.trim();
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
    const to = list(process.env.ALERT_WHATSAPP_TO).map(toWhatsAppDigits).filter(Boolean);
    if (!token || !phoneNumberId || to.length === 0) return null;
    const version = process.env.WHATSAPP_API_VERSION?.trim() || "v24.0";
    const base = (process.env.WHATSAPP_API_URL?.trim() || "https://graph.facebook.com").replace(/\/$/, "");
    return {
      token,
      url: `${base}/${version}/${phoneNumberId}/messages`,
      to,
      template: process.env.WHATSAPP_TEMPLATE?.trim() || "new_order_alert",
      language: process.env.WHATSAPP_TEMPLATE_LANG?.trim() || "en",
    };
  },
};

/** What the admin portal shows: which channels are on and who receives them. No secrets. */
export function alertStatus() {
  const email = config.email;
  const whatsapp = config.whatsapp;
  return {
    email: email ? { on: true as const, to: email.to } : { on: false as const, to: [] as string[] },
    whatsapp: whatsapp ? { on: true as const, to: whatsapp.to.map(number => `+${number}`), template: whatsapp.template } : { on: false as const, to: [] as string[], template: null },
  };
}

const itemLabel = (item: AlertOrder["items"][number]) => `${item.quantity} x ${item.name}${item.details ? ` (${item.details})` : ""}`;
const itemsLine = (order: AlertOrder) => order.items.map(itemLabel).join(", ");

/** The email body: everything needed to call the customer and start preparing. */
export function orderAlertText(order: AlertOrder): string {
  const lines = [
    `New order ${order.orderNumber} (${ORDER_CHANNEL_LABELS[order.channel]})`,
    "",
    ...order.items.map(itemLabel),
    `Packing: ${order.packingName}`,
    `Total: ${formatPKR(order.total)}`,
    "",
    `Customer: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address}, ${order.area}`,
  ];
  if (order.notes) lines.push(`Notes: ${order.notes}`);
  lines.push("", order.channel === "phone"
    ? "The customer is waiting for a call to confirm."
    : "The customer is sending this order on WhatsApp too.");
  return lines.join("\n");
}

/**
 * WhatsApp template values may not contain new lines, tabs or more than four spaces in a row, and may not be empty.
 * Long values are cut so the whole message stays well under WhatsApp's limit.
 */
export function templateValue(value: string, max = 300): string {
  const clean = value
    .split(/[\r\n\t]+/)
    .map(part => part.replace(/ {2,}/g, " ").trim().replace(/,$/, ""))
    .filter(Boolean)
    .join(", ");
  if (!clean) return "-";
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/** The six values for the approved template, in order: {{1}} … {{6}}. */
export function whatsAppTemplateValues(order: AlertOrder): string[] {
  return [
    order.orderNumber ?? "-",
    order.customerName,
    order.phone,
    `${order.address}, ${order.area}`,
    itemsLine(order),
    `${formatPKR(order.total)} (${ORDER_CHANNEL_LABELS[order.channel]})`,
  ].map(value => templateValue(value));
}

async function sendEmail(order: AlertOrder): Promise<AlertResult> {
  const email = config.email;
  if (!email) return { channel: "email", ok: false, detail: "Not set up" };
  const transport = nodemailer.createTransport({
    host: email.host,
    port: email.port,
    secure: email.secure,
    auth: email.auth,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  await transport.sendMail({
    from: email.from,
    to: email.to,
    subject: `New order ${order.orderNumber}: ${formatPKR(order.total)}, ${order.customerName}`,
    text: orderAlertText(order),
  });
  return { channel: "email", ok: true, detail: `Sent to ${email.to.join(", ")}` };
}

async function sendWhatsApp(order: AlertOrder): Promise<AlertResult> {
  const whatsapp = config.whatsapp;
  if (!whatsapp) return { channel: "whatsapp", ok: false, detail: "Not set up" };
  const parameters = whatsAppTemplateValues(order).map(text => ({ type: "text", text }));
  const failures: string[] = [];
  for (const to of whatsapp.to) {
    const response = await fetch(whatsapp.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${whatsapp.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: { name: whatsapp.template, language: { code: whatsapp.language }, components: [{ type: "body", parameters }] },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      failures.push(`+${to}: ${body?.error?.message ?? `HTTP ${response.status}`}`);
    }
  }
  if (failures.length > 0) throw new Error(failures.join("; "));
  return { channel: "whatsapp", ok: true, detail: `Sent to ${whatsapp.to.map(number => `+${number}`).join(", ")}` };
}

/** Sends every alert that is set up and reports each one. Never throws. */
export async function sendOrderAlerts(order: AlertOrder): Promise<AlertResult[]> {
  const jobs: [AlertResult["channel"], () => Promise<AlertResult>][] = [];
  if (config.email) jobs.push(["email", () => sendEmail(order)]);
  if (config.whatsapp) jobs.push(["whatsapp", () => sendWhatsApp(order)]);
  const settled = await Promise.allSettled(jobs.map(([, run]) => run()));
  return settled.map((outcome, index) => {
    if (outcome.status === "fulfilled") return outcome.value;
    const channel = jobs[index][0];
    const detail = outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason);
    console.error(`[alerts] ${channel} alert for ${order.orderNumber} failed: ${detail}`);
    return { channel, ok: false, detail };
  });
}

/** A made-up order for the "Send test alert" button. */
export const SAMPLE_ORDER: AlertOrder = {
  orderNumber: "TEST-0000",
  channel: "phone",
  customerName: "Test customer",
  phone: "0300 0000000",
  address: "This is a test alert from the admin portal",
  area: "Mall Road",
  notes: null,
  packingName: "Standard box",
  total: 1250,
  items: [{ name: "Chicken Biryani", quantity: 2 }, { name: "Chocolate Brownie", quantity: 1 }],
};
