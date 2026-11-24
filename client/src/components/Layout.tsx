import { Clock, Instagram, Mail, MapPin, Menu, MessageCircle, Phone, ShoppingBag, UserRound, X } from "lucide-react";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { whatsAppLink } from "@shared/shop";
import { useAuth } from "@/_core/hooks/useAuth";
import { useBag } from "@/bag";
import { useCatalog } from "@/catalog";
import { LogoBadge } from "./Neon";

export const LOGO_SRC = "/logo.png";
/** The full MPlace logo with the "by Living Foods" wordmark, used in the footer and sign-in card. */
export const LOGO_FULL_SRC = "/logo-full.png";
export const mapsLink = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

/** Chacha's counter contact details, from the printed menu card. */
export const CHACHAS = { phone: "0300 3814368", email: "info@livingfoodspk.com", instagram: "https://www.instagram.com/chacha_cce/" };

/** Link to a section of the home page that works from any page. */
export function SectionLink({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  const [location, navigate] = useLocation();
  const go = (event: MouseEvent) => {
    event.preventDefault();
    const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (location === "/") scroll();
    else { navigate("/"); window.setTimeout(scroll, 120); }
  };
  return <a href={`/#${id}`} className={className} onClick={go}>{children}</a>;
}

function Header() {
  const { count, addedAt } = useBag();
  const { user } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [bump, setBump] = useState(false);
  useEffect(() => setOpen(false), [location]);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!addedAt) return;
    setBump(true);
    const timeout = window.setTimeout(() => setBump(false), 500);
    return () => window.clearTimeout(timeout);
  }, [addedAt]);

  return (
    <header className={`site-header ${solid || location !== "/" ? "solid" : ""}`}>
      <div className="header-inner container">
        <Link href="/" className="brand" aria-label="MPlace home">
          <LogoBadge size={44} />
          <span className="brand-word"><b>m</b>place<small>by Living Foods</small></span>
        </Link>
        <nav className={`main-nav ${open ? "is-open" : ""}`} aria-label="Main">
          <Link href="/menu">Menu</Link>
          <SectionLink id="tonight">Meal of the day</SectionLink>
          <SectionLink id="hire">Kitchen hire</SectionLink>
          <SectionLink id="find">Find us</SectionLink>
        </nav>
        <div className="header-actions">
          <Link href={user ? (user.role === "admin" ? "/admin" : "/account") : "/sign-in"} className="icon-link" aria-label={user ? "Your account" : "Sign in"}><UserRound size={20} /></Link>
          <Link href="/bag" className={`bag-link ${bump ? "bump" : ""}`} aria-label={`Bag, ${count} items`}><ShoppingBag size={17} /> <span className="bag-word">Bag</span> <span className="n">{count}</span></Link>
          <button type="button" className="icon-link menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"}>{open ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { shop, kitchens } = useCatalog();
  return (
    <footer className="site-footer">
      <div className="footer-inner container">
        <div className="footer-brand">
          <span className="footer-logo"><img src={LOGO_FULL_SRC} alt="MPlace by Living Foods" width={150} height={172} loading="lazy" /></span>
          <p>Chacha's chai, coffee and eatery, Living Foods dairy and the MPlace kitchen, under one neon sign on Mall Road.</p>
          <p className="footer-urdu" lang="ur" dir="rtl">ذائقہ، روایت اور خلوص</p>
        </div>
        <div>
          <h3>Kitchens</h3>
          <Link href="/menu">Full menu</Link>
          {kitchens.map(kitchen => <Link key={kitchen.slug} href={`/menu/${kitchen.slug}`}>{kitchen.name}</Link>)}
        </div>
        <div>
          <h3>Visit or call</h3>
          <a href={mapsLink(shop.address)} target="_blank" rel="noreferrer"><MapPin size={15} /> {shop.address}</a>
          <a href={`tel:${shop.phone.replace(/\s/g, "")}`}><Phone size={15} /> Orders {shop.phone}</a>
          <a href={whatsAppLink(shop.whatsapp)} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp us</a>
          <a href={`tel:${CHACHAS.phone.replace(/\s/g, "")}`}><Phone size={15} /> Chacha's counter {CHACHAS.phone}</a>
          <a href={`mailto:${CHACHAS.email}`}><Mail size={15} /> {CHACHAS.email}</a>
          <a href={CHACHAS.instagram} target="_blank" rel="noreferrer"><Instagram size={15} /> @chacha_cce</a>
          {shop.openingHours && <span><Clock size={15} /> {shop.openingHours}</span>}
        </div>
      </div>
      <div className="footer-bottom container"><span>© {new Date().getFullYear()} MPlace by Living Foods, Lahore</span><span>Cash on delivery · Order on WhatsApp or by phone</span></div>
    </footer>
  );
}

function WhatsAppButton() {
  const { shop } = useCatalog();
  return (
    <a className="whatsapp-fab" href={whatsAppLink(shop.whatsapp, "Assalam-o-Alaikum MPlace! I have a question.")} target="_blank" rel="noreferrer" aria-label="Chat with MPlace on WhatsApp">
      <MessageCircle size={24} />
    </a>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  // A new page starts at the top, like a normal page load.
  useEffect(() => { if (!window.location.hash) window.scrollTo(0, 0); }, [location]);
  // Arriving on /#section scrolls to it once the page has drawn.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: "start" }), 150);
  }, []);
  return (
    <div className={`site ${location === "/" ? "is-home" : ""}`}>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
