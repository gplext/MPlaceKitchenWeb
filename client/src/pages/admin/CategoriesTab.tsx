import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { friendlyError } from "@/lib/errors";
import { trpc } from "@/lib/trpc";
import { ConfirmButton } from "./ImageField";

type Form = { id?: number; name: string; description: string; sortOrder: string; active: boolean };
const blank: Form = { name: "", description: "", sortOrder: "0", active: true };

export function CategoriesTab() {
  const utils = trpc.useUtils();
  const categories = trpc.admin.categories.useQuery();
  const products = trpc.admin.products.useQuery();
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = () => Promise.all([utils.admin.categories.invalidate(), utils.catalog.all.invalidate()]);
  const save = trpc.admin.saveCategory.useMutation({ onSuccess: async () => { await refresh(); setForm(null); }, onError: failure => setError(friendlyError(failure)) });
  const remove = trpc.admin.deleteCategory.useMutation({ onSuccess: refresh, onError: failure => setError(friendlyError(failure)) });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setError(null);
    save.mutate({ id: form.id, name: form.name, description: form.description, sortOrder: Number(form.sortOrder) || 0, active: form.active });
  };

  return (
    <section className="admin-section">
      <div className="toolbar"><button type="button" className="btn btn-primary" onClick={() => { setForm(blank); setError(null); }}><Plus size={16} /> Add category</button></div>
      {form && (
        <form className="card admin-form" onSubmit={submit}>
          <h2>{form.id ? `Edit ${form.name}` : "New category"}</h2>
          <div className="form-grid">
            <label>Name<input required maxLength={80} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
            <label>Sort order<input type="number" min={0} value={form.sortOrder} onChange={event => setForm({ ...form, sortOrder: event.target.value })} /></label>
            <label className="span-2">Short description<input maxLength={255} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label>
            <label className="check"><input type="checkbox" checked={form.active} onChange={event => setForm({ ...form, active: event.target.checked })} /> Show on the site</label>
          </div>
          <div className="row-actions">
            <button type="submit" className="btn btn-primary" disabled={save.isPending}>Save category</button>
            <button type="button" className="btn btn-outline" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Description</th><th>Products</th><th>Shown</th><th>Order</th><th></th></tr></thead>
          <tbody>
            {categories.data?.map(category => (
              <tr key={category.id}>
                <td><strong>{category.name}</strong><small>/menu/{category.slug}</small></td>
                <td className="small">{category.description}</td>
                <td>{products.data?.filter(product => product.categoryId === category.id).length ?? "…"}</td>
                <td>{category.active ? "Yes" : "Hidden"}</td>
                <td>{category.sortOrder}</td>
                <td className="row-actions">
                  <button type="button" className="btn btn-outline small" onClick={() => { setError(null); setForm({ id: category.id, name: category.name, description: category.description, sortOrder: String(category.sortOrder), active: category.active }); }}>Edit</button>
                  <ConfirmButton label="Delete" disabled={remove.isPending} onConfirm={() => { setError(null); remove.mutate({ id: category.id }); }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
