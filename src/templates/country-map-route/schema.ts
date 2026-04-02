import { z } from "zod";
import { CountryMapFlowSchema, type CountryMapFlowProps } from "../country-map-flow/schema";

const HexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const CountryMapRouteSchema = CountryMapFlowSchema.omit({
  routeMode: true,
}).extend({
  viaCountries: z.array(z.string().min(1).max(80)).max(4).default([]),
  routeColor: HexColor.default("#5D87A1"),
  nodeColor: HexColor.default("#F3EBDD"),
});

export type CountryMapRouteProps = Omit<CountryMapFlowProps, "routeMode">;
