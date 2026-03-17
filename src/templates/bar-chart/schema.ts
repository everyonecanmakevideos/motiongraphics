import { z } from "zod";
import { BackgroundSchema } from "../types";

const BarItemSchema = z.object({
  label: z.string().min(1).max(30),
  value: z.number().min(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const BarChartSchema = z.object({
  title: z.string().max(80).optional(),
  bars: z.array(BarItemSchema).min(2).max(10),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  showValues: z.boolean().default(true),
  orientation: z.enum(["vertical", "horizontal"]).default("vertical"),
  barWidth: z.number().min(20).max(120).default(60),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  labelColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  valueColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  duration: z.number().min(2).max(15).default(6),
  entranceAnimation: z.enum(["grow", "fade-in", "slide-up", "none"]).default("grow"),
  barRadius: z.number().min(0).max(16).default(6),
  gridLines: z.boolean().default(false),
  gridColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#333333"),
});

export type BarChartProps = z.infer<typeof BarChartSchema>;
