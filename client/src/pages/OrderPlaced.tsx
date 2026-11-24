import { CheckCircle2, MessageCircle, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { buildOrderMessage, formatPKR, ORDER_STATUS_LABELS, whatsAppLink } from "@shared/shop";
import { useCatalog } from "@/catalog";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/lib/usePageTitle";
import type { CreatedOrder } from "@/types";

const storageKey = (orderNumber: string) => `mplace-order-${orderNumber}`;

/** Keeps the full order (with the customer's own details) in this tab, so the WhatsApp message can include them. */
export function rememberOrder(order: CreatedOrder) {
  try { window.sessionStorage.setItem(storageKey(order.orderNumber!), JSON.stringify(order)); } catch { /* storage unavailable */ }
}

function recalled(orderNumber: string): CreatedOrder | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey(orderNumber));
    return raw ? (JSON.parse(raw) as CreatedOrder) : null;
  } catch {
    return null;
  }
}

export function OrderPlacedPage() {
  const { number } = useParams<{ number: string }>();
  const { shop } = useCatalog();
  usePageTitle(`Order ${number}`);
  const [full] = useState(() => recalled(number));
  // Without the remembered copy (another device, a new tab) the order is fetched without personal details.
  const lookup = trpc.orders.byNumber.useQuery({ orderNumber: number }, { enabled: !full, retry: false });
  const order = full ?? lookup.data;

  const message = full
    ? buildOrderMessage({ ...full, orderNumber: full.orderNumber!, items: full.items.map(item => ({ name: item.name, quantity: item.quantity, lineTotal: item.unitPrice * item.quantity, details: item.details, priceOnRequest: item.unitPrice === 0 })) })
    : `Assalam-o-Alaikum MPlace! I'm following up on order ${number}.`;
  const sendLink = whatsAppLink(shop.whatsapp, message);

  // Try to open WhatsApp straight away for WhatsApp orders; the button below works if the browser blocks it.
  useEffect(() => {
    if (full?.channel === "whatsapp") window.open(sendLink, "_blank", "noopener");
    // Only once, when the page first shows a fresh WhatsApp order.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!order) {
    return <section className="page-message container">{lookup.isError ? <><h1>We could not find that order.</h1><Link href="/menu" className="btn btn-neon">Back to the menu</Link></> : <p>Loading your order…</p>}</section>;
  }

  return (
    <div className="order-page container">
      <div className="order-card card">
        <CheckCircle2 className="order-check" size={44} />
        <span className="label">Order {order.orderNumber}</span>
        {order.channel === "whatsapp" ? (
          <>
            <h1>One last step: send it on WhatsApp.</h1>
            <p>Your order is saved. Tap the button to send it to MPlace, and we'll reply to confirm the delivery time.</p>
            <a href={sendLink} target="_blank" rel="noreferrer" className="btn btn-teal big"><MessageCircle size={20} /> Send order on WhatsApp</a>
          </>
        ) : (
          <>
            <h1>Thank you! We'll call you shortly.</h1>
            <p>We'll call {full ? <strong>{full.phone}</strong> : "you"} to confirm your order and delivery time.</p>
            <a href={`tel:${shop.phone.replace(/\s/g, "")}`} className="btn btn-neon big"><Phone size={20} /> Or call us on {shop.phone}</a>
          </>
        )}
        <p className="status-line">Status: <strong>{ORDER_STATUS_LABELS[order.status]}</strong></p>
        <ul className="order-lines">
          {order.items.map(item => <li key={item.id}><span>{item.quantity} × {item.name}{item.details && <small>{item.details}</small>}</span><span>{item.unitPrice ? formatPKR(item.unitPrice * item.quantity) : "On call"}</span></li>)}
          <li><span>Packing: {order.packingName}</span><span>{order.packingPrice ? formatPKR(order.packingPrice) : "Free"}</span></li>
          <li><span>Delivery</span><span>{order.deliveryFee ? formatPKR(order.deliveryFee) : "Confirmed with you"}</span></li>
          <li className="total"><span>Total, cash on delivery</span><span>{formatPKR(order.total)}</span></li>
        </ul>
        <Link href="/menu" className="btn btn-ghost">Back to the menu</Link>
      </div>
    </div>
  );
}
