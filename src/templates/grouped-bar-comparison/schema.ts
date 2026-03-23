import { z } from "zod";
import { BackgroundSchema, EffectsSchema, MotionStyleSchema, StylePresetSchema, TypographySchema } from "../types";

const SeriesSchema = z.object({
  label: z.string().min(1).max(40),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  values: z.array(z.number().min(0)).min(1).max(8),
});

export const GroupedBarComparisonSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(120).optional(),
  categories: z.array(z.string().min(1).max(24)).min(1).max(8),
  series: z.array(SeriesSchema).min(2).max(4),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  showValues: z.boolean().default(true),
  showLegend: z.boolean().default(true),
  valuePrefix: z.string().max(12).default(""),
  valueSuffix: z.string().max(12).default(""),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  subtitleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#94A3B8"),
  labelColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  valueColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  legendTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#CBD5E1"),
  duration: z.number().min(3).max(15).default(6),
  entranceAnimation: z.enum(["grow", "fade-in", "slide-up", "none"]).default("grow"),
  groupReveal: z.enum(["group-by-group", "series-by-series", "together"]).default("group-by-group"),
  labelReveal: z.enum(["after-group", "with-bars"]).default("after-group"),
  valueAnimation: z.enum(["static", "count-up"]).default("count-up"),
  layoutPreset: z.enum(["minimal", "editorial", "presentation"]).default("presentation"),
  barRadius: z.number().min(0).max(16).default(6),
  gridLines: z.boolean().default(true),
  gridColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#333333"),
  showAxis: z.boolean().default(true),
  axisColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#475569"),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
}).superRefine((value, ctx) => {
  for (const [index, item] of value.series.entries()) {
    if (item.values.length !== value.categories.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["series", index, "values"],
        message: "Each series.values array must match categories length",
      });
    }
  }
});

export type GroupedBarComparisonProps = z.infer<typeof GroupedBarComparisonSchema>;
