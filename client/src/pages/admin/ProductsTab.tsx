import type { inferRouterOutputs } from "@trpc/server";
import { Plus } from "lucide-react";
import type { AppRouter } from "../../../../server/routers";
import { useState, type FormEvent } from "react";
import { ALLERGENS, DIETARY_TAGS, formatPKR } from "@shared/shop";
import { friendlyError } from "@/lib/errors";
import { trpc } from "@/lib/trpc";
import { ConfirmButton, ImageField } from "./ImageField";

type ProductRow = inferRouterOutputs<AppRouter>["admin"]["products"][number];

type Form = {
  id?: number;
  categoryId: number | "";
  name: string;
  description: string;
  price: string;
  unit: string;
  /** One per line, "Regular = 200". */
  sizes: string;
  choiceLabel: string;
  /** Comma or line separated. */
  choiceOptions: string;
  /** Photos per option, kept as they are (set by the menu import). */
  choiceImages: Record<string, string>;
  /** One per line, "Whipped cream = 50". */
  addons: string;
  image: string | null;
  packingImage: string | null;
  ingredients: string;
  allergens: string[];
  dietary: string[];
  calories: string;
  servingSize: string;
  healthNotes: string;
  expiryDate: string;
  shelfLife: string;
  available: boolean;
  featured: boolean;
  sortOrder: string;
};

const blank: Form = { categoryId: "", name: "", description: "", price: "", unit: "", sizes: "", choiceLabel: "Flavour", choiceOptions: "", choiceImages: {}, addons: "", image: null, packingImage: null, ingredients: "", allergens: [], dietary: [], calories: "", servingSize: "", healthNotes: "", expiryDate: "", shelfLife: "", available: true, featured: false, sortOrder: "0" };

const toForm = (product: ProductRow): Form => ({
  id: product.id,
  categoryId: product.categoryId,
  name: product.name,
  description: product.description,
  price: String(product.price),
  unit: product.unit,
  sizes: (product.sizes ?? []).map(size => `${size.label} = ${size.price}`).join("\n"),
  choiceLabel: product.choices?.label ?? "Flavour",
  choiceOptions: (product.choices?.options ?? []).join(", "),
  choiceImages: product.choices?.images ?? {},
  addons: (product.addons ?? []).map(addon => `${addon.name} = ${addon.price}`).join("\n"),
  image: product.image,
  packingImage: product.packingImage,
  ingredients: product.ingredients.join("\n"),
  allergens: product.allergens,
  dietary: product.dietary,
  calories: product.calories == null ? "" : String(product.calories),
  servingSize: product.servingSize ?? "",
  healthNotes: product.healthNotes ?? "",
  expiryDate: product.expiryDate ?? "",
  shelfLife: product.shelfLife ?? "",
  available: product.available,
  featured: product.featured,
  sortOrder: String(product.sortOrder),
});

/** Reads "Name = 200" lines. Returns an error message for the first line that does not fit. */
function parsePriced(text: string, what: string): { rows: { name: string; price: number }[]; error?: string } {
  const rows: { name: string; price: number }[] = [];
  for (const line of text.split("\n").map(item => item.trim()).filter(Boolean)) {
    const match = line.match(/^(.+?)\s*[=:]\s*(?:rs\.?|pkr)?\s*(\d+)\s*$/i);
    if (!match) return { rows, error: `${what}: write each line as "Name = price", e.g. "Large = 270".` };
    rows.push({ name: match[1].trim(), price: Number(match[2]) });
  }
  return { rows };
}

const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter(item => item !== value) : [...list, value]);

export function ProductsTab() {
  const utils = trpc.useUtils();
  const products = trpc.admin.products.useQuery();
  const categories = trpc.admin.categories.useQuery();
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = () => Promise.all([utils.admin.products.invalidate(), utils.catalog.all.invalidate()]);
  const save = trpc.admin.saveProduct.useMutation({ onSuccess: async () => { await refresh(); setForm(null); }, onError: failure => setError(friendlyError(failure)) });
  const remove = trpc.admin.deleteProduct.useMutation({ onSuccess: refresh });
  const quickSave = trpc.admin.saveProduct.useMutation({ onSuccess: refresh });
  const categoryName = (id: number) => categories.data?.find(category => category.id === id)?.name ?? "—";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form || form.categoryId === "") return setError("Choose a category.");
    const sizes = parsePriced(form.sizes, "Sizes");
    const addons = parsePriced(form.addons, "Add-ons");
    if (sizes.error || addons.error) return setError(sizes.error ?? addons.error ?? null);
    if (!sizes.rows.length && form.price === "") return setError("Enter a price, or 0 for price on request.");
    const options = form.choiceOptions.split(/\n|,/).map(item => item.trim()).filter(Boolean);
    setError(null);
    save.mutate({
      id: form.id,
      categoryId: form.categoryId,
      name: form.name,
      description: form.description,
      price: Number(form.price) || 0,
      sizes: sizes.rows.length ? sizes.rows.map(row => ({ label: row.name, price: row.price })) : null,
      choices: options.length ? { label: form.choiceLabel.trim() || "Flavour", options, images: form.choiceImages } : null,
      addons: addons.rows.length ? addons.rows : null,
      unit: form.unit,
      image: form.image,
      packingImage: form.packingImage,
      ingredients: form.ingredients.split(/\n|,/).map(item => item.trim()).filter(Boolean),
      allergens: form.allergens as (typeof ALLERGENS)[number][],
      dietary: form.dietary as (typeof DIETARY_TAGS)[number][],
      calories: form.calories === "" ? null : Number(form.calories),
      servingSize: form.servingSize,
      healthNotes: form.healthNotes,
      expiryDate: form.expiryDate || null,
      shelfLife: form.shelfLife,
      available: form.available,
      featured: form.featured,
      sortOrder: Number(form.sortOrder) || 0,
    });
  };

  if (form) {
    const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm({ ...form, [key]: value });
    return (
      <form className="admin-section card admin-form" onSubmit={submit}>
        <h2>{form.id ? `Edit ${form.name}` : "Add a product"}</h2>
        <fieldset>
          <legend>Basics</legend>
          <div className="form-grid">
            <label>Name<input required maxLength={120} value={form.name} onChange={event => set("name", event.target.value)} /></label>
            <label>Category<select required value={form.categoryId} onChange={event => set("categoryId", event.target.value ? Number(event.target.value) : "")}>
              <option value="">Choose…</option>
              {categories.data?.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select></label>
            <label>Price (PKR, 0 = price on request)<input type="number" min={0} step={1} value={form.price} disabled={form.sizes.trim() !== ""} placeholder={form.sizes.trim() ? "Set by sizes" : ""} onChange={event => set("price", event.target.value)} /></label>
            <label>Unit<input maxLength={60} placeholder="1 plate, 500 g, box of 6" value={form.unit} onChange={event => set("unit", event.target.value)} /></label>
            <label className="span-2">Description<textarea rows={3} maxLength={2000} value={form.description} onChange={event => set("description", event.target.value)} /></label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Sizes, flavours and add-ons</legend>
          <p className="muted small">All optional. Sizes replace the price above (the menu shows "from" the lowest). Customers must pick one option from the list. Add-ons are extras added to the price.</p>
          <div className="form-grid">
            <label>Sizes, one per line<textarea rows={3} placeholder={"Regular = 200\nLarge = 270"} value={form.sizes} onChange={event => set("sizes", event.target.value)} /></label>
            <label>Add-ons, one per line<textarea rows={3} placeholder={"Whipped cream = 50\nExtra malai = 20"} value={form.addons} onChange={event => set("addons", event.target.value)} /></label>
            <label>Choice name<input maxLength={40} placeholder="Flavour" value={form.choiceLabel} onChange={event => set("choiceLabel", event.target.value)} /></label>
            <label>Options to choose from (commas)<input placeholder="Mango, Strawberry, Peach" value={form.choiceOptions} onChange={event => set("choiceOptions", event.target.value)} /></label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Photos</legend>
          <div className="form-grid">
            <ImageField label="Product photo" value={form.image} onChange={path => set("image", path)} />
            <ImageField label="Packing photo" value={form.packingImage} onChange={path => set("packingImage", path)} />
          </div>
        </fieldset>
        <fieldset>
          <legend>Ingredients and health</legend>
          <div className="form-grid">
            <label className="span-2">Ingredients (one per line or separated by commas)<textarea rows={4} value={form.ingredients} onChange={event => set("ingredients", event.target.value)} /></label>
            <label>Calories (kcal)<input type="number" min={0} step={1} value={form.calories} onChange={event => set("calories", event.target.value)} /></label>
            <label>Per serving of<input maxLength={60} placeholder="1 plate, 100 g" value={form.servingSize} onChange={event => set("servingSize", event.target.value)} /></label>
            <div className="span-2 check-group"><span className="field-label">Allergens</span>{ALLERGENS.map(item => <label key={item} className="check"><input type="checkbox" checked={form.allergens.includes(item)} onChange={() => set("allergens", toggle(form.allergens, item))} /> {item}</label>)}</div>
            <div className="span-2 check-group"><span className="field-label">Dietary labels</span>{DIETARY_TAGS.map(item => <label key={item} className="check"><input type="checkbox" checked={form.dietary.includes(item)} onChange={() => set("dietary", toggle(form.dietary, item))} /> {item}</label>)}</div>
            <label className="span-2">Health information<textarea rows={3} maxLength={2000} placeholder="e.g. Contains dairy. Suitable for children. Low in added sugar." value={form.healthNotes} onChange={event => set("healthNotes", event.target.value)} /></label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Freshness</legend>
          <div className="form-grid">
            <label>Expiry date (packed stock)<input type="date" value={form.expiryDate} onChange={event => set("expiryDate", event.target.value)} /></label>
            <label>Shelf life and storage<input maxLength={255} placeholder="Best within 24 hours. Keep refrigerated." value={form.shelfLife} onChange={event => set("shelfLife", event.target.value)} /></label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Display</legend>
          <div className="form-grid">
            <label className="check"><input type="checkbox" checked={form.available} onChange={event => set("available", event.target.checked)} /> Show on the menu</label>
            <label className="check"><input type="checkbox" checked={form.featured} onChange={event => set("featured", event.target.checked)} /> Feature on the home page</label>
            <label>Sort order<input type="number" min={0} step={1} value={form.sortOrder} onChange={event => set("sortOrder", event.target.value)} /></label>
          </div>
        </fieldset>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="row-actions">
          <button type="submit" className="btn btn-primary" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save product"}</button>
          <button type="button" className="btn btn-outline" onClick={() => { setForm(null); setError(null); }}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <section className="admin-section">
      <div className="toolbar">
        <button type="button" className="btn btn-primary" onClick={() => setForm(blank)}><Plus size={16} /> Add product</button>
        <span className="muted small">{products.data?.length ?? 0} products</span>
      </div>
      {products.isLoading && <p className="muted">Loading products…</p>}
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>Photo</th><th>Name</th><th>Category</th><th>Price</th><th>Info</th><th>On menu</th><th></th></tr></thead>
          <tbody>
            {products.data?.map(product => (
              <tr key={product.id}>
                <td>{product.image ? <img src={product.image} alt="" width={48} height={48} /> : <span className="image-empty small">—</span>}</td>
                <td><strong>{product.name}</strong><small>{product.unit}</small></td>
                <td>{categoryName(product.categoryId)}</td>
                <td>{product.sizes?.length ? product.sizes.map(size => `${size.label} ${size.price}`).join(" · ") : product.price ? formatPKR(product.price) : "On request"}{product.choices?.options.length ? <small>{product.choices.options.length} {product.choices.label.toLowerCase()} options</small> : null}{product.addons?.length ? <small>{product.addons.length} add-ons</small> : null}</td>
                <td className="small">{[product.ingredients.length ? "Ingredients" : null, product.calories != null ? "Calories" : null, product.expiryDate || product.shelfLife ? "Freshness" : null].filter(Boolean).join(", ") || <span className="muted">Missing</span>}</td>
                <td><input type="checkbox" aria-label={`Show ${product.name} on the menu`} checked={product.available} disabled={quickSave.isPending} onChange={event => quickSave.mutate({ ...toPayload(product), available: event.target.checked })} /></td>
                <td className="row-actions"><button type="button" className="btn btn-outline small" onClick={() => setForm(toForm(product))}>Edit</button><ConfirmButton label="Delete" disabled={remove.isPending} onConfirm={() => remove.mutate({ id: product.id })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** The saved product in the shape the save call expects, for one-click changes such as hiding it. */
function toPayload(product: ProductRow) {
  return {
    id: product.id,
    categoryId: product.categoryId,
    name: product.name,
    description: product.description,
    price: product.price,
    sizes: product.sizes,
    choices: product.choices ? { ...product.choices, images: product.choices.images ?? {} } : null,
    addons: product.addons,
    unit: product.unit,
    image: product.image,
    packingImage: product.packingImage,
    ingredients: product.ingredients,
    allergens: product.allergens as (typeof ALLERGENS)[number][],
    dietary: product.dietary as (typeof DIETARY_TAGS)[number][],
    calories: product.calories,
    servingSize: product.servingSize ?? "",
    healthNotes: product.healthNotes ?? "",
    expiryDate: product.expiryDate,
    shelfLife: product.shelfLife ?? "",
    available: product.available,
    featured: product.featured,
    sortOrder: product.sortOrder,
  };
}
