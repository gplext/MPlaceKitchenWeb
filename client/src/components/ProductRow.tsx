import { Check, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { formatPKR, hasOptions, isPriceOnRequest, startingPrice } from "@shared/shop";
import { useBag } from "@/bag";
import { useCatalog } from "@/catalog";
import type { Product } from "@/types";
import { useReveal } from "./Neon";
import { OptionSheet } from "./OptionPicker";
import { Vessel, vesselFor } from "./Vessel";

export function priceLabel(product: Product) {
  if (isPriceOnRequest(product)) return "Price at counter";
  return product.sizes?.length && product.sizes.length > 1 ? `from ${formatPKR(startingPrice(product))}` : formatPKR(startingPrice(product));
}

/** One dish on the "pouring menu": its vessel fills on hover, Add drops it in the bag (or opens the size and flavour sheet). */
export function ProductRow({ product, index = 0 }: { product: Product; index?: number }) {
  const { add } = useBag();
  const { getCategory } = useCatalog();
  const [ref, inView] = useReveal<HTMLElement>();
  const [sheet, setSheet] = useState(false);
  const [added, setAdded] = useState(false);
  const category = getCategory(product.categoryId);
  const { kind, tone } = vesselFor(product.name, category?.name);

  useEffect(() => {
    if (!added) return;
    const timeout = window.setTimeout(() => setAdded(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [added]);

  const onAdd = () => {
    if (hasOptions(product)) return setSheet(true);
    add(product);
    setAdded(true);
  };

  return (
    <article ref={ref} className={`pour-item ${inView ? "is-in" : ""}`} style={{ transitionDelay: `${(index % 8) * 70}ms` }}>
      <Link href={`/product/${product.slug}`} className="pour-pic" aria-label={product.name} tabIndex={-1}>
        {product.image ? <img src={product.image} alt="" loading="lazy" width={72} height={72} /> : <Vessel kind={kind} tone={tone} />}
      </Link>
      <div className="pour-text">
        <h3><Link href={`/product/${product.slug}`}>{product.name}</Link>{product.featured && <span className="sig" title="Chacha's signature">Signature</span>}</h3>
        {product.description && <p>{product.description}</p>}
        {product.sizes?.length ? <p className="sizes">{product.sizes.map(size => `${size.label} ${size.price}`).join(" · ")}</p> : null}
      </div>
      <div className="pour-buy">
        <b>{priceLabel(product)}</b>
        <button type="button" className={`add ${added ? "ok" : ""}`} onClick={onAdd} aria-label={`Add ${product.name} to bag`}>
          {added ? <><Check size={14} /> Added</> : <><Plus size={14} /> {hasOptions(product) ? "Choose" : "Add"}</>}
        </button>
      </div>
      {sheet && <OptionSheet product={product} onClose={() => setSheet(false)} />}
    </article>
  );
}
