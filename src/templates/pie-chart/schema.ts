import { z } from "zod";
import { BackgroundSchema } from "../types";

const SegmentSchema = z.object({
  label: z.string().min(1).max(30),
  value: z.number().min(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const PieChartSchema = z.object({
  title: z.string().max(80).optional(),
  segments: z.array(SegmentSchema).min(2).max(8),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  donut: z.boolean().default(false),
  showLabels: z.boolean().default(true),
  showPercentages: z.boolean().default(true),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  labelColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  duration: z.number().min(2).max(15).default(6),
  entranceAnimation: z.enum(["spin", "fade-in", "scale-pop", "none"]).default("spin"),
  strokeWidth: z.number().min(0).max(4).default(0),
  strokeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#0A0A0A"),
});

export type PieChartProps = z.infer<typeof PieChartSchema>;
