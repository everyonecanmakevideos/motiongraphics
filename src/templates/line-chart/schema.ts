import { z } from "zod";
import {
  BackgroundSchema,
  EffectsSchema,
  MotionStyleSchema,
  StylePresetSchema,
  TypographySchema,
} from "../types";

const LineSeriesSchema = z.object({
  label: z.string().min(1).max(30),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  values: z.array(z.number().min(0)).min(2).max(12),
});

export const LineChartSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(120).optional(),
  categories: z.array(z.string().min(1).max(24)).min(2).max(12),
  series: z.array(LineSeriesSchema).min(1).max(4),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  showLegend: z.boolean().default(true),
  showPoints: z.boolean().default(true),
  showAreaFill: z.boolean().default(false),
  showAxis: z.boolean().default(true),
  gridLines: z.boolean().default(true),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  subtitleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#94A3B8"),
  labelColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  valueColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  legendTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#CBD5E1"),
  gridColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#334155"),
  axisColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#475569"),
  valuePrefix: z.string().max(12).default(""),
  valueSuffix: z.string().max(12).default(""),
  duration: z.number().min(2).max(15).default(6),
  entranceAnimation: z.enum(["draw", "fade-in", "slide-up", "none"]).default("draw"),
  layoutPreset: z.enum(["minimal", "editorial", "presentation", "social"]).default("presentation"),
  curveStyle: z.enum(["smooth", "linear"]).default("smooth"),
  labelReveal: z.enum(["none", "latest", "all"]).default("latest"),
  pointRadius: z.number().min(0).max(10).default(5),
  lineWidth: z.number().min(2).max(10).default(5),
  emphasisMode: z.enum(["none", "latest", "highest", "lowest"]).default("none"),
  emphasisColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  dimOpacity: z.number().min(0.15).max(1).default(0.42),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
});

export type LineChartProps = z.infer<typeof LineChartSchema>;
