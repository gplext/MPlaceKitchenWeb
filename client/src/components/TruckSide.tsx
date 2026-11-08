import type { ReactNode } from "react";
import { CrownBand, Wheel } from "./Ornaments";

/** The side of a painted truck: crown board on top, striped body holding the product panels, chains and wheels below. */
export function TruckSide({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="truck" aria-label={title}>
      <CrownBand />
      <div className="truck-body">
        <div className="truck-plaque">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="truck-panels">{children}</div>
      </div>
      <div className="truck-chains" aria-hidden="true" />
      <Wheel className="truck-wheel left" />
      <Wheel className="truck-wheel right" />
    </section>
  );
}
