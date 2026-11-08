// Hand-drawn SVG ornaments for the Mughal and truck-art look. All original shapes.
import { Cake, CookingPot, Milk, Snowflake, UtensilsCrossed, type LucideIcon } from "lucide-react";

/** Cusped (multifoil) Mughal arch in a 100 x 120 box. */
export const ARCH_PATH =
  "M0 120 L0 56 A7.48 7.48 0 0 1 1.68 42.76 A7.48 7.48 0 0 1 6.61 30.35 A7.48 7.48 0 0 1 14.47 19.57 A7.48 7.48 0 0 1 24.78 11.09 A7.48 7.48 0 0 1 36.88 5.45 A7.48 7.48 0 0 1 50 3 A7.48 7.48 0 0 1 63.12 5.45 A7.48 7.48 0 0 1 75.22 11.09 A7.48 7.48 0 0 1 85.53 19.57 A7.48 7.48 0 0 1 93.39 30.35 A7.48 7.48 0 0 1 98.32 42.76 A7.48 7.48 0 0 1 100 56 L100 120 Z";

/** A gold arch outline drawn over an arch-shaped block. */
export function ArchOutline({ className = "" }: { className?: string }) {
  return (
    <svg className={`arch-outline ${className}`} viewBox="0 0 100 120" preserveAspectRatio="none" aria-hidden="true">
      <path d={ARCH_PATH} fill="none" stroke="currentColor" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Four-petal flower used in panel corners and dividers. */
export function Flower({ className = "", petal = "#c8235f", heart = "#e9b44c" }: { className?: string; petal?: string; heart?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
        <ellipse key={angle} cx="20" cy="9" rx="5" ry="9" fill={angle % 90 === 0 ? petal : "#0e9aa7"} transform={`rotate(${angle} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="6" fill={heart} />
      <circle cx="20" cy="20" r="2.4" fill="#1a1a1a" />
    </svg>
  );
}

/** Row of small pointed arches in alternating colours, like the painted crown boards on a truck. */
export function CrownBand() {
  const colors = ["#eb5919", "#e9b44c", "#0e9aa7", "#c8235f", "#8ec93c", "#1d4fb0"];
  return (
    <svg className="crown-band" viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: 20 }).map((_, index) => (
        <path key={index} d={`M${index * 30} 40 L${index * 30} 22 Q${index * 30 + 15} -4 ${index * 30 + 30} 22 L${index * 30 + 30} 40 Z`} fill={colors[index % colors.length]} stroke="#1a1a1a" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

/** Truck wheel with a painted hub. */
export function Wheel({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#1a1a1a" />
      <circle cx="50" cy="50" r="33" fill="#d9d4cc" stroke="#8a8378" strokeWidth="3" />
      {[0, 60, 120, 180, 240, 300].map(angle => (
        <rect key={angle} x="47" y="20" width="6" height="30" rx="3" fill="#eb5919" transform={`rotate(${angle} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="10" fill="#e9b44c" stroke="#1a1a1a" strokeWidth="3" />
    </svg>
  );
}

const CATEGORY_ICONS: Record<string, LucideIcon> = { dairy: Milk, "frozen-foods": Snowflake, foods: CookingPot, desserts: Cake };
export const categoryIcon = (slug: string): LucideIcon => CATEGORY_ICONS[slug] ?? UtensilsCrossed;

/** Shown where a product has no photo yet: the dish name on a painted truck-art plaque. */
export function FoodArt({ name, categorySlug, tone = 0, compact = false }: { name: string; categorySlug: string; tone?: number; compact?: boolean }) {
  const Icon = categoryIcon(categorySlug);
  return (
    <div className={`food-art tone-${tone % 5} ${compact ? "compact" : ""}`} role="img" aria-label={`${name}, photo coming soon`}>
      <Flower className="food-art-flower tl" />
      <Flower className="food-art-flower br" petal="#1d4fb0" />
      <span className="food-art-icon"><Icon size={34} strokeWidth={1.6} /></span>
      {!compact && <strong>{name}</strong>}
      <small>Photo coming soon</small>
    </div>
  );
}
