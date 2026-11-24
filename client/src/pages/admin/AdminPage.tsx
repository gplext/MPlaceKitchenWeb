import { Bell, BellOff, ChefHat, ClipboardList, LayoutGrid, LogOut, PackageCheck, Settings, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { Link, Redirect } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePageTitle } from "@/lib/usePageTitle";
import { BookingsTab } from "./BookingsTab";
import { CategoriesTab } from "./CategoriesTab";
import { OrdersTab } from "./OrdersTab";
import { PackingTab } from "./PackingTab";
import { ProductsTab } from "./ProductsTab";
import { SettingsTab } from "./SettingsTab";
import { useOrderAlerts } from "./useOrderAlerts";

const TABS = [
  { key: "orders", label: "Orders", icon: ClipboardList, component: OrdersTab },
  { key: "products", label: "Products", icon: UtensilsCrossed, component: ProductsTab },
  { key: "categories", label: "Categories", icon: LayoutGrid, component: CategoriesTab },
  { key: "packing", label: "Packing", icon: PackageCheck, component: PackingTab },
  { key: "bookings", label: "Kitchen hire", icon: ChefHat, component: BookingsTab },
  { key: "settings", label: "Shop details", icon: Settings, component: SettingsTab },
] as const;

export function AdminPage() {
  usePageTitle("Admin portal");
  const { user, loading, logout } = useAuth();
  if (loading) return <div className="app-loading" role="status">Loading…</div>;
  if (!user) return <Redirect to="/sign-in" />;
  if (user.role !== "admin") {
    return <section className="page-message container"><h1>This area is for shop admins.</h1><p>You are signed in as {user.email}.</p><Link href="/account" className="btn btn-primary">Go to your account</Link></section>;
  }
  return <AdminPortal onSignOut={() => void logout()} />;
}

/** Only rendered for admins, so the order watcher never runs for anyone else. */
function AdminPortal({ onSignOut }: { onSignOut: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("orders");
  const alerts = useOrderAlerts();
  const Active = TABS.find(item => item.key === tab)!.component;

  return (
    <div className="admin container">
      <div className="page-head row">
        <div><span className="label">MPlace</span><h1>Admin portal</h1></div>
        <button type="button" className="btn btn-outline" onClick={onSignOut}><LogOut size={16} /> Sign out</button>
      </div>
      <div className={`alert-bar card ${alerts.enabled ? "on" : ""}`} role="status">
        {alerts.enabled ? <Bell size={18} /> : <BellOff size={18} />}
        <p>
          {alerts.enabled
            ? <>New-order alerts are on: a chime{alerts.permission === "granted" ? " and a desktop notification" : ""} while this page is open.
              {alerts.permission === "denied" && <> Notifications are blocked in this browser; allow them in the site settings to get pop-ups too.</>}
              {alerts.permission === "unsupported" && <> This browser cannot show notifications, so you will hear the chime only.</>}</>
            : <>Turn on alerts to hear a chime and get a notification when an order comes in while this page is open.</>}
        </p>
        {alerts.enabled
          ? <span className="row-actions"><button type="button" className="btn btn-outline small" onClick={() => void alerts.test()}>Test sound</button><button type="button" className="btn btn-outline small" onClick={alerts.turnOff}>Turn off</button></span>
          : <button type="button" className="btn btn-primary small" onClick={() => void alerts.turnOn()}>Turn on alerts</button>}
      </div>
      <nav className="admin-tabs" role="tablist" aria-label="Admin sections">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
            <Icon size={17} /> {label}
            {key === "orders" && alerts.newCount > 0 && <span className="tab-badge" aria-label={`${alerts.newCount} new`}>{alerts.newCount}</span>}
          </button>
        ))}
      </nav>
      <Active />
    </div>
  );
}
