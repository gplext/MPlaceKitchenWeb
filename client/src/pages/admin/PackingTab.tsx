import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { formatPKR } from "@shared/shop";
import { friendlyError } from "@/lib/errors";
import { trpc } from "@/lib/trpc";
import { ConfirmButton, ImageField } from "./ImageField";

type Form = { id?: number; name: string; description: string; price: string; image: string | null; recommendedFor: number[]; isDefault: boolean; active: boolean; sortOrder: string };
const blank: Form = { name: "", description: "", price: "0", image: null, recommendedFor: [], isDefault: false, active: true, sortOrder: "0" };

export function PackingTab() {
  const utils = trpc.useUtils();
  const options = trpc.admin.packingOptions.useQuery();
  const categories = trpc.admin.categories.useQuery();
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = () => Promise.all([utils.admin.packingOptions.invalidate(), utils.catalog.all.invalidate()]);
  const save = trpc.admin.savePackingOption.useMutation({ onSuccess: async () => { await refresh(); setForm(null); }, onError: failure => setError(friendlyError(failure)) });
  const remove = trpc.admin.deletePackingOption.useMutation({ onSuccess: refresh });
  const names = (ids: number[]) => ids.map(id => categories.data?.find(category => category.id === id)?.name).filter(Boolean).join(", ");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setError(null);
    save.mutate({ id: form.id, name: form.name, description: form.description, price: Number(form.price) || 0, image: form.image, recommendedFor: form.recommendedFor, isDefault: form.isDefault, active: form.active, sortOrder: Number(form.sortOrder) || 0 });
  };

  return (
    <section className="admin-section">
      <p className="muted">Customers choose one packing option per order. The default is pre-selected; a recommended option is pre-selected instead when the bag holds items from its categories.</p>
      <div className="toolbar"><button type="button" className="btn btn-primary" onClick={() => { setForm(blank); setError(null); }}><Plus size={16} /> Add packing option</button></div>
      {form && (
        <form className="card admin-form" onSubmit={submit}>
          <h2>{form.id ? `Edit ${form.name}` : "New packing option"}</h2>
          <div className="form-grid">
            <label>Name<input required maxLength={80} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
            <label>Extra charge per order (PKR)<input type="number" min={0} value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} /></label>
            <label className="span-2">Description<input maxLength={255} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label>
            <ImageField label="Photo" value={form.image} onChange={path => setForm({ ...form, image: path })} />
            <div className="check-group"><span className="field-label">Recommend for</span>{categories.data?.map(category => (
              <label key={category.id} className="check"><input type="checkbox" checked={form.recommendedFor.includes(category.id)} onChange={() => setForm({ ...form, recommendedFor: form.recommendedFor.includes(category.id) ? form.recommendedFor.filter(id => id !== category.id) : [...form.recommendedFor, category.id] })} /> {category.name}</label>
            ))}</div>
            <label className="check"><input type="checkbox" checked={form.isDefault} onChange={event => setForm({ ...form, isDefault: event.target.checked })} /> Default choice</label>
            <label className="check"><input type="checkbox" checked={form.active} onChange={event => setForm({ ...form, active: event.target.checked })} /> Offer to customers</label>
            <label>Sort order<input type="number" min={0} value={form.sortOrder} onChange={event => setForm({ ...form, sortOrder: event.target.value })} /></label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="row-actions">
            <button type="submit" className="btn btn-primary" disabled={save.isPending}>Save packing option</button>
            <button type="button" className="btn btn-outline" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>Photo</th><th>Name</th><th>Charge</th><th>Recommended for</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {options.data?.map(option => (
              <tr key={option.id}>
                <td>{option.image ? <img src={option.image} alt="" width={48} height={48} /> : <span className="image-empty small">—</span>}</td>
                <td><strong>{option.name}</strong><small>{option.description}</small></td>
                <td>{option.price ? formatPKR(option.price) : "Free"}</td>
                <td className="small">{names(option.recommendedFor) || "—"}</td>
                <td className="small">{[option.isDefault ? "Default" : null, option.active ? "Offered" : "Hidden"].filter(Boolean).join(" · ")}</td>
                <td className="row-actions">
                  <button type="button" className="btn btn-outline small" onClick={() => { setError(null); setForm({ id: option.id, name: option.name, description: option.description, price: String(option.price), image: option.image, recommendedFor: option.recommendedFor, isDefault: option.isDefault, active: option.active, sortOrder: String(option.sortOrder) }); }}>Edit</button>
                  <ConfirmButton label="Delete" disabled={remove.isPending} onConfirm={() => remove.mutate({ id: option.id })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
