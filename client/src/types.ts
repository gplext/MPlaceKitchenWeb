import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../server/routers";

type Outputs = inferRouterOutputs<AppRouter>;
export type Catalog = Outputs["catalog"]["all"];
export type Category = Catalog["categories"][number];
export type Product = Catalog["products"][number];
export type PackingOption = Catalog["packingOptions"][number];
export type ShopInfo = Catalog["shop"];
export type CreatedOrder = Outputs["orders"]["create"];
