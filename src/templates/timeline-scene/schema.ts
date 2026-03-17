import { z } from "zod";
import { BackgroundSchema } from "../types";

const MilestoneSchema = z.object({
  label: z.string().min(1).max(40),
  description: z.string().max(100).optional(),
});

export const TimelineSceneSchema = z.object({
  title: z.string().max(80).optional(),
  milestones: z.array(MilestoneSchema).min(2).max(8),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  lineColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  dotColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  descriptionColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  markerStyle: z.enum(["dot", "ring", "diamond"]).default("dot"),
  entranceAnimation: z.enum(["progressive", "fade-in", "slide-up", "none"]).default("progressive"),
  duration: z.number().min(3).max(15).default(7),
});

export type TimelineSceneProps = z.infer<typeof TimelineSceneSchema>;
