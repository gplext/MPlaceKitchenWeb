import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCatalog } from "./catalog";
import type { Product } from "./types";

/** Saved in the browser: ids only, so names and prices always come from the live menu. */
type StoredLine = { productId: number; quantity: number };
export type BagLine = { product: Product; quantity: number };

type Bag = {
  lines: BagLine[];
  count: number;
  subtotal: number;
  add: (product: Product, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  clear: () => void;
};

const BAG_KEY = "living-foods-bag-v1";
const MAX_PER_LINE = 50;

function readStored(): StoredLine[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(BAG_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((line): line is StoredLine => !!line && Number.isInteger(line.productId) && Number.isInteger(line.quantity) && line.quantity > 0);
  } catch {
    return [];
  }
}

const BagContext = createContext<Bag | null>(null);

export function BagProvider({ children }: { children: ReactNode }) {
  const { getProduct } = useCatalog();
  const [stored, setStored] = useState<StoredLine[]>(readStored);

  useEffect(() => {
    try { window.localStorage.setItem(BAG_KEY, JSON.stringify(stored)); } catch { /* storage unavailable */ }
  }, [stored]);

  const add = useCallback((product: Product, quantity = 1) => {
    setStored(current => {
      const existing = current.find(line => line.productId === product.id);
      if (existing) return current.map(line => (line === existing ? { ...line, quantity: Math.min(MAX_PER_LINE, line.quantity + quantity) } : line));
      return [...current, { productId: product.id, quantity: Math.min(MAX_PER_LINE, quantity) }];
    });
  }, []);

  const setQuantity = useCallback((productId: number, quantity: number) => {
    setStored(current => quantity <= 0
      ? current.filter(line => line.productId !== productId)
      : current.map(line => (line.productId === productId ? { ...line, quantity: Math.min(MAX_PER_LINE, quantity) } : line)));
  }, []);

  const clear = useCallback(() => setStored([]), []);

  const bag = useMemo<Bag>(() => {
    // Items taken off the menu since they were added simply drop out.
    const lines = stored.flatMap(line => {
      const product = getProduct(line.productId);
      return product ? [{ product, quantity: line.quantity }] : [];
    });
    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
      add,
      setQuantity,
      clear,
    };
  }, [stored, getProduct, add, setQuantity, clear]);

  return <BagContext.Provider value={bag}>{children}</BagContext.Provider>;
}

export function useBag(): Bag {
  const bag = useContext(BagContext);
  if (!bag) throw new Error("useBag must be used inside <BagProvider>");
  return bag;
}
