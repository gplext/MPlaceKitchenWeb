import { MessageCircle, Minus, PackageCheck, Phone, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { deliveryFeeFor, formatPKR, type OrderChannel } from "@shared/shop";
import { useAuth } from "@/_core/hooks/useAuth";
import { useBag } from "@/bag";
import { useCatalog } from "@/catalog";
import { Vessel, vesselFor } from "@/components/Vessel";
import { friendlyError } from "@/lib/errors";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/lib/usePageTitle";
import { rememberOrder } from "./OrderPlaced";

const DETAILS_KEY = "mplace-details";
type Details = { customerName: string; phone: string; address: string; area: string; notes: string };
const emptyDetails: Details = { customerName: "", phone: "", address: "", area: "", notes: "" };

/** The customer's details are remembered in this browser so the next order is quicker. */
function readDetails(): Details {
  try {
    return { ...emptyDetails, ...JSON.parse(window.localStorage.getItem(DETAILS_KEY) ?? "{}"), notes: "" };
  } catch {
    return emptyDetails;
  }
}

export function BagPage() {
  usePageTitle("Your bag");
  const { lines, subtotal, setQuantity, clear, hasPriceOnRequest } = useBag();
  const { packingOptions, shop, getCategory } = useCatalog();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [details, setDetails] = useState<Details>(readDetails);
  const [error, setError] = useState<string | null>(null);
  const [pendingChannel, setPendingChannel] = useState<OrderChannel | null>(null);

  // Packing suggested for what is in the bag, e.g. an insulated bag when it holds dairy or frozen items.
  const recommended = useMemo(() => {
    const categoryIds = new Set(lines.map(line => line.product.categoryId));
    return packingOptions.find(option => option.recommendedFor.some(id => categoryIds.has(id)));
  }, [lines, packingOptions]);
  const fallback = packingOptions.find(option => option.isDefault) ?? packingOptions[0];
  const [packingId, setPackingId] = useState<number | undefined>(undefined);
  const chosenId = packingId ?? recommended?.id ?? fallback?.id;
  const packing = packingOptions.find(option => option.id === chosenId);

  useEffect(() => {
    if (!user) return;
    setDetails(current => ({ ...current, customerName: current.customerName || user.name || "" }));
  }, [user]);

  const deliveryFee = deliveryFeeFor(subtotal, shop.deliveryFee, shop.freeDeliveryOver);
  const total = subtotal + (packing?.price ?? 0) + deliveryFee;

  const create = trpc.orders.create.useMutation({
    onSuccess: order => {
      try { window.localStorage.setItem(DETAILS_KEY, JSON.stringify({ ...details, notes: "" })); } catch { /* storage unavailable */ }
      rememberOrder(order);
      clear();
      navigate(`/order/${order.orderNumber}`);
    },
    onError: failure => setError(friendlyError(failure)),
    onSettled: () => setPendingChannel(null),
  });

  const submit = (channel: OrderChannel) => (event: FormEvent) => {
    event.preventDefault();
    if (!packing) return setError("Please choose a packing option.");
    setError(null);
    setPendingChannel(channel);
    create.mutate({ channel, packingOptionId: packing.id, items: lines.map(line => ({ productId: line.product.id, quantity: line.quantity, size: line.selection.size ?? null, choice: line.selection.choice ?? null, addons: line.selection.addons ?? null })), ...details });
  };

  if (lines.length === 0) {
    return (
      <section className="page-message container">
        <ShoppingBag size={34} />
        <h1>Your bag is empty.</h1>
        <p>Add something delicious from the menu.</p>
        <Link href="/menu" className="btn btn-neon">Browse the menu</Link>
      </section>
    );
  }

  const field = (key: keyof Details) => ({ value: details[key], onChange: (event: { target: { value: string } }) => setDetails({ ...details, [key]: event.target.value }) });

  return (
    <div className="bag-page container">
      <div className="page-head"><span className="label">Almost there</span><h1 className="h-neon">Your bag</h1></div>
      <form className="bag-layout" onSubmit={submit("whatsapp")}>
        <div className="bag-main">
          <section className="card">
            <h2>Items</h2>
            <ul className="bag-lines">
              {lines.map(({ key, product, quantity, unitPrice, details, priceOnRequest }) => {
                const art = vesselFor(product.name, getCategory(product.categoryId)?.name);
                return (
                  <li key={key}>
                    <Link href={`/product/${product.slug}`} className="bag-thumb">
                      {product.image ? <img src={product.image} alt="" width={56} height={56} /> : <Vessel kind={art.kind} tone={art.tone} className="full" />}
                    </Link>
                    <div className="bag-line-info"><strong>{product.name}</strong><small>{details ? `${details} · ` : ""}{priceOnRequest ? "price on call" : formatPKR(unitPrice)}</small></div>
                    <div className="qty small" role="group" aria-label={`Quantity of ${product.name}`}>
                      <button type="button" onClick={() => setQuantity(key, quantity - 1)} aria-label="One less"><Minus size={14} /></button>
                      <span>{quantity}</span>
                      <button type="button" onClick={() => setQuantity(key, quantity + 1)} aria-label="One more"><Plus size={14} /></button>
                    </div>
                    <strong className="bag-line-total">{priceOnRequest ? "On call" : formatPKR(unitPrice * quantity)}</strong>
                    <button type="button" className="icon-link" onClick={() => setQuantity(key, 0)} aria-label={`Remove ${product.name}`}><Trash2 size={17} /></button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card">
            <h2>Packing</h2>
            <div className="packing-choices" role="radiogroup" aria-label="Packing">
              {packingOptions.map(option => (
                <label key={option.id} className={`packing-choice ${chosenId === option.id ? "selected" : ""}`}>
                  <input type="radio" name="packing" value={option.id} checked={chosenId === option.id} onChange={() => setPackingId(option.id)} />
                  {option.image ? <img src={option.image} alt="" width={56} height={56} /> : <span className="packing-icon small"><PackageCheck size={22} /></span>}
                  <span className="packing-choice-text">
                    <strong>{option.name}{recommended?.id === option.id && <em className="badge">Recommended for your items</em>}</strong>
                    <small>{option.description}</small>
                  </span>
                  <span className="packing-choice-price">{option.price ? `+${formatPKR(option.price)}` : "Free"}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>Delivery details</h2>
            <p className="muted">No account needed. {user ? "" : <>Have one? <Link href="/sign-in">Sign in</Link> to see this order later.</>}</p>
            <div className="form-grid">
              <label>Your name<input required maxLength={120} autoComplete="name" {...field("customerName")} /></label>
              <label>Phone number<input required type="tel" inputMode="tel" autoComplete="tel" placeholder="0300 1234567" pattern="\+?[0-9][0-9 \-]{8,18}" title="A phone number such as 0300 1234567" {...field("phone")} /></label>
              <label className="span-2">Address<input required maxLength={500} autoComplete="street-address" placeholder="House, street, block" {...field("address")} /></label>
              <label>Area<input required maxLength={120} placeholder="e.g. Gulberg, Model Town" {...field("area")} /></label>
              <label>Notes (optional)<input maxLength={500} placeholder="Delivery time, directions, spice level" {...field("notes")} /></label>
            </div>
          </section>
        </div>

        <aside className="bag-summary card">
          <h2>Summary</h2>
          <dl>
            <dt>Items</dt><dd>{formatPKR(subtotal)}</dd>
            <dt>Packing</dt><dd>{packing?.price ? formatPKR(packing.price) : "Free"}</dd>
            <dt>Delivery</dt><dd>{deliveryFee ? formatPKR(deliveryFee) : shop.deliveryFee === 0 ? "Confirmed with you" : "Free"}</dd>
            <dt className="total">Total</dt><dd className="total">{formatPKR(total)}</dd>
          </dl>
          {hasPriceOnRequest && <p className="muted small">Plus counter-priced items; we confirm their price when we call or message you.</p>}
          <p className="muted small">Pay cash on delivery. {shop.deliveryNote}</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-teal full" disabled={create.isPending}>
            <MessageCircle size={18} /> {pendingChannel === "whatsapp" ? "Placing order…" : "Order on WhatsApp"}
          </button>
          <button type="button" className="btn btn-neon full" disabled={create.isPending} onClick={event => {
            const form = (event.currentTarget as HTMLButtonElement).form;
            if (form && !form.reportValidity()) return;
            submit("phone")(event as unknown as FormEvent);
          }}>
            <Phone size={18} /> {pendingChannel === "phone" ? "Placing order…" : "Place order, we'll call you"}
          </button>
          <p className="muted small">WhatsApp opens with your order ready to send. With the second option we call {details.phone || "you"} to confirm.</p>
        </aside>
      </form>
    </div>
  );
}
