// The "after dark" pieces: a flickering neon sign, a script tube that draws itself, the dish marquee,
// scroll reveals, the spinning tawa and the stairs that light up. All respect prefers-reduced-motion.
import { useEffect, useRef, useState, type ReactNode } from "react";

export const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Big neon word. One letter is "faulty" and dips now and then, like a real tube. */
export function NeonSign({ text, faulty = 3, as: Tag = "h1" }: { text: string; faulty?: number; as?: "h1" | "h2" | "p" }) {
  const [off, setOff] = useState(false);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let timer = 0;
    const flick = () => {
      timer = window.setTimeout(() => {
        setOff(true);
        window.setTimeout(() => setOff(false), 80);
        if (Math.random() < 0.5) window.setTimeout(() => { setOff(true); window.setTimeout(() => setOff(false), 60); }, 160);
        flick();
      }, 4000 + Math.random() * 5000);
    };
    flick();
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <Tag className="neon-sign" aria-label={text}>
      {[...text].map((letter, index) => <span key={index} aria-hidden="true" className={index === faulty && off ? "off" : undefined}>{letter}</span>)}
    </Tag>
  );
}

/** Cursive teal tube that draws itself in. */
export function ScriptNeon({ text, width = 640 }: { text: string; width?: number }) {
  return (
    <svg className="script-neon" viewBox={`0 0 ${width} 96`} role="img" aria-label={text}>
      <defs>
        <filter id="tube-glow" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <text x="50%" y="70" textAnchor="middle" filter="url(#tube-glow)">{text}</text>
    </svg>
  );
}

export function Marquee({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  const doubled = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">{doubled.map((item, index) => <span key={index}>{item}</span>)}</div>
    </div>
  );
}

/** Adds "is-in" once the element scrolls into view, for entrance animations. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) { setInView(true); return; }
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } }, { threshold: 0.15 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, inView] as const;
}

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [ref, inView] = useReveal<HTMLDivElement>();
  return <div ref={ref} className={`reveal ${inView ? "is-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

/** A tawa spinning like a record, with a spatula "tonearm" that lowers on hover. */
export function Tawa() {
  return (
    <div className="tawa" aria-hidden="true">
      <svg className="tawa-disc" viewBox="0 0 260 260">
        <defs><radialGradient id="tawa-metal" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#2a1b37" /><stop offset="1" stopColor="#0d0812" /></radialGradient></defs>
        <circle cx="130" cy="130" r="128" fill="url(#tawa-metal)" stroke="#ff3ea5" strokeWidth="2" className="tawa-rim" />
        <g fill="none" stroke="rgba(247,231,255,.1)"><circle cx="130" cy="130" r="110" /><circle cx="130" cy="130" r="95" /><circle cx="130" cy="130" r="80" /><circle cx="130" cy="130" r="65" /></g>
        <circle cx="130" cy="130" r="48" fill="#e7b66b" />
        <g fill="#b8732f"><circle cx="118" cy="116" r="5" /><circle cx="146" cy="124" r="4" /><circle cx="126" cy="146" r="6" /><circle cx="148" cy="146" r="3" /><circle cx="112" cy="136" r="3" /></g>
        <circle cx="130" cy="130" r="4" fill="#0b0710" />
      </svg>
      <svg className="tawa-arm" viewBox="0 0 120 200">
        <circle cx="92" cy="18" r="12" fill="#1a1024" stroke="#36e2d0" strokeWidth="2" />
        <path d="M92 18 L80 150 L58 178" fill="none" stroke="#36e2d0" strokeWidth="5" strokeLinecap="round" />
        <rect x="40" y="170" width="32" height="18" rx="4" transform="rotate(-30 56 179)" fill="#36e2d0" />
      </svg>
    </div>
  );
}

/** Eight steps down to the shop that light up as the section scrolls past. */
export function Stairs() {
  const ref = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(prefersReducedMotion() ? 8 : 0);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const update = () => {
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      const progress = Math.min(1, Math.max(0, (window.innerHeight - box.top) / (window.innerHeight * 0.9)));
      setLit(Math.round(progress * 8));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return <div className="stairs" ref={ref} aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index} className={7 - index < lit ? "lit" : ""} />)}</div>;
}

/** The MPlace mark on a cream badge so the green logo reads on the dark site. */
export function LogoBadge({ size = 44 }: { size?: number }) {
  return <span className="logo-badge" style={{ width: size, height: size }}><img src="/logo.png" alt="" width={size - 10} height={Math.round((size - 10) * 0.8)} /></span>;
}
