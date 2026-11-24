import { MessageCircle, Phone } from "lucide-react";
import { BOOKING_STATUS_LABELS, BOOKING_STATUSES, whatsAppLink, type BookingStatus } from "@shared/shop";
import { trpc } from "@/lib/trpc";

const formatDay = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

/** Requests to hire the kitchen by the hour, from the form on the home page. */
export function BookingsTab() {
  const utils = trpc.useUtils();
  const bookings = trpc.admin.bookings.useQuery(undefined, { refetchInterval: 60_000 });
  const setStatus = trpc.admin.setBookingStatus.useMutation({ onSuccess: () => utils.admin.bookings.invalidate() });

  return (
    <section className="admin-section">
      <div className="toolbar"><span className="muted small">Requests from the "Hire the kitchen" form on the home page. Confirm the slot with the customer, then set the status.</span></div>
      {bookings.isLoading && <p className="muted">Loading requests…</p>}
      {bookings.data?.length === 0 && <p className="muted">No kitchen hire requests yet.</p>}
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>When</th><th>Who</th><th>What for</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {bookings.data?.map(booking => (
              <tr key={booking.id}>
                <td><strong>{formatDay(booking.date)}</strong><small>{booking.startTime}, {booking.hours} hours</small></td>
                <td><strong>{booking.name}</strong><small>{booking.phone}</small></td>
                <td className="small">{booking.purpose || <span className="muted">Not given</span>}</td>
                <td>
                  <select aria-label={`Status of request from ${booking.name}`} value={booking.status} disabled={setStatus.isPending} onChange={event => setStatus.mutate({ id: booking.id, status: event.target.value as BookingStatus })}>
                    {BOOKING_STATUSES.map(status => <option key={status} value={status}>{BOOKING_STATUS_LABELS[status]}</option>)}
                  </select>
                </td>
                <td className="row-actions">
                  <a className="btn btn-outline small" href={`tel:${booking.phone.replace(/\s/g, "")}`}><Phone size={14} /> Call</a>
                  <a className="btn btn-outline small" href={whatsAppLink(booking.phone, `Assalam-o-Alaikum ${booking.name}, this is MPlace about hiring the kitchen on ${formatDay(booking.date)} from ${booking.startTime}.`)} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
