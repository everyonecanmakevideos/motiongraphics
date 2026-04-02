import { z } from "zod";
import {
  BackgroundSchema,
  EffectsSchema,
  MotionStyleSchema,
  StylePresetSchema,
  TypographySchema,
} from "../types";

const HexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const CountryHighlightItemSchema = z.object({
  country: z.string().min(1).max(80),
  value: z.string().min(1).max(40).optional(),
  accentColor: HexColor.optional(),
});

export const CountryHighlightSchema = z.object({
  title: z.string().min(1).max(90),
  subtitle: z.string().max(180).optional(),
  highlightedCountries: z.array(CountryHighlightItemSchema).min(1).max(12),
  titleColor: HexColor.default("#F3EBDD"),
  subtitleColor: HexColor.default("#CBBFA6"),
  labelColor: HexColor.default("#F2E6D2"),
  baseFillColor: HexColor.default("#0B1623"),
  outlineColor: HexColor.default("#445D73"),
  highlightColor: HexColor.default("#5BC0EB"),
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

export type CountryHighlightProps = z.infer<typeof CountryHighlightSchema>;
