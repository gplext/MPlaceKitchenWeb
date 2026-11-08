import { ClipboardList, LayoutGrid, LogOut, PackageCheck, Settings, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { Link, Redirect } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePageTitle } from "@/lib/usePageTitle";
import { CategoriesTab } from "./CategoriesTab";
import { OrdersTab } from "./OrdersTab";
import { PackingTab } from "./PackingTab";
import { ProductsTab } from "./ProductsTab";
import { SettingsTab } from "./SettingsTab";

const TABS = [
  { key: "orders", label: "Orders", icon: ClipboardList, component: OrdersTab },
  { key: "products", label: "Products", icon: UtensilsCrossed, component: ProductsTab },
  { key: "categories", label: "Categories", icon: LayoutGrid, component: CategoriesTab },
  { key: "packing", label: "Packing", icon: PackageCheck, component: PackingTab },
  { key: "settings", label: "Shop details", icon: Settings, component: SettingsTab },
] as const;

export function AdminPage() {
  usePageTitle("Admin portal");
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("orders");
  if (loading) return <div className="app-loading" role="status">Loading…</div>;
  if (!user) return <Redirect to="/sign-in" />;
  if (user.role !== "admin") {
    return <section className="page-message container"><h1>This area is for shop admins.</h1><p>You are signed in as {user.email}.</p><Link href="/account" className="btn btn-primary">Go to your account</Link></section>;
  }
  const Active = TABS.find(item => item.key === tab)!.component;

  return (
    <div className="admin container">
      <div className="page-head row">
        <div><span className="eyebrow">Living Foods</span><h1>Admin portal</h1></div>
        <button type="button" className="btn btn-outline" onClick={() => void logout()}><LogOut size={16} /> Sign out</button>
      </div>
      <nav className="admin-tabs" role="tablist" aria-label="Admin sections">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><Icon size={17} /> {label}</button>
        ))}
      </nav>
      <Active />
    </div>
  );
}
