import { useCallback, useEffect, useRef, useState } from "react";
import { formatPKR } from "@shared/shop";
import { trpc } from "@/lib/trpc";

const PREF_KEY = "living-foods-admin-alerts";

function readPref(): boolean {
  try { return localStorage.getItem(PREF_KEY) === "on"; } catch { return false; }
}
function writePref(on: boolean) {
  try { localStorage.setItem(PREF_KEY, on ? "on" : "off"); } catch { /* private window: the switch just won't be remembered */ }
}

let audio: AudioContext | null = null;

/** Three short rising tones. Made in the browser, so there is no sound file to load. */
async function chime() {
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") await audio.resume();
    const start = audio.currentTime;
    [660, 880, 1100].forEach((frequency, index) => {
      const oscillator = audio!.createOscillator();
      const gain = audio!.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      const at = start + index * 0.18;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.35, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
      oscillator.connect(gain).connect(audio!.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.17);
    });
  } catch { /* the browser blocked sound until the page is clicked once */ }
}

const canNotify = () => typeof Notification !== "undefined";

/**
 * Watches the order list while the admin portal is open. When a new order arrives it plays a chime,
 * shows a desktop notification and puts the count in the tab title until someone looks at the page.
 */
export function useOrderAlerts() {
  const orders = trpc.admin.orders.useQuery(undefined, { refetchInterval: 15_000, refetchIntervalInBackground: true });
  const [enabled, setEnabled] = useState(readPref);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(canNotify() ? Notification.permission : "unsupported");
  const [unseen, setUnseen] = useState(0);
  const seen = useRef<Set<number> | null>(null);

  useEffect(() => {
    if (!orders.data) return;
    const ids = orders.data.map(order => order.id);
    if (!seen.current) {
      // First load: everything already there counts as seen, so opening the page never rings.
      seen.current = new Set(ids);
      return;
    }
    const fresh = orders.data.filter(order => !seen.current!.has(order.id));
    ids.forEach(id => seen.current!.add(id));
    const arrived = fresh.filter(order => order.status === "new");
    if (arrived.length === 0) return;

    if (document.hidden || !document.hasFocus()) setUnseen(count => count + arrived.length);
    if (!enabled) return;
    void chime();
    if (canNotify() && Notification.permission === "granted") {
      const first = arrived[0];
      const title = arrived.length === 1 ? `New order ${first.orderNumber}` : `${arrived.length} new orders`;
      const body = arrived.length === 1
        ? `${first.customerName}, ${first.area}: ${formatPKR(first.total)}`
        : arrived.map(order => `${order.orderNumber}: ${formatPKR(order.total)}`).join("\n");
      try {
        const note = new Notification(title, { body, tag: "living-foods-orders", icon: "/favicon.png" });
        note.onclick = () => { window.focus(); note.close(); };
      } catch { /* some mobile browsers only allow notifications from a service worker */ }
    }
  }, [orders.data, enabled]);

  // The count in the tab title clears as soon as someone comes back to the page.
  useEffect(() => {
    const clear = () => { if (!document.hidden && document.hasFocus()) setUnseen(0); };
    window.addEventListener("focus", clear);
    document.addEventListener("visibilitychange", clear);
    return () => { window.removeEventListener("focus", clear); document.removeEventListener("visibilitychange", clear); };
  }, []);

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, "");
    document.title = unseen > 0 ? `(${unseen}) ${base}` : base;
  }, [unseen]);
  useEffect(() => () => { document.title = document.title.replace(/^\(\d+\) /, ""); }, []);

  // After a reload the browser keeps sound blocked until the page is clicked or a key is pressed once.
  useEffect(() => {
    if (!enabled) return;
    const unlock = () => {
      try { audio ??= new AudioContext(); void audio.resume(); } catch { /* no sound support */ }
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => { window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); };
  }, [enabled]);

  /** Must run from a click: browsers only allow sound and the notification prompt after the person acts. */
  const turnOn = useCallback(async () => {
    setEnabled(true);
    writePref(true);
    void chime();
    if (canNotify() && Notification.permission === "default") setPermission(await Notification.requestPermission());
  }, []);

  const turnOff = useCallback(() => { setEnabled(false); writePref(false); }, []);

  const newCount = (orders.data ?? []).filter(order => order.status === "new").length;
  return { enabled, permission, turnOn, turnOff, newCount, test: chime };
}
