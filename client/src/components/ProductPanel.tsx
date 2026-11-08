import { Check, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { formatPKR } from "@shared/shop";
import { useBag } from "@/bag";
import { useCatalog } from "@/catalog";
import type { Product } from "@/types";
import { FoodArt, Flower } from "./Ornaments";

/** A product painted like a panel on the side of a Pakistani truck: striped frame, flower corners, arch photo, tassel fringe. */
export function ProductPanel({ product, index }: { product: Product; index: number }) {
  const { add } = useBag();
  const { getCategory } = useCatalog();
  const [added, setAdded] = useState(false);
  const category = getCategory(product.categoryId);

  useEffect(() => {
    if (!added) return;
    const timeout = window.setTimeout(() => setAdded(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [added]);

  return (
    <article className={`panel tone-${index % 5}`}>
      <div className="panel-frame">
        <div className="panel-inner">
          <Flower className="panel-flower tl" />
          <Flower className="panel-flower tr" petal="#1d4fb0" />
          <Link href={`/product/${product.slug}`} className="panel-photo arch-mask" aria-label={product.name}>
            {product.image ? <img src={product.image} alt={product.name} loading="lazy" width={300} height={360} /> : <FoodArt name={product.name} categorySlug={category?.slug ?? ""} tone={index} compact />}
          </Link>
          <h3 className="panel-name"><Link href={`/product/${product.slug}`}>{product.name}</Link></h3>
          {product.unit && <p className="panel-unit">{product.unit}</p>}
          <div className="panel-buy">
            <strong>{formatPKR(product.price)}</strong>
            <button type="button" className={`btn btn-add ${added ? "is-added" : ""}`} onClick={() => { add(product); setAdded(true); }} aria-label={`Add ${product.name} to bag`}>
              {added ? <><Check size={16} /> Added</> : <><Plus size={16} /> Add</>}
            </button>
          </div>
        </div>
      </div>
      <div className="panel-fringe" aria-hidden="true" />
    </article>
  );
}
