import { ArrowRight, MapPin, MessageCircle, PackageCheck, Phone, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { formatPKR, whatsAppLink } from "@shared/shop";
import { useCatalog } from "@/catalog";
import { mapsLink } from "@/components/Layout";
import { ArchOutline, Flower, categoryIcon } from "@/components/Ornaments";
import { ProductPanel } from "@/components/ProductPanel";
import { TruckSide } from "@/components/TruckSide";
import { usePageTitle } from "@/lib/usePageTitle";

export function HomePage() {
  const { categories, products, packingOptions, shop, productsIn } = useCatalog();
  usePageTitle("");
  const featured = products.filter(product => product.featured);
  const heroPhoto = featured.find(product => product.image) ?? products.find(product => product.image);

  return (
    <>
      <section className="hero">
        <div className="hero-inner container">
          <div className="hero-copy">
            <span className="urdu-eyebrow" lang="ur">خوش آمدید</span>
            <h1>Lahore's kitchen, <em>packed with care.</em></h1>
            <p>Dairy from our farm, frozen foods, ready-made meals and desserts from Living Foods on Mall Road. Order on WhatsApp or leave your number and we'll call you. Pay when it arrives.</p>
            <div className="hero-actions">
              <Link href="/menu" className="btn btn-primary"><ShoppingBag size={18} /> Browse the menu</Link>
              <a href={whatsAppLink(shop.whatsapp, "Assalam-o-Alaikum Living Foods! I would like to order.")} target="_blank" rel="noreferrer" className="btn btn-whatsapp"><MessageCircle size={18} /> Order on WhatsApp</a>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-arch arch-mask">
              {heroPhoto?.image
                ? <img src={heroPhoto.image} alt={heroPhoto.name} width={480} height={576} />
                : <div className="hero-arch-fill"><Flower className="hero-medallion" /><strong>Taste of Lahore</strong><span lang="ur">ذائقۂ لاہور</span></div>}
            </div>
            <ArchOutline className="hero-arch-line" />
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-head"><span className="eyebrow">Four kitchens, one order</span><h2>What would you like today?</h2></div>
        <div className="category-arches">
          {categories.map((category, index) => {
            const Icon = categoryIcon(category.slug);
            const count = productsIn(category.id).length;
            return (
              <Link key={category.id} href={`/menu/${category.slug}`} className={`category-arch tone-${index % 5}`}>
                <span className="category-arch-shape arch-mask"><Icon size={40} strokeWidth={1.5} /></span>
                <strong>{category.name}</strong>
                <small>{count ? `${count} ${count === 1 ? "item" : "items"}` : "Coming soon"}</small>
              </Link>
            );
          })}
        </div>
      </section>

      {featured.length > 0 && (
        <div className="container">
          <TruckSide title="Today's favourites" subtitle="Painted fresh, cooked fresh">
            {featured.map((product, index) => <ProductPanel key={product.id} product={product} index={index} />)}
          </TruckSide>
          <p className="center-link"><Link href="/menu" className="btn btn-outline">See the full menu <ArrowRight size={16} /></Link></p>
        </div>
      )}

      <section className="section how container">
        <div className="section-head"><span className="eyebrow">Easy as chai</span><h2>How ordering works</h2></div>
        <ol className="steps">
          <li><span>1</span><strong>Fill your bag</strong><p>Pick from the menu. No account needed.</p></li>
          <li><span>2</span><strong>Choose packing</strong><p>A standard box, or an insulated bag for dairy and frozen items.</p></li>
          <li><span>3</span><strong>Send your order</strong><p>Send it on WhatsApp, or leave your number and address and we'll call to confirm. Pay cash on delivery.</p></li>
        </ol>
      </section>

      {packingOptions.length > 0 && (
        <section className="section container">
          <div className="section-head"><span className="eyebrow">Packed the right way</span><h2>Packing options</h2></div>
          <div className="packing-cards">
            {packingOptions.map(option => (
              <div key={option.id} className="packing-card">
                {option.image ? <img src={option.image} alt={option.name} loading="lazy" width={320} height={200} /> : <span className="packing-icon"><PackageCheck size={30} /></span>}
                <strong>{option.name}</strong>
                <p>{option.description}</p>
                <span className="packing-price">{option.price ? `+ ${formatPKR(option.price)} per order` : "Free"}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="visit">
        <div className="visit-inner container">
          <div>
            <span className="eyebrow light">Come and see us</span>
            <h2>Living Foods, Mall Road</h2>
            <p><MapPin size={17} /> {shop.address}</p>
            {shop.openingHours && <p>{shop.openingHours}</p>}
            {shop.deliveryNote && <p>{shop.deliveryNote}</p>}
          </div>
          <div className="visit-actions">
            <a href={`tel:${shop.phone.replace(/\s/g, "")}`} className="btn btn-light"><Phone size={18} /> Call {shop.phone}</a>
            <a href={mapsLink(shop.address)} target="_blank" rel="noreferrer" className="btn btn-outline-light"><MapPin size={18} /> Get directions</a>
          </div>
        </div>
      </section>
    </>
  );
}
