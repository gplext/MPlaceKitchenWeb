import { ImagePlus, X } from "lucide-react";
import { useState } from "react";
import { IMAGE_MAX_BYTES, IMAGE_TYPES } from "@shared/shop";
import { friendlyError } from "@/lib/errors";
import { trpc } from "@/lib/trpc";

const readBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/** Picks a photo, uploads it straight away and reports the stored address. */
export function ImageField({ label, value, onChange }: { label: string; value: string | null; onChange: (path: string | null) => void }) {
  const upload = trpc.admin.uploadImage.useMutation();
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!IMAGE_TYPES[file.type]) return setError("Choose a JPG, PNG or WebP photo.");
    if (file.size > IMAGE_MAX_BYTES) return setError("Photos can be up to 5 MB.");
    try {
      const { path } = await upload.mutateAsync({ dataBase64: await readBase64(file) });
      onChange(path);
    } catch (failure) {
      setError(friendlyError(failure));
    }
  };

  return (
    <div className="image-field">
      <span className="field-label">{label}</span>
      <div className="image-field-row">
        {value ? <img src={value} alt="" width={88} height={88} /> : <span className="image-empty"><ImagePlus size={22} /></span>}
        <label className="btn btn-outline small">
          {upload.isPending ? "Uploading…" : value ? "Replace photo" : "Upload photo"}
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => { void pick(event.target.files?.[0]); event.target.value = ""; }} />
        </label>
        {value && <button type="button" className="icon-link" onClick={() => onChange(null)} aria-label={`Remove ${label.toLowerCase()}`}><X size={18} /></button>}
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

/** A delete button that asks for a second click instead of a browser pop-up. */
export function ConfirmButton({ label, onConfirm, disabled }: { label: string; onConfirm: () => void; disabled?: boolean }) {
  const [armed, setArmed] = useState(false);
  return armed
    ? <span className="confirm-pair"><button type="button" className="btn btn-danger small" disabled={disabled} onClick={() => { setArmed(false); onConfirm(); }}>Yes, delete</button><button type="button" className="btn btn-outline small" onClick={() => setArmed(false)}>Keep</button></span>
    : <button type="button" className="btn btn-outline small" disabled={disabled} onClick={() => setArmed(true)}>{label}</button>;
}
