import { CalendarClock, Check, ChevronRight, HeartPulse, Leaf, Minus, Package, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { formatPKR } from "@shared/shop";
import { useBag } from "@/bag";
import { useCatalog } from "@/catalog";
import { FoodArt } from "@/components/Ornaments";
import { ProductPanel } from "@/components/ProductPanel";
import { usePageTitle } from "@/lib/usePageTitle";
import type { Product } from "@/types";
import { NotFoundPage } from "./NotFound";

const formatDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" });

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { products } = useCatalog();
  const product = products.find(item => item.slug === slug);
  if (!product) return <NotFoundPage />;
  // Keyed so quantity resets when moving between products.
  return <ProductDetail key={product.id} product={product} />;
}

function ProductDetail({ product }: { product: Product }) {
  const { getCategory, productsIn } = useCatalog();
  const { add } = useBag();
  const [, navigate] = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const category = getCategory(product.categoryId);
  usePageTitle(product.name);
  const more = productsIn(product.categoryId).filter(item => item.id !== product.id).slice(0, 3);
  const hasNutrition = product.calories != null || product.servingSize || product.allergens.length || product.dietary.length || product.healthNotes;

  return (
    <div className="product-page container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/menu">Menu</Link><ChevronRight size={14} />
        {category && <><Link href={`/menu/${category.slug}`}>{category.name}</Link><ChevronRight size={14} /></>}
        <span>{product.name}</span>
      </nav>

      <div className="product-layout">
        <div className="product-gallery">
          <div className="product-photo arch-mask">
            {product.image ? <img src={product.image} alt={product.name} width={520} height={624} /> : <FoodArt name={product.name} categorySlug={category?.slug ?? ""} />}
          </div>
          {product.packingImage && (
            <figure className="packing-photo">
              <img src={product.packingImage} alt={`How ${product.name} is packed`} loading="lazy" width={240} height={160} />
              <figcaption><Package size={15} /> How it's packed</figcaption>
            </figure>
          )}
        </div>

        <div className="product-info">
          {category && <span className="eyebrow">{category.name}</span>}
          <h1>{product.name}</h1>
          <p className="product-price"><strong>{formatPKR(product.price)}</strong>{product.unit && <span> / {product.unit}</span>}</p>
          {product.description && <p className="product-description">{product.description}</p>}
          {product.dietary.length > 0 && <div className="chips">{product.dietary.map(tag => <span key={tag} className="chip chip-green"><Leaf size={13} /> {tag}</span>)}</div>}

          <div className="buy-row">
            <div className="qty" role="group" aria-label="Quantity">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="One less"><Minus size={16} /></button>
              <span aria-live="polite">{quantity}</span>
              <button type="button" onClick={() => setQuantity(Math.min(50, quantity + 1))} aria-label="One more"><Plus size={16} /></button>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => { add(product, quantity); setAdded(true); }}>
              {added ? <><Check size={18} /> In your bag</> : <><ShoppingBag size={18} /> Add to bag</>}
            </button>
            {added && <button type="button" className="btn btn-outline" onClick={() => navigate("/bag")}>Go to bag</button>}
          </div>

          <div className="info-boxes">
            <section className="info-box">
              <h2><Leaf size={18} /> Ingredients</h2>
              {product.ingredients.length ? <p>{product.ingredients.join(", ")}</p> : <p className="muted">Ingredient list coming soon. Ask us on WhatsApp if you have an allergy.</p>}
            </section>
            <section className="info-box">
              <h2><HeartPulse size={18} /> Nutrition and health</h2>
              {hasNutrition ? (
                <dl className="facts">
                  {product.calories != null && <><dt>Calories</dt><dd>{product.calories} kcal{product.servingSize ? ` per ${product.servingSize}` : ""}</dd></>}
                  {product.calories == null && product.servingSize && <><dt>Serving</dt><dd>{product.servingSize}</dd></>}
                  <dt>Allergens</dt><dd>{product.allergens.length ? product.allergens.join(", ") : "None listed"}</dd>
                  {product.healthNotes && <><dt>Notes</dt><dd>{product.healthNotes}</dd></>}
                </dl>
              ) : <p className="muted">Nutrition details coming soon.</p>}
            </section>
            <section className="info-box">
              <h2><CalendarClock size={18} /> Freshness</h2>
              {product.expiryDate || product.shelfLife ? (
                <dl className="facts">
                  {product.expiryDate && <><dt>Best before</dt><dd>{formatDate(product.expiryDate)}</dd></>}
                  {product.shelfLife && <><dt>Shelf life</dt><dd>{product.shelfLife}</dd></>}
                </dl>
              ) : <p className="muted">Made fresh. We'll tell you how long it keeps when we confirm your order.</p>}
            </section>
          </div>
        </div>
      </div>

      {more.length > 0 && (
        <section className="section">
          <div className="section-head"><span className="eyebrow">From the same kitchen</span><h2>You may also like</h2></div>
          <div className="truck-panels loose">{more.map((item, index) => <ProductPanel key={item.id} product={item} index={index + 1} />)}</div>
        </section>
      )}
    </div>
  );
}
