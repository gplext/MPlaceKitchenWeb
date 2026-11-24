import { Check, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatPKR, isPriceOnRequest, priceFor, type Selection } from "@shared/shop";
import { useBag } from "@/bag";
import type { Product } from "@/types";

/** Size, flavour, add-ons and quantity for one product, with the live price. Calls onAdded after adding to the bag. */
export function OptionPicker({ product, onAdded }: { product: Product; onAdded?: () => void }) {
  const { add } = useBag();
  const [size, setSize] = useState<string | null>(product.sizes?.[0]?.label ?? null);
  const [choice, setChoice] = useState<string | null>(null);
  const [addons, setAddons] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selection: Selection = { size, choice, addons };
  let unitPrice = product.price;
  try { unitPrice = priceFor(product, selection).unitPrice; } catch { unitPrice = (product.sizes?.find(item => item.label === size)?.price ?? product.price) + addons.reduce((sum, name) => sum + (product.addons?.find(item => item.name === name)?.price ?? 0), 0); }
  const onRequest = isPriceOnRequest(product) && unitPrice === 0;

  const submit = () => {
    try {
      priceFor(product, selection);
    } catch (failure) {
      return setError(failure instanceof Error ? failure.message : "Please check your choices.");
    }
    setError(null);
    add(product, quantity, selection);
    setAdded(true);
    onAdded?.();
  };

  return (
    <div className="picker">
      {product.sizes?.length ? (
        <fieldset className="picker-group">
          <legend>Size</legend>
          <div className="seg">
            {product.sizes.map(option => (
              <button key={option.label} type="button" aria-pressed={size === option.label} onClick={() => { setSize(option.label); setAdded(false); }}>
                {option.label}<small>{formatPKR(option.price)}</small>
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}
      {product.choices?.options.length ? (
        <fieldset className="picker-group">
          <legend>{product.choices.label || "Flavour"} <em>pick one</em></legend>
          <div className="choice-chips">
            {product.choices.options.map(option => (
              <button key={option} type="button" aria-pressed={choice === option} onClick={() => { setChoice(option); setError(null); setAdded(false); }}>{option}</button>
            ))}
          </div>
        </fieldset>
      ) : null}
      {product.addons?.length ? (
        <fieldset className="picker-group">
          <legend>Add-ons</legend>
          <div className="addon-list">
            {product.addons.map(option => (
              <label key={option.name} className="addon">
                <input type="checkbox" checked={addons.includes(option.name)} onChange={() => { setAddons(current => current.includes(option.name) ? current.filter(name => name !== option.name) : [...current, option.name]); setAdded(false); }} />
                <span>{option.name}</span>
                <b>+{formatPKR(option.price)}</b>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <div className="picker-buy">
        <div className="qty" role="group" aria-label="Quantity">
          <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="One less"><Minus size={16} /></button>
          <span aria-live="polite">{quantity}</span>
          <button type="button" onClick={() => setQuantity(Math.min(50, quantity + 1))} aria-label="One more"><Plus size={16} /></button>
        </div>
        <button type="button" className="btn btn-neon" onClick={submit}>
          {added ? <><Check size={18} /> Added</> : <><ShoppingBag size={18} /> Add · {onRequest ? "price on call" : formatPKR(unitPrice * quantity)}</>}
        </button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}

/** A slide-up sheet with the picker, for items that need a size or flavour before they go in the bag. */
export function OptionSheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);
  return (
    <dialog ref={dialog} className="sheet" onClose={onClose} onClick={event => { if (event.target === dialog.current) dialog.current?.close(); }} aria-labelledby={`sheet-${product.id}`}>
      <div className="sheet-body">
        <div className="sheet-head">
          <div>
            <h2 id={`sheet-${product.id}`}>{product.name}</h2>
            {product.description && <p className="muted">{product.description}</p>}
          </div>
          <button type="button" className="icon-link" onClick={() => dialog.current?.close()} aria-label="Close"><X size={22} /></button>
        </div>
        <OptionPicker product={product} onAdded={() => window.setTimeout(() => dialog.current?.close(), 650)} />
      </div>
    </dialog>
  );
}
