import { z } from "zod";
import { CountryMapFlowSchema, type CountryMapFlowProps } from "../country-map-flow/schema";

const HexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const CountryMapConnectSchema = CountryMapFlowSchema.omit({
  routeMode: true,
}).extend({
  viaCountries: z.array(z.string().min(1).max(80)).max(2).default([]),
  routeColor: HexColor.default("#C08F52"),
  nodeColor: HexColor.default("#F3EBDD"),
});

export type CountryMapConnectProps = Omit<CountryMapFlowProps, "routeMode">;
