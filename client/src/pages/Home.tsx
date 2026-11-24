import { ArrowRight, CheckCircle2, MapPin, MessageCircle, PackageCheck, Phone, ShoppingBag } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { BOOKING_HOURS, DAY_NAMES, formatPKR, whatsAppLink } from "@shared/shop";
import { useCatalog } from "@/catalog";
import { mapsLink } from "@/components/Layout";
import { Marquee, NeonSign, Reveal, ScriptNeon, Stairs, Tawa } from "@/components/Neon";
import { ProductRow } from "@/components/ProductRow";
import { friendlyError } from "@/lib/errors";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/lib/usePageTitle";

export function HomePage() {
  const { products, kitchens, packingOptions, shop, productsIn, getCategory, kitchenOf } = useCatalog();
  usePageTitle("");
  // Signatures follow the kitchen order, so Chacha's favourites lead.
  const rank = (name: string) => kitchens.findIndex(kitchen => kitchen.name === name);
  const featured = products.filter(product => product.featured)
    .sort((a, b) => rank(kitchenOf(getCategory(a.categoryId))) - rank(kitchenOf(getCategory(b.categoryId))))
    .slice(0, 8);

  return (
    <>
      <section className="hero">
        <div className="hero-scan" aria-hidden="true" />
        <div className="hero-floor" aria-hidden="true" />
        <div className="container hero-inner">
          <span className="open-pill"><i /> {shop.openingHours || "Order now on WhatsApp"} · Mall Road</span>
          <NeonSign text="MPLACE" faulty={3} />
          <ScriptNeon text="chai · coffee · late nights" />
          <p className="hero-urdu" lang="ur" dir="rtl">ذائقہ، روایت اور خلوص</p>
          <p className="hero-lead">Chacha's chai, coffee and eatery, Living Foods dairy and the MPlace kitchen, under one neon sign. Fill one bag, send it on WhatsApp, pay cash at your door.</p>
          <div className="hero-actions">
            <Link href="/menu" className="btn btn-neon"><ShoppingBag size={18} /> Open the menu</Link>
            <a href={whatsAppLink(shop.whatsapp, "Assalam-o-Alaikum MPlace! I would like to order.")} target="_blank" rel="noreferrer" className="btn btn-teal"><MessageCircle size={18} /> Order on WhatsApp</a>
          </div>
          <nav className="kitchen-chips" aria-label="Kitchens">
            {kitchens.map(kitchen => <Link key={kitchen.slug} href={`/menu/${kitchen.slug}`}>{kitchen.name}</Link>)}
          </nav>
        </div>
      </section>

      <Marquee items={products.map(product => product.name.replace(/\s*\(.*\)$/, ""))} />

      {featured.length > 0 && (
        <section className="section container" id="signatures">
          <div className="section-head">
            <span className="label">House signatures</span>
            <h2 className="h-neon">Pick &amp; pour</h2>
            <p className="sub">Hover a dish and watch it fill. Tap Add and it lands in your bag.</p>
          </div>
          <div className="pour-list">{featured.map((product, index) => <ProductRow key={product.id} product={product} index={index} />)}</div>
          <p className="center-link"><Link href="/menu" className="btn btn-ghost">See the full menu <ArrowRight size={16} /></Link></p>
        </section>
      )}

      <section className="section band" id="kitchens">
        <div className="container">
          <div className="section-head"><span className="label">One bag, every kitchen</span><h2 className="h-neon">Kitchens</h2></div>
          <div className="kitchen-grid">
            {kitchens.map((kitchen, index) => {
              const count = kitchen.categories.reduce((sum, category) => sum + productsIn(category.id).length, 0);
              return (
                <Reveal key={kitchen.slug} delay={index * 90}>
                  <Link href={`/menu/${kitchen.slug}`} className={`kitchen-card glow-${index % 4}`}>
                    <small>{count} {count === 1 ? "item" : "items"}</small>
                    <h3>{kitchen.name}</h3>
                    <p>{kitchen.categories.map(category => category.name).join(" · ")}</p>
                    <span className="go">Open <ArrowRight size={15} /></span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <MealOfTheDay />

      <section className="section container" id="hire">
        <div className="hire-grid">
          <KitchenQueue />
          <KitchenHire />
        </div>
      </section>

      <section className="section container how">
        <div className="section-head"><span className="label">Easy as chai</span><h2 className="h-neon">How it works</h2></div>
        <ol className="steps">
          <li><span>1</span><strong>Fill your bag</strong><p>Pick from any kitchen. Choose size and flavour where there is one. No account needed.</p></li>
          <li><span>2</span><strong>Choose packing</strong><p>A standard box, or an insulated bag for dairy, ice-cream and frozen items.</p></li>
          <li><span>3</span><strong>Send your order</strong><p>Send it on WhatsApp, or leave your number and we call to confirm. Pay cash on delivery.</p></li>
        </ol>
        {packingOptions.length > 0 && (
          <div className="packing-cards">
            {packingOptions.map(option => (
              <div key={option.id} className="packing-card">
                {option.image ? <img src={option.image} alt={option.name} loading="lazy" width={320} height={200} /> : <span className="packing-icon"><PackageCheck size={26} /></span>}
                <div><strong>{option.name}</strong><p>{option.description}</p></div>
                <span className="packing-price">{option.price ? `+ ${formatPKR(option.price)}` : "Free"}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section container" id="find">
        <div className="find-grid">
          <div>
            <span className="label">Find us</span>
            <h2 className="h-neon">Mall Road</h2>
            <p className="addr"><MapPin size={20} /> {shop.address}</p>
            {shop.openingHours && <p className="sub">{shop.openingHours}</p>}
            {shop.deliveryNote && <p className="sub">{shop.deliveryNote}</p>}
            <p className="sub">Look for the glowing M. Walk-ins welcome.</p>
            <div className="hero-actions left">
              <a href={`tel:${shop.phone.replace(/\s/g, "")}`} className="btn btn-neon"><Phone size={18} /> Call {shop.phone}</a>
              <a href={mapsLink(shop.address)} target="_blank" rel="noreferrer" className="btn btn-ghost"><MapPin size={18} /> Directions</a>
            </div>
          </div>
          <Stairs />
        </div>
      </section>
    </>
  );
}

/** Chacha's meal of the day: today's dish on the spinning tawa and the whole week beside it. */
function MealOfTheDay() {
  const { shop, products } = useCatalog();
  const specials = shop.dailySpecials ?? [];
  if (!specials.some(Boolean)) return null;
  const today = new Date().getDay();
  const meal = products.find(product => product.slug === "meal-of-the-day");
  return (
    <section className="section tonight" id="tonight">
      <div className="container tonight-grid">
        <Tawa />
        <div>
          <span className="label">On the tawa today · {DAY_NAMES[today]}</span>
          <h2 className="h-neon">{specials[today] || "Meal of the day"}</h2>
          <p className="sub">Chacha's daily meal special, cooked fresh every day. Add any Chacha's drink for Rs. 20 off.</p>
          {meal && <div className="tonight-buy"><ProductRow product={meal} /></div>}
          <div className="week">
            {DAY_NAMES.map((day, index) => specials[index] ? (
              <div key={day} className={`night ${index === today ? "now" : ""}`}><small>{day.slice(0, 3)}</small><strong>{specials[index]}</strong></div>
            ) : null)}
          </div>
        </div>
      </div>
    </section>
  );
}

/** How busy the kitchen is, from the number of orders still being prepared or delivered. */
function KitchenQueue() {
  const queue = trpc.catalog.queue.useQuery(undefined, { refetchInterval: 60_000, staleTime: 30_000 });
  const active = queue.data?.active ?? 0;
  const segments = Math.min(5, Math.max(1, Math.ceil((active + 1) / 2)));
  const minutes = 25 + Math.max(0, active - 2) * 5;
  const word = segments <= 2 ? "Short" : segments <= 3 ? "Steady" : "Busy";
  return (
    <div className="card neon-card">
      <span className="label">Kitchen queue, live</span>
      <div className={`meter ${queue.data ? "go" : ""}`} aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <i key={index} className={index < segments ? "on" : ""} style={{ transitionDelay: `${index * 100 + 200}ms` }} />)}</div>
      <p className="big">{queue.data ? `${word} · about ${Math.min(minutes, 75)} min to your door` : "Checking the kitchen…"}</p>
      <p className="sub">Our own riders, insulated bags for dairy, ice-cream and frozen, cash on delivery. Times are a guide; we confirm when you order.</p>
    </div>
  );
}

/** Outside cooks and caterers ask to hire the kitchen; the request is saved for the admin portal and sent on WhatsApp. */
function KitchenHire() {
  const { shop } = useCatalog();
  const [form, setForm] = useState({ name: "", phone: "", date: "", startTime: "08:00", hours: 4, purpose: "" });
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const request = trpc.kitchenHire.request.useMutation();
  const today = new Date().toISOString().slice(0, 10);

  const message = `Assalam-o-Alaikum MPlace, I would like to hire the kitchen for ${form.hours} hours on ${form.date} from ${form.startTime}.${form.purpose ? ` Purpose: ${form.purpose}.` : ""} Name: ${form.name}, phone: ${form.phone}.`;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await request.mutateAsync(form);
      const link = whatsAppLink(shop.whatsapp, message);
      setSent(link);
      window.open(link, "_blank", "noopener");
    } catch (failure) {
      setError(friendlyError(failure));
    }
  };

  if (sent) {
    return (
      <div className="card neon-card">
        <span className="label">Hire the kitchen</span>
        <p className="big"><CheckCircle2 size={22} /> Request saved.</p>
        <p className="sub">We'll confirm the slot on WhatsApp or by phone. If WhatsApp did not open, send it from here:</p>
        <a className="btn btn-teal" href={sent} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Send on WhatsApp</a>
      </div>
    );
  }

  return (
    <form className="card neon-card hire-form" onSubmit={submit}>
      <span className="label">Hire the kitchen</span>
      <p className="big">Cook in our kitchen by the hour.</p>
      <div className="seg" role="group" aria-label="How many hours">
        {BOOKING_HOURS.map(hours => <button key={hours} type="button" aria-pressed={form.hours === hours} onClick={() => setForm({ ...form, hours })}>{hours} hours</button>)}
      </div>
      <div className="form-grid">
        <label>Date<input type="date" required min={today} value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} /></label>
        <label>Start<select value={form.startTime} onChange={event => setForm({ ...form, startTime: event.target.value })}>{["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map(time => <option key={time}>{time}</option>)}</select></label>
        <label>Your name<input required maxLength={120} autoComplete="name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
        <label>Phone<input required type="tel" inputMode="tel" autoComplete="tel" placeholder="0300 1234567" pattern="\+?[0-9][0-9 \-]{8,18}" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} /></label>
        <label className="span-2">What will you cook? (optional)<input maxLength={255} placeholder="Catering for 50, baking, recipe testing…" value={form.purpose} onChange={event => setForm({ ...form, purpose: event.target.value })} /></label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn btn-neon full" type="submit" disabled={request.isPending}>{request.isPending ? "Sending…" : "Ask on WhatsApp"}</button>
    </form>
  );
}
