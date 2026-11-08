import { Link, useParams } from "wouter";
import { useCatalog } from "@/catalog";
import { ProductPanel } from "@/components/ProductPanel";
import { TruckSide } from "@/components/TruckSide";
import { usePageTitle } from "@/lib/usePageTitle";
import { NotFoundPage } from "./NotFound";

export function MenuPage() {
  const { slug } = useParams<{ slug?: string }>();
  const { categories, productsIn } = useCatalog();
  const active = slug ? categories.find(category => category.slug === slug) : undefined;
  usePageTitle(active ? `${active.name} menu` : "Menu");
  if (slug && !active) return <NotFoundPage />;
  // On the full menu, categories that are still empty go last so dishes come first.
  const shown = active ? [active] : [...categories].sort((a, b) => Number(productsIn(a.id).length === 0) - Number(productsIn(b.id).length === 0));

  return (
    <div className="menu-page container">
      <div className="page-head">
        <span className="eyebrow">The Living Foods menu</span>
        <h1>{active ? active.name : "Everything we make"}</h1>
        {active?.description && <p>{active.description}</p>}
      </div>
      <nav className="category-pills" aria-label="Menu categories">
        <Link href="/menu" className={!active ? "active" : ""}>All</Link>
        {categories.map(category => <Link key={category.id} href={`/menu/${category.slug}`} className={active?.id === category.id ? "active" : ""}>{category.name}</Link>)}
      </nav>
      {shown.map(category => {
        const items = productsIn(category.id);
        return (
          <TruckSide key={category.id} title={category.name} subtitle={category.description}>
            {items.length
              ? items.map((product, index) => <ProductPanel key={product.id} product={product} index={index} />)
              : <p className="truck-empty">Coming soon. Message us on WhatsApp to ask what's available today.</p>}
          </TruckSide>
        );
      })}
    </div>
  );
}
