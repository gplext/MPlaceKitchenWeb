import { createContext, useContext, useMemo, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import type { Catalog as CatalogData, Category, Product } from "./types";

type Catalog = CatalogData & {
  getProduct: (id: number) => Product | undefined;
  getCategory: (id: number) => Category | undefined;
  productsIn: (categoryId: number) => Product[];
};

const CatalogContext = createContext<Catalog | null>(null);

/** Loads the menu once and holds the page until it is here, so every component below can read it synchronously. */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const query = trpc.catalog.all.useQuery(undefined, { staleTime: 60_000, refetchOnWindowFocus: false });

  const catalog = useMemo<Catalog | null>(() => {
    if (!query.data) return null;
    const products = new Map(query.data.products.map(product => [product.id, product]));
    const categories = new Map(query.data.categories.map(category => [category.id, category]));
    return {
      ...query.data,
      getProduct: id => products.get(id),
      getCategory: id => categories.get(id),
      productsIn: categoryId => query.data.products.filter(product => product.categoryId === categoryId),
    };
  }, [query.data]);

  if (query.isError) {
    return (
      <section className="page-message container" role="alert">
        <h1>The menu could not load.</h1>
        <p>Check that the server and its database are running, then try again.</p>
        <button className="btn btn-primary" onClick={() => query.refetch()}>Try again</button>
      </section>
    );
  }
  if (!catalog) return <div className="app-loading" role="status">Loading Living Foods…</div>;
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Catalog {
  const catalog = useContext(CatalogContext);
  if (!catalog) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return catalog;
}
