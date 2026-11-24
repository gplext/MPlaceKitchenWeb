import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isPriceOnRequest, priceFor, selectionKey, type Selection } from "@shared/shop";
import { useCatalog } from "./catalog";
import type { Product } from "./types";

/** Saved in the browser: ids and choices only, so names and prices always come from the live menu. */
type StoredLine = { productId: number; quantity: number; size?: string | null; choice?: string | null; addons?: string[] | null };
export type BagLine = { key: string; product: Product; quantity: number; selection: Selection; unitPrice: number; details: string; priceOnRequest: boolean };

type Bag = {
  lines: BagLine[];
  count: number;
  subtotal: number;
  /** True when something in the bag is priced by the shop on confirmation. */
  hasPriceOnRequest: boolean;
  add: (product: Product, quantity?: number, selection?: Selection) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  /** Bumps on every add, so the header can play its little "landed" animation. */
  addedAt: number;
};

const BAG_KEY = "mplace-bag-v2";
const MAX_PER_LINE = 50;

const keyOf = (line: StoredLine) => selectionKey(line.productId, line);

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
  const [addedAt, setAddedAt] = useState(0);

  useEffect(() => {
    try { window.localStorage.setItem(BAG_KEY, JSON.stringify(stored)); } catch { /* storage unavailable */ }
  }, [stored]);

  const add = useCallback((product: Product, quantity = 1, selection: Selection = {}) => {
    const line: StoredLine = { productId: product.id, quantity, size: selection.size ?? null, choice: selection.choice ?? null, addons: selection.addons?.length ? [...selection.addons].sort() : null };
    const key = keyOf(line);
    setStored(current => {
      const existing = current.find(item => keyOf(item) === key);
      if (existing) return current.map(item => (item === existing ? { ...item, quantity: Math.min(MAX_PER_LINE, item.quantity + quantity) } : item));
      return [...current, { ...line, quantity: Math.min(MAX_PER_LINE, quantity) }];
    });
    setAddedAt(Date.now());
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setStored(current => quantity <= 0
      ? current.filter(line => keyOf(line) !== key)
      : current.map(line => (keyOf(line) === key ? { ...line, quantity: Math.min(MAX_PER_LINE, quantity) } : line)));
  }, []);

  const clear = useCallback(() => setStored([]), []);

  const bag = useMemo<Bag>(() => {
    // Items taken off the menu, or whose choices changed, simply drop out.
    const lines = stored.flatMap<BagLine>(line => {
      const product = getProduct(line.productId);
      if (!product) return [];
      const selection: Selection = { size: line.size, choice: line.choice, addons: line.addons };
      try {
        const { unitPrice, details } = priceFor(product, selection);
        return [{ key: keyOf(line), product, quantity: line.quantity, selection, unitPrice, details, priceOnRequest: isPriceOnRequest(product) && unitPrice === 0 }];
      } catch {
        return [];
      }
    });
    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
      hasPriceOnRequest: lines.some(line => line.priceOnRequest),
      add,
      setQuantity,
      clear,
      addedAt,
    };
  }, [stored, getProduct, add, setQuantity, clear, addedAt]);

  return <BagContext.Provider value={bag}>{children}</BagContext.Provider>;
}

export function useBag(): Bag {
  const bag = useContext(BagContext);
  if (!bag) throw new Error("useBag must be used inside <BagProvider>");
  return bag;
}
