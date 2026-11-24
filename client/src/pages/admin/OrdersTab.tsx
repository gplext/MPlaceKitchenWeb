import { MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { formatPKR, ORDER_CHANNEL_LABELS, ORDER_STATUS_LABELS, ORDER_STATUSES, whatsAppLink, type OrderStatus } from "@shared/shop";
import { trpc } from "@/lib/trpc";

export function OrdersTab() {
  const utils = trpc.useUtils();
  const orders = trpc.admin.orders.useQuery(undefined, { refetchInterval: 15_000 });
  const setStatus = trpc.admin.setOrderStatus.useMutation({ onSuccess: () => utils.admin.orders.invalidate() });
  const [filter, setFilter] = useState<OrderStatus | "open" | "all">("open");

  const rows = (orders.data ?? []).filter(order =>
    filter === "all" ? true : filter === "open" ? !["delivered", "cancelled"].includes(order.status) : order.status === filter);
  const count = (status: OrderStatus) => (orders.data ?? []).filter(order => order.status === status).length;

  return (
    <section className="admin-section">
      <div className="stat-row">
        <div className="stat"><span>New</span><strong>{count("new")}</strong></div>
        <div className="stat"><span>Preparing</span><strong>{count("confirmed") + count("preparing")}</strong></div>
        <div className="stat"><span>Out for delivery</span><strong>{count("out_for_delivery")}</strong></div>
        <div className="stat"><span>Delivered</span><strong>{count("delivered")}</strong></div>
      </div>
      <div className="toolbar">
        <label>Show <select value={filter} onChange={event => setFilter(event.target.value as typeof filter)}>
          <option value="open">Open orders</option>
          <option value="all">All orders</option>
          {ORDER_STATUSES.map(status => <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>)}
        </select></label>
        <span className="muted small">Refreshes every 15 seconds</span>
      </div>
      {orders.isLoading && <p className="muted">Loading orders…</p>}
      {orders.data && rows.length === 0 && <p className="muted">No orders here yet.</p>}
      <div className="order-list">
        {rows.map(order => (
          <article key={order.id} className={`order-row card status-border-${order.status}`}>
            <header>
              <div><strong>{order.orderNumber}</strong><small>{new Date(order.createdAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}</small></div>
              <span className={`channel channel-${order.channel}`}>{ORDER_CHANNEL_LABELS[order.channel]}</span>
              <select aria-label={`Status of ${order.orderNumber}`} value={order.status} disabled={setStatus.isPending} onChange={event => setStatus.mutate({ id: order.id, status: event.target.value as OrderStatus })}>
                {ORDER_STATUSES.map(status => <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>)}
              </select>
            </header>
            <div className="order-row-body">
              <div>
                <strong>{order.customerName}</strong>
                <p>{order.address}, {order.area}</p>
                {order.notes && <p className="muted">Note: {order.notes}</p>}
                <div className="row-actions">
                  <a className="btn btn-outline small" href={`tel:${order.phone.replace(/\s/g, "")}`}><Phone size={14} /> {order.phone}</a>
                  <a className="btn btn-outline small" href={whatsAppLink(order.phone, `Assalam-o-Alaikum ${order.customerName}, this is MPlace about your order ${order.orderNumber}.`)} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp</a>
                </div>
              </div>
              <ul>
                {order.items.map(item => <li key={item.id}><span>{item.quantity} × {item.name}{item.details && <small>{item.details}</small>}</span> <span>{item.unitPrice ? formatPKR(item.unitPrice * item.quantity) : "Price at counter"}</span></li>)}
                <li>Packing: {order.packingName} <span>{order.packingPrice ? formatPKR(order.packingPrice) : "Free"}</span></li>
                <li>Delivery <span>{order.deliveryFee ? formatPKR(order.deliveryFee) : "To confirm"}</span></li>
                <li className="total">Total <span>{formatPKR(order.total)}</span></li>
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
