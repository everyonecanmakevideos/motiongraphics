import { z } from "zod";
import {
  BackgroundSchema,
  EffectsSchema,
  MotionStyleSchema,
  StylePresetSchema,
  TypographySchema,
} from "../types";

const HexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const CountryMapFlowSchema = z.object({
  title: z.string().min(1).max(90),
  subtitle: z.string().max(180).optional(),
  originCountry: z.string().min(1).max(80),
  destinationCountry: z.string().min(1).max(80),
  viaCountries: z.array(z.string().min(1).max(80)).max(4).default([]),
  routeMode: z.enum(["route", "connect", "logistics"]).default("route"),
  originLabel: z.string().min(1).max(40).optional(),
  destinationLabel: z.string().min(1).max(40).optional(),
  routeLabel: z.string().min(1).max(72).optional(),
  titleColor: HexColor.default("#F3EBDD"),
  subtitleColor: HexColor.default("#CBBFA6"),
  labelColor: HexColor.default("#F2E6D2"),
  baseFillColor: HexColor.default("#0B1623"),
  outlineColor: HexColor.default("#445D73"),
  routeColor: HexColor.default("#5BC0EB"),
  nodeColor: HexColor.default("#F3EBDD"),
  background: BackgroundSchema.default({
    type: "gradient",
    from: "#071019",
    to: "#1B2432",
    direction: "to-bottom-right",
  }),
  entranceAnimation: z
    .enum(["fade-in", "slide-up", "scale-pop", "none"])
    .default("slide-up"),
  duration: z.number().min(4).max(18).default(8),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
});

export type CountryMapFlowProps = z.infer<typeof CountryMapFlowSchema>;
