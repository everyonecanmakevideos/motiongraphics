import { z } from "zod";
import { BackgroundSchema, StylePresetSchema, TypographySchema, MotionStyleSchema, EffectsSchema } from "../types";

const BarItemSchema = z.object({
  label: z.string().min(1).max(30),
  value: z.number().min(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const BarChartSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(120).optional(),
  bars: z.array(BarItemSchema).min(2).max(10),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  showValues: z.boolean().default(true),
  orientation: z.enum(["vertical", "horizontal"]).default("vertical"),
  barWidth: z.number().min(20).max(120).default(60),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  subtitleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#94A3B8"),
  labelColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  valueColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  valuePrefix: z.string().max(12).default(""),
  valueSuffix: z.string().max(12).default(""),
  duration: z.number().min(2).max(15).default(6),
  entranceAnimation: z.enum(["grow", "fade-in", "slide-up", "none"]).default("grow"),
  barRadius: z.number().min(0).max(16).default(6),
  gridLines: z.boolean().default(true),
  gridColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#333333"),
  showAxis: z.boolean().default(true),
  axisColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#475569"),
  layoutPreset: z.enum(["minimal", "editorial", "presentation", "social"]).default("minimal"),
  labelReveal: z.enum(["with-bar", "after-bar"]).default("after-bar"),
  valueAnimation: z.enum(["static", "count-up"]).default("count-up"),
  emphasisMode: z.enum(["none", "highest", "lowest", "latest"]).default("none"),
  emphasisColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  dimOpacity: z.number().min(0.15).max(1).default(0.38),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
});

export type BarChartProps = z.infer<typeof BarChartSchema>;
