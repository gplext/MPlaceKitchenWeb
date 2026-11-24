import { LogOut } from "lucide-react";
import { Link, Redirect } from "wouter";
import { formatPKR, ORDER_CHANNEL_LABELS, ORDER_STATUS_LABELS } from "@shared/shop";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/lib/usePageTitle";

export function AccountPage() {
  usePageTitle("Your account");
  const { user, loading, logout } = useAuth();
  const orders = trpc.orders.mine.useQuery(undefined, { enabled: Boolean(user) });
  if (loading) return <div className="app-loading" role="status">Loading…</div>;
  if (!user) return <Redirect to="/sign-in" />;

  return (
    <div className="account-page container">
      <div className="page-head row">
        <div><span className="label">Your account</span><h1>Assalam-o-Alaikum, {user.name || "friend"}</h1></div>
        <div className="row-actions">
          {user.role === "admin" && <Link href="/admin" className="btn btn-outline">Admin portal</Link>}
          <button type="button" className="btn btn-outline" onClick={() => void logout()}><LogOut size={16} /> Sign out</button>
        </div>
      </div>
      <section className="card">
        <h2>Your orders</h2>
        {orders.isLoading && <p className="muted">Loading orders…</p>}
        {orders.data?.length === 0 && <p className="muted">No orders yet. <Link href="/menu">Browse the menu</Link>.</p>}
        <ul className="account-orders">
          {orders.data?.map(order => (
            <li key={order.id}>
              <div><strong>{order.orderNumber}</strong><small>{new Date(order.createdAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })} · {ORDER_CHANNEL_LABELS[order.channel]}</small></div>
              <span>{order.items.map(item => `${item.quantity} × ${item.name}${item.details ? ` (${item.details})` : ""}`).join(", ")}</span>
              <span className={`status status-${order.status}`}>{ORDER_STATUS_LABELS[order.status]}</span>
              <strong>{formatPKR(order.total)}</strong>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
