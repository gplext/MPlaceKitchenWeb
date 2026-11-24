// Neon line drawings of a cup, glass, bowl or box that "pour" full when their row is hovered or focused.
// Shown wherever a product has no photo yet.
import { useId } from "react";

export type VesselKind = "cup" | "glass" | "cone" | "bowl" | "box";

const SHAPES: Record<VesselKind, string> = {
  glass: "M16 6 H48 L44 66 H20 Z",
  cup: "M10 22 H46 L42 64 H14 Z",
  cone: "M12 20 H52 L32 70 Z",
  bowl: "M4 30 H60 Q58 62 32 64 Q6 62 4 30 Z",
  box: "M10 26 H54 L50 66 H14 Z",
};

/** Liquid colours, top band then bottom band. */
const FILLS: [string, string][] = [
  ["#d9a777", "#a8693b"], // chai
  ["#c98a55", "#6e3a16"], // coffee
  ["#f2b45c", "#c8642a"], // biryani / burger
  ["#ff9ec7", "#e6407f"], // strawberry
  ["#7fe0ff", "#2f9fd6"], // slush
  ["#fff3dc", "#f4d9a4"], // milk / lassi
  ["#ffd36b", "#e09a1a"], // mango
  ["#6b3a22", "#3d1d0e"], // chocolate
];

const KEYWORDS: [RegExp, VesselKind, number][] = [
  [/chai|tea|coffee|brew|americano|chocolate therapy|cloud/i, "cup", 0],
  [/soft serve|cone/i, "cone", 6],
  [/ice-?cream|kheer|rabri|bhalla|chaat|dahi|yogh?urt|haleem|meal|biryani|karahi|daal|halwa/i, "bowl", 2],
  [/slush|freeze|special/i, "glass", 4],
  [/shake|smooth|lassi|milk|sip|affogato|chiller/i, "glass", 5],
];

/** Picks a vessel and colours from the product and category names. */
export function vesselFor(productName: string, categoryName = ""): { kind: VesselKind; tone: number } {
  for (const [pattern, kind, tone] of KEYWORDS) if (pattern.test(productName)) return { kind, tone: tone + (/coffee|brew|affogato/i.test(productName) ? 1 : 0) };
  for (const [pattern, kind, tone] of KEYWORDS) if (pattern.test(categoryName)) return { kind, tone };
  if (/brownie|cake|chocolate/i.test(productName)) return { kind: "box", tone: 7 };
  return { kind: "box", tone: 2 };
}

const EXTRAS: Record<VesselKind, string> = {
  cup: "M46 30 q12 1 11 13 q-1 9 -13 10",
  box: "M10 26 L17 12 H47 L54 26",
  glass: "",
  cone: "M14 20 Q32 2 50 20",
  bowl: "M18 70 H46",
};

export function Vessel({ kind, tone = 0, className = "" }: { kind: VesselKind; tone?: number; className?: string }) {
  const clip = `v${useId().replace(/:/g, "")}`;
  const [top, bottom] = FILLS[tone % FILLS.length];
  const fillTop = kind === "bowl" ? 40 : kind === "cone" ? 22 : 30;
  return (
    <svg className={`vessel ${className}`} viewBox="0 0 64 74" aria-hidden="true">
      <defs><clipPath id={clip}><path d={SHAPES[kind]} /></clipPath></defs>
      <g clipPath={`url(#${clip})`}>
        <g className="vessel-liquid">
          <rect x="0" y={fillTop} width="64" height="44" fill={top} />
          <rect x="0" y="54" width="64" height="20" fill={bottom} />
          <circle className="vessel-bubble" cx="26" cy="60" r="2.2" fill="#fff" opacity="0.7" />
          <circle className="vessel-bubble" cx="36" cy="62" r="1.6" fill="#fff" />
          <circle className="vessel-bubble" cx="31" cy="58" r="1.2" fill="#fff" />
        </g>
      </g>
      <path className="vessel-shape" d={SHAPES[kind]} />
      {EXTRAS[kind] && <path className="vessel-shape" d={EXTRAS[kind]} />}
    </svg>
  );
}
