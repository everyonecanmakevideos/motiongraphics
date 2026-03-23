import { z } from "zod";
import { BackgroundSchema, StylePresetSchema, TypographySchema, MotionStyleSchema, EffectsSchema } from "../types";

const SegmentSchema = z.object({
  label: z.string().min(1).max(30),
  value: z.number().min(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const PieChartSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(120).optional(),
  segments: z.array(SegmentSchema).min(1).max(8),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  donut: z.boolean().default(false),
  arcMode: z.enum(["full", "semi"]).default("full"),
  showTrack: z.boolean().default(false),
  trackColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#334155"),
  showLabels: z.boolean().default(true),
  showPercentages: z.boolean().default(true),
  showLegend: z.boolean().default(true),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  subtitleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#94A3B8"),
  labelColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  valueColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  legendTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#CBD5E1"),
  centerLabel: z.string().max(40).optional(),
  centerValue: z.string().max(40).optional(),
  showCallout: z.boolean().default(false),
  calloutTitle: z.string().max(50).optional(),
  calloutBody: z.string().max(160).optional(),
  calloutValue: z.string().max(40).optional(),
  calloutAlign: z.enum(["right", "bottom"]).default("right"),
  highlightMode: z.enum(["none", "largest", "smallest", "specific"]).default("none"),
  highlightLabel: z.string().max(30).optional(),
  highlightColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  explodeOffset: z.number().min(0).max(60).default(0),
  dimOpacity: z.number().min(0.1).max(1).default(1),
  duration: z.number().min(2).max(15).default(6),
  entranceAnimation: z.enum(["spin", "fade-in", "scale-pop", "none"]).default("spin"),
  strokeWidth: z.number().min(0).max(4).default(0),
  strokeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#0A0A0A"),
  layoutPreset: z.enum(["minimal", "editorial", "presentation", "social"]).default("presentation"),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
});

export type PieChartProps = z.infer<typeof PieChartSchema>;
