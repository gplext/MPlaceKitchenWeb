import { CalendarClock, ChevronRight, HeartPulse, Leaf, Package } from "lucide-react";
import { useState } from "react";
import { photoFor } from "@shared/shop";
import { Link, useParams } from "wouter";
import { useCatalog } from "@/catalog";
import { OptionPicker } from "@/components/OptionPicker";
import { priceLabel, ProductRow } from "@/components/ProductRow";
import { Vessel, vesselFor } from "@/components/Vessel";
import { usePageTitle } from "@/lib/usePageTitle";
import type { Product } from "@/types";
import { NotFoundPage } from "./NotFound";

const formatDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" });

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { products } = useCatalog();
  const product = products.find(item => item.slug === slug);
  if (!product) return <NotFoundPage />;
  // Keyed so choices reset when moving between products.
  return <ProductDetail key={product.id} product={product} />;
}

function ProductDetail({ product }: { product: Product }) {
  const { getCategory, productsIn, kitchenOf } = useCatalog();
  const category = getCategory(product.categoryId);
  usePageTitle(product.name);
  const more = productsIn(product.categoryId).filter(item => item.id !== product.id).slice(0, 4);
  const hasNutrition = product.calories != null || product.servingSize || product.allergens.length || product.dietary.length || product.healthNotes;
  const { kind, tone } = vesselFor(product.name, category?.name);
  const [choice, setChoice] = useState<string | null>(null);
  const photo = photoFor(product, choice);

  return (
    <div className="product-page container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/menu">Menu</Link><ChevronRight size={14} />
        {category && <><Link href={`/menu/${category.slug}`}>{kitchenOf(category)} · {category.name}</Link><ChevronRight size={14} /></>}
        <span>{product.name}</span>
      </nav>

      <div className="product-layout">
        <div className="product-gallery">
          <div className={`product-photo ${photo ? "" : "is-art"}`}>
            {photo ? <img key={photo} src={photo} alt={choice ? `${product.name}, ${choice}` : product.name} width={520} height={520} /> : <Vessel kind={kind} tone={tone} className="big" />}
          </div>
          {product.packingImage && (
            <figure className="packing-photo">
              <img src={product.packingImage} alt={`How ${product.name} is packed`} loading="lazy" width={240} height={160} />
              <figcaption><Package size={15} /> How it's packed</figcaption>
            </figure>
          )}
        </div>

        <div className="product-info">
          {category && <span className="label">{category.name}</span>}
          <h1>{product.name}{product.featured && <span className="sig">Signature</span>}</h1>
          <p className="product-price"><strong>{priceLabel(product)}</strong>{product.unit && <span> / {product.unit}</span>}</p>
          {product.description && <p className="product-description">{product.description}</p>}
          {product.dietary.length > 0 && <div className="chips">{product.dietary.map(tag => <span key={tag} className="chip"><Leaf size={13} /> {tag}</span>)}</div>}

          <OptionPicker product={product} onChoice={setChoice} />

          <div className="info-boxes">
            <section className="info-box">
              <h2><Leaf size={18} /> Ingredients</h2>
              {product.ingredients.length ? <p>{product.ingredients.join(", ")}</p> : <p className="muted">Ask us on WhatsApp if you have an allergy.</p>}
            </section>
            {hasNutrition ? (
              <section className="info-box">
                <h2><HeartPulse size={18} /> Nutrition and health</h2>
                <dl className="facts">
                  {product.calories != null && <><dt>Calories</dt><dd>{product.calories} kcal{product.servingSize ? ` per ${product.servingSize}` : ""}</dd></>}
                  {product.calories == null && product.servingSize && <><dt>Serving</dt><dd>{product.servingSize}</dd></>}
                  <dt>Allergens</dt><dd>{product.allergens.length ? product.allergens.join(", ") : "None listed"}</dd>
                  {product.healthNotes && <><dt>Notes</dt><dd>{product.healthNotes}</dd></>}
                </dl>
              </section>
            ) : null}
            {product.expiryDate || product.shelfLife ? (
              <section className="info-box">
                <h2><CalendarClock size={18} /> Freshness</h2>
                <dl className="facts">
                  {product.expiryDate && <><dt>Best before</dt><dd>{formatDate(product.expiryDate)}</dd></>}
                  {product.shelfLife && <><dt>Shelf life</dt><dd>{product.shelfLife}</dd></>}
                </dl>
              </section>
            ) : null}
          </div>
        </div>
      </div>

      {more.length > 0 && (
        <section className="section">
          <div className="section-head"><span className="label">From the same counter</span><h2 className="h-neon small">More {category?.name ?? ""}</h2></div>
          <div className="pour-list">{more.map((item, index) => <ProductRow key={item.id} product={item} index={index} />)}</div>
        </section>
      )}
    </div>
  );
}
