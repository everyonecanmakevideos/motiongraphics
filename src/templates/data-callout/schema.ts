import { z } from "zod";
import { BackgroundSchema, StylePresetSchema, TypographySchema, MotionStyleSchema, EffectsSchema } from "../types";

export const DataCalloutSchema = z.object({
  value: z.number(),
  prefix: z.string().max(5).default(""),
  suffix: z.string().max(10).default(""),
  label: z.string().min(1).max(80),
  context: z.string().max(200).optional(),
  trend: z.enum(["up", "down", "neutral", "none"]).default("none"),
  trendValue: z.string().max(20).optional(),
  valueColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  labelColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  contextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#888888"),
  trendUpColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#51CF66"),
  trendDownColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FF6B6B"),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  entranceAnimation: z.enum(["count-up", "fade-in", "scale-pop", "none"]).default("count-up"),
  duration: z.number().min(2).max(15).default(6),
  valueSize: z.enum(["medium", "large", "xlarge"]).default("large"),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
});

export type DataCalloutProps = z.infer<typeof DataCalloutSchema>;
