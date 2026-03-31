import { z } from "zod";
import {
  BackgroundSchema,
  EffectsSchema,
  MotionStyleSchema,
  StylePresetSchema,
  TypographySchema,
} from "../types";

const HexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const IndiaMapStateSchema = z.object({
  state: z.string().min(1).max(60),
  value: z.string().min(1).max(40).optional(),
  accentColor: HexColor.optional(),
});

export const IndiaMapHighlightSchema = z.object({
  title: z.string().min(1).max(90),
  subtitle: z.string().max(180).optional(),
  highlightedStates: z.array(IndiaMapStateSchema).min(1).max(12),
  titleColor: HexColor.default("#F8FAFC"),
  subtitleColor: HexColor.default("#C8D3E0"),
  labelColor: HexColor.default("#E2E8F0"),
  baseFillColor: HexColor.default("#122033"),
  outlineColor: HexColor.default("#35506A"),
  highlightColor: HexColor.default("#F97316"),
  background: BackgroundSchema.default({
    type: "gradient",
    from: "#08111F",
    to: "#10233E",
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

export type IndiaMapHighlightProps = z.infer<typeof IndiaMapHighlightSchema>;
