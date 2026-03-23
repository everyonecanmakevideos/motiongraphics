import { z } from "zod";
import { BackgroundSchema, EffectsSchema, MotionStyleSchema, StylePresetSchema, TypographySchema } from "../types";

const BarSeriesSchema = z.object({
  label: z.string().min(1).max(30),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  values: z.array(z.number().min(0)).min(2).max(10),
});

export const UpdatingBarChartSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(120).optional(),
  bars: z.array(BarSeriesSchema).min(2).max(10),
  stepLabels: z.array(z.string().min(1).max(24)).min(2).max(8),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  showValues: z.boolean().default(true),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  subtitleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#94A3B8"),
  labelColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  valueColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  stepLabelColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#CBD5E1"),
  activeStepColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  stepTrackColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#475569"),
  valuePrefix: z.string().max(12).default(""),
  valueSuffix: z.string().max(12).default(""),
  duration: z.number().min(3).max(15).default(6),
  entranceAnimation: z.enum(["grow", "fade-in", "slide-up", "none"]).default("grow"),
  updateBehavior: z.enum(["step-update", "smooth-flow"]).default("smooth-flow"),
  labelReveal: z.enum(["after-update", "with-update"]).default("after-update"),
  valueAnimation: z.enum(["static", "count-up"]).default("count-up"),
  layoutPreset: z.enum(["minimal", "editorial", "presentation", "social"]).default("minimal"),
  barRadius: z.number().min(0).max(16).default(6),
  gridLines: z.boolean().default(true),
  gridColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#333333"),
  showAxis: z.boolean().default(true),
  axisColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#475569"),
  showStepTracker: z.boolean().default(true),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
}).superRefine((value, ctx) => {
  const expectedLength = value.stepLabels.length;

  for (const [index, item] of value.bars.entries()) {
    if (item.values.length !== expectedLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bars", index, "values"],
        message: "Each bars.values array must match stepLabels length",
      });
    }
  }
});

export type UpdatingBarChartProps = z.infer<typeof UpdatingBarChartSchema>;
