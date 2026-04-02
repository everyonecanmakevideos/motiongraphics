import { z } from "zod";
import { CountryMapFlowSchema, type CountryMapFlowProps } from "../country-map-flow/schema";
import { BackgroundSchema } from "../types";

const HexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const CountryMapLogisticsSchema = CountryMapFlowSchema.omit({
  routeMode: true,
}).extend({
  viaCountries: z.array(z.string().min(1).max(80)).max(4).default([]),
  routeColor: HexColor.default("#F3BE74"),
  nodeColor: HexColor.default("#F3BE74"),
  background: BackgroundSchema.default({
    type: "gradient",
    from: "#F7F4EE",
    to: "#E6EEF8",
    direction: "to-bottom-right",
  }),
  titleColor: HexColor.default("#1F2B3D"),
  subtitleColor: HexColor.default("#5A6B7E"),
  labelColor: HexColor.default("#233044"),
  baseFillColor: HexColor.default("#F4F7FA"),
  outlineColor: HexColor.default("#CAD7E4"),
});

export type CountryMapLogisticsProps = Omit<CountryMapFlowProps, "routeMode">;
