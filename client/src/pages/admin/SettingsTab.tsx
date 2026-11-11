import { useEffect, useState, type FormEvent } from "react";
import { friendlyError } from "@/lib/errors";
import { trpc } from "@/lib/trpc";

type Form = { phone: string; whatsapp: string; address: string; openingHours: string; deliveryFee: string; freeDeliveryOver: string; deliveryNote: string };

export function SettingsTab() {
  const utils = trpc.useUtils();
  const settings = trpc.admin.settings.useQuery();
  const [form, setForm] = useState<Form | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const save = trpc.admin.saveSettings.useMutation({
    onSuccess: async () => { await Promise.all([utils.admin.settings.invalidate(), utils.catalog.all.invalidate()]); setMessage({ ok: true, text: "Saved. The site shows the new details now." }); },
    onError: failure => setMessage({ ok: false, text: friendlyError(failure) }),
  });

  useEffect(() => {
    if (settings.data && !form) {
      const { phone, whatsapp, address, openingHours, deliveryFee, freeDeliveryOver, deliveryNote } = settings.data;
      setForm({ phone, whatsapp, address, openingHours, deliveryFee: String(deliveryFee), freeDeliveryOver: String(freeDeliveryOver), deliveryNote });
    }
  }, [settings.data, form]);

  if (!form) return <p className="muted">Loading…</p>;
  const field = (key: keyof Form) => ({ value: form[key], onChange: (event: { target: { value: string } }) => { setMessage(null); setForm({ ...form, [key]: event.target.value }); } });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate({ ...form, deliveryFee: Number(form.deliveryFee) || 0, freeDeliveryOver: Number(form.freeDeliveryOver) || 0 });
  };

  return (
    <>
    <form className="admin-section card admin-form" onSubmit={submit}>
      <h2>Shop details</h2>
      <p className="muted">Shown in the header, footer and contact sections. WhatsApp orders are sent to the WhatsApp number.</p>
      <div className="form-grid">
        <label>Phone number<input required type="tel" {...field("phone")} /></label>
        <label>WhatsApp number (receives orders)<input required type="tel" {...field("whatsapp")} /></label>
        <label className="span-2">Address<input required maxLength={255} {...field("address")} /></label>
        <label className="span-2">Opening hours<input maxLength={120} placeholder="Daily, 9am to 11pm" {...field("openingHours")} /></label>
        <label>Delivery charge (PKR, 0 = confirm on call)<input type="number" min={0} {...field("deliveryFee")} /></label>
        <label>Free delivery from (PKR, 0 = never automatic)<input type="number" min={0} {...field("freeDeliveryOver")} /></label>
        <label className="span-2">Delivery note<input maxLength={255} {...field("deliveryNote")} /></label>
      </div>
      {message && <p className={message.ok ? "form-ok" : "form-error"} role="status">{message.text}</p>}
      <button type="submit" className="btn btn-primary" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save shop details"}</button>
    </form>
    <AlertSettings />
    </>
  );
}

/** Email and WhatsApp alerts are set up in Coolify's environment variables; this shows what is on and lets the shop test it. */
function AlertSettings() {
  const status = trpc.admin.alerts.useQuery();
  const test = trpc.admin.sendTestAlert.useMutation();
  const channels = status.data ? [
    { name: "Email", on: status.data.email.on, to: status.data.email.to, how: "Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and ALERT_EMAIL_TO." },
    { name: "WhatsApp", on: status.data.whatsapp.on, to: status.data.whatsapp.to, how: "Set WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID and ALERT_WHATSAPP_TO, and get the message template approved." },
  ] : [];
  const anyOn = channels.some(channel => channel.on);

  return (
    <section className="admin-section card admin-form">
      <h2>Order alerts</h2>
      <p className="muted">Every new order is sent to these right away, even when nobody has the admin portal open. They are switched on with environment variables in Coolify (see the README).</p>
      {status.isLoading && <p className="muted">Loading…</p>}
      <ul className="alert-channels">
        {channels.map(channel => (
          <li key={channel.name}>
            <span className={`pill ${channel.on ? "pill-on" : "pill-off"}`}>{channel.on ? "On" : "Off"}</span>
            <strong>{channel.name}</strong>
            <span className="muted small">{channel.on ? `to ${channel.to.join(", ")}` : channel.how}</span>
          </li>
        ))}
      </ul>
      {test.data && (
        <ul className="alert-results" role="status">
          {test.data.map(result => (
            <li key={result.channel} className={result.ok ? "form-ok" : "form-error"}>
              {result.channel === "email" ? "Email" : "WhatsApp"}: {result.ok ? result.detail : `failed. ${result.detail}`}
            </li>
          ))}
        </ul>
      )}
      {test.error && <p className="form-error" role="status">{friendlyError(test.error)}</p>}
      <button type="button" className="btn btn-outline" disabled={!anyOn || test.isPending} onClick={() => test.mutate()}>
        {test.isPending ? "Sending…" : "Send test alert"}
      </button>
    </section>
  );
}
