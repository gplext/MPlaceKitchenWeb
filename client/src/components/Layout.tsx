import { Clock, MapPin, Menu, MessageCircle, Phone, ShoppingBag, UserRound, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { whatsAppLink } from "@shared/shop";
import { useAuth } from "@/_core/hooks/useAuth";
import { useBag } from "@/bag";
import { useCatalog } from "@/catalog";

export const LOGO_SRC = "/logo.png";
/** The full logo with the "Kitchen & Marketplace" wordmark, used in the footer. */
export const LOGO_FULL_SRC = "/logo-full.png";
export const mapsLink = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

function Header() {
  const { categories } = useCatalog();
  const { count } = useBag();
  const { user } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [location]);

  return (
    <header className="site-header">
      <div className="header-inner container">
        <Link href="/" className="brand" aria-label="Living Foods home">
          <img src={LOGO_SRC} alt="" width={44} height={52} />
          <span><strong>Living Foods</strong><small lang="ur">لیونگ فوڈز</small></span>
        </Link>
        <nav className={`main-nav ${open ? "is-open" : ""}`} aria-label="Main">
          <Link href="/menu">Full menu</Link>
          {categories.map(category => <Link key={category.id} href={`/menu/${category.slug}`}>{category.name}</Link>)}
        </nav>
        <div className="header-actions">
          <Link href={user ? (user.role === "admin" ? "/admin" : "/account") : "/sign-in"} className="icon-link" aria-label={user ? "Your account" : "Sign in"}><UserRound size={20} /></Link>
          <Link href="/bag" className="bag-link" aria-label={`Bag, ${count} items`}><ShoppingBag size={19} /><span>{count}</span></Link>
          <button type="button" className="icon-link menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"}>{open ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { shop, categories } = useCatalog();
  return (
    <footer className="site-footer">
      <div className="footer-inner container">
        <div className="footer-brand">
          <img src={LOGO_FULL_SRC} alt="Living Foods Kitchen & Marketplace" width={120} height={153} />
          <p><strong>Living Foods</strong><br />Dairy, frozen foods, ready meals and desserts from the heart of Lahore.</p>
          <p className="footer-urdu" lang="ur">ذائقہ، روایت اور خلوص</p>
        </div>
        <div>
          <h3>Menu</h3>
          <Link href="/menu">Full menu</Link>
          {categories.map(category => <Link key={category.id} href={`/menu/${category.slug}`}>{category.name}</Link>)}
        </div>
        <div>
          <h3>Visit or call</h3>
          <a href={mapsLink(shop.address)} target="_blank" rel="noreferrer"><MapPin size={15} /> {shop.address}</a>
          <a href={`tel:${shop.phone.replace(/\s/g, "")}`}><Phone size={15} /> {shop.phone}</a>
          <a href={whatsAppLink(shop.whatsapp)} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp us</a>
          {shop.openingHours && <span><Clock size={15} /> {shop.openingHours}</span>}
        </div>
      </div>
      <div className="footer-bottom container"><span>© {new Date().getFullYear()} Living Foods, Lahore</span><span>Cash on delivery · Order on WhatsApp or by phone</span></div>
    </footer>
  );
}

function WhatsAppButton() {
  const { shop } = useCatalog();
  return (
    <a className="whatsapp-fab" href={whatsAppLink(shop.whatsapp, "Assalam-o-Alaikum Living Foods! I have a question.")} target="_blank" rel="noreferrer" aria-label="Chat with Living Foods on WhatsApp">
      <MessageCircle size={26} />
    </a>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  // A new page starts at the top, like a normal page load.
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  return (
    <div className="site">
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
