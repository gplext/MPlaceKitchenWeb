import { createContext, useContext, useMemo, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { DEFAULT_KITCHEN, KITCHENS } from "@shared/shop";
import type { Catalog as CatalogData, Category, Product } from "./types";

/** A kitchen (department) and its categories, in menu order. */
export type Kitchen = { name: string; slug: string; categories: Category[] };

type Catalog = CatalogData & {
  getProduct: (id: number) => Product | undefined;
  getCategory: (id: number) => Category | undefined;
  productsIn: (categoryId: number) => Product[];
  kitchens: Kitchen[];
  kitchenOf: (category: Category | undefined) => string;
};

export const kitchenSlug = (name: string) => name.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "menu";
const kitchenName = (category: Category) => category.kitchen.trim() || DEFAULT_KITCHEN;

const CatalogContext = createContext<Catalog | null>(null);

/** Loads the menu once and holds the page until it is here, so every component below can read it synchronously. */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const query = trpc.catalog.all.useQuery(undefined, { staleTime: 60_000, refetchOnWindowFocus: false });

  const catalog = useMemo<Catalog | null>(() => {
    if (!query.data) return null;
    const products = new Map(query.data.products.map(product => [product.id, product]));
    const categories = new Map(query.data.categories.map(category => [category.id, category]));
    // Known kitchens first in their usual order, then any the admin added; empty categories are left out.
    const withItems = query.data.categories.filter(category => query.data.products.some(product => product.categoryId === category.id));
    const names = [...new Set(withItems.map(kitchenName))].sort((a, b) => {
      const rank = (name: string) => { const index = (KITCHENS as readonly string[]).indexOf(name); return index === -1 ? 99 : index; };
      return rank(a) - rank(b) || a.localeCompare(b);
    });
    return {
      ...query.data,
      getProduct: id => products.get(id),
      getCategory: id => categories.get(id),
      productsIn: categoryId => query.data.products.filter(product => product.categoryId === categoryId),
      kitchens: names.map(name => ({ name, slug: kitchenSlug(name), categories: withItems.filter(category => kitchenName(category) === name) })),
      kitchenOf: category => (category ? kitchenName(category) : DEFAULT_KITCHEN),
    };
  }, [query.data]);

  if (query.isError) {
    return (
      <section className="page-message container" role="alert">
        <h1>The menu could not load.</h1>
        <p>Check that the server and its database are running, then try again.</p>
        <button className="btn btn-neon" onClick={() => query.refetch()}>Try again</button>
      </section>
    );
  }
  if (!catalog) return <div className="app-loading" role="status">Lighting up MPlace…</div>;
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Catalog {
  const catalog = useContext(CatalogContext);
  if (!catalog) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return catalog;
}
