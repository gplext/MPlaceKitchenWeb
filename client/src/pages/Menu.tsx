import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { useCatalog, type Kitchen } from "@/catalog";
import { ProductRow } from "@/components/ProductRow";
import { usePageTitle } from "@/lib/usePageTitle";
import type { Category } from "@/types";
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
  const shown = useMemo(() => (kitchen ? [kitchen] : kitchens), [kitchen, kitchens]);
  const sections = useMemo(() => shown.flatMap(item => item.categories), [shown]);
  const active = useActiveSection(sections);
  if (slug && !kitchen) return <NotFoundPage />;

  return (
    <>
      <MenuBackdrop sections={sections} active={active} />
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
        {shown.map(item => <KitchenMenu key={item.slug} kitchen={item} showTitle={!kitchen} active={active} />)}
        {kitchens.length === 0 && <p className="sub">The menu is being updated. Message us on WhatsApp to ask what's available today.</p>}
        <p className="note">Prices are in Pakistani rupees. "Price at counter" items are priced at the food display station; we confirm the price when we call or message you.</p>
      </div>
    </>
  );
}

/** The section under the middle of the screen. */
function useActiveSection(sections: Category[]) {
  const [active, setActive] = useState<string | undefined>(sections[0]?.slug);
  useEffect(() => {
    const update = () => {
      const line = window.innerHeight * 0.5;
      let current = sections[0]?.slug;
      for (const section of sections) {
        const element = document.getElementById(`c-${section.slug}`);
        if (element && element.getBoundingClientRect().top <= line) current = section.slug;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [sections]);
  return active;
}

/**
 * Behind the menu: two tilted columns of the current section's own dish photos drifting past, with the
 * section name in outline neon. Scroll into Coffee and the chai columns slide away as the coffee ones slide in.
 */
function MenuBackdrop({ sections, active }: { sections: Category[]; active?: string }) {
  const { productsIn } = useCatalog();
  const photos = useMemo(() => new Map(sections.map(section => [
    section.slug,
    [...new Set(productsIn(section.id).flatMap(item => (item.image ? [item.image] : [])))],
  ])), [sections, productsIn]);

  // Keep the section we are leaving on screen for a moment so it can slide out.
  const [shown, setShown] = useState<{ current?: string; leaving?: string }>({ current: active });
  useEffect(() => {
    setShown(state => (state.current === active ? state : { current: active, leaving: state.current }));
    const timer = window.setTimeout(() => setShown(state => ({ current: state.current })), 1100);
    return () => window.clearTimeout(timer);
  }, [active]);

  const layer = (slug: string | undefined, state: "in" | "out") => {
    const section = sections.find(item => item.slug === slug);
    if (!section) return null;
    const list = photos.get(section.slug) ?? [];
    // Enough tiles to fill a tall column twice, so the loop never shows a gap.
    const fill = (offset: number) => {
      if (list.length === 0) return [];
      const rotated = [...list.slice(offset % list.length), ...list.slice(0, offset % list.length)];
      const tiles: string[] = [];
      while (tiles.length < 6) tiles.push(...rotated);
      return [...tiles, ...tiles];
    };
    return (
      <div key={`${section.slug}-${state}`} className={`backdrop-layer ${state}`}>
        {list.length > 0 && (
          <div className="backdrop-columns">
            {[0, 1].map(column => (
              <div key={column} className={`backdrop-column c${column}`}>
                <div className="backdrop-track">
                  {fill(column * 2 + 1).map((src, index) => <img key={index} src={src} alt="" loading="eager" />)}
                </div>
              </div>
            ))}
          </div>
        )}
        <span className="backdrop-word">{section.name}</span>
      </div>
    );
  };

  return (
    <div className="menu-backdrop" aria-hidden="true">
      {layer(shown.leaving, "out")}
      {layer(shown.current, "in")}
      <div className="backdrop-shade" />
    </div>
  );
}

function KitchenMenu({ kitchen, showTitle, active }: { kitchen: Kitchen; showTitle: boolean; active?: string }) {
  const { productsIn } = useCatalog();
  return (
    <section className="kitchen-block" aria-label={kitchen.name}>
      {showTitle && <h2 className="kitchen-title">{kitchen.name}</h2>}
      {kitchen.categories.length > 1 && (
        <nav className="cat-jump" aria-label={`${kitchen.name} sections`}>
          {kitchen.categories.map(category => <a key={category.id} href={`#c-${category.slug}`} className={active === category.slug ? "active" : ""}>{category.name}</a>)}
        </nav>
      )}
      {kitchen.categories.map(category => (
        <section key={category.id} id={`c-${category.slug}`} className={`menu-section ${active === category.slug ? "is-active" : ""}`}>
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
