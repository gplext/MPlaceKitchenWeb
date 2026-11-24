import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { useCatalog, type Kitchen } from "@/catalog";
import { ProductRow } from "@/components/ProductRow";
import { usePageTitle } from "@/lib/usePageTitle";
import { NotFoundPage } from "./NotFound";

export function MenuPage() {
  const { slug } = useParams<{ slug?: string }>();
  const { kitchens, categories, kitchenOf } = useCatalog();
  // Accept kitchen links (/menu/chachas) and older category links (/menu/chai).
  const category = slug ? categories.find(item => item.slug === slug) : undefined;
  const kitchen = slug ? kitchens.find(item => item.slug === slug) ?? (category ? kitchens.find(item => item.name === kitchenOf(category)) : undefined) : undefined;
  usePageTitle(kitchen ? `${kitchen.name} menu` : "Menu");
  useEffect(() => {
    if (category) window.setTimeout(() => document.getElementById(`c-${category.slug}`)?.scrollIntoView({ block: "start" }), 60);
  }, [category]);
  if (slug && !kitchen) return <NotFoundPage />;
  const shown = kitchen ? [kitchen] : kitchens;

  return (
    <div className="menu-page container">
      <div className="page-head">
        <span className="label">The pouring menu</span>
        <h1 className="h-neon">{kitchen ? kitchen.name : "Everything tonight"}</h1>
        <p className="sub">Hover a dish to pour it. Items with sizes or flavours open a quick picker.</p>
      </div>
      <nav className="tabs" aria-label="Kitchens">
        <Link href="/menu" className={!kitchen ? "active" : ""}>All</Link>
        {kitchens.map(item => <Link key={item.slug} href={`/menu/${item.slug}`} className={kitchen?.slug === item.slug ? "active" : ""}>{item.name}</Link>)}
      </nav>
      {shown.map(item => <KitchenMenu key={item.slug} kitchen={item} showTitle={!kitchen} focus={category?.slug} />)}
      {kitchens.length === 0 && <p className="sub">The menu is being updated. Message us on WhatsApp to ask what's available today.</p>}
      <p className="note">Prices are in Pakistani rupees. "Price at counter" items are priced at the food display station; we confirm the price when we call or message you.</p>
    </div>
  );
}

function KitchenMenu({ kitchen, showTitle, focus }: { kitchen: Kitchen; showTitle: boolean; focus?: string }) {
  const { productsIn } = useCatalog();
  return (
    <section className="kitchen-block" aria-label={kitchen.name}>
      {showTitle && <h2 className="kitchen-title">{kitchen.name}</h2>}
      {kitchen.categories.length > 1 && (
        <nav className="cat-jump" aria-label={`${kitchen.name} sections`}>
          {kitchen.categories.map(category => <a key={category.id} href={`#c-${category.slug}`} className={focus === category.slug ? "active" : ""}>{category.name}</a>)}
        </nav>
      )}
      {kitchen.categories.map(category => (
        <section key={category.id} id={`c-${category.slug}`} className="menu-section">
          <div className="menu-section-head">
            <h3>{category.name}</h3>
            {category.description && <p>{category.description}</p>}
          </div>
          <div className="pour-list">{productsIn(category.id).map((product, index) => <ProductRow key={product.id} product={product} index={index} />)}</div>
        </section>
      ))}
    </section>
  );
}
