import { z } from "zod";
import { BackgroundSchema, StylePresetSchema, TypographySchema, MotionStyleSchema, EffectsSchema } from "../types";

const MilestoneSchema = z.object({
  label: z.string().min(1).max(40),
  description: z.string().max(100).optional(),
  // Optional icon for the milestone node. Rendered via the existing SVG Asset registry.
  // Example ids: "truck", "checkmark", "bell", etc.
  iconId: z.string().min(1).optional(),
});

export const TimelineSceneSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(80).optional(),
  milestones: z.array(MilestoneSchema).min(2).max(8),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  lineColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  dotColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  subtitleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  descriptionColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  markerStyle: z.enum(["dot", "ring", "diamond"]).default("dot"),
  entranceAnimation: z.enum(["progressive", "fade-in", "slide-up", "none"]).default("progressive"),
  duration: z.number().min(3).max(15).default(7),
  // Spacing + typography hierarchy
  titleGapPx: z.number().min(0).max(200).default(60),
  subtitleGapPx: z.number().min(0).max(80).default(12),
  titleFontWeight: z.enum(["regular", "medium", "bold", "black"]).optional(),
  subtitleFontWeight: z.enum(["regular", "medium", "bold", "black"]).optional(),
  labelFontWeight: z.enum(["regular", "medium", "bold", "black"]).optional(),
  descriptionFontWeight: z.enum(["regular", "medium", "bold", "black"]).optional(),
  labelFontSizePx: z.number().min(10).max(90).default(20),
  descriptionFontSizePx: z.number().min(8).max(80).default(15),
  subtitleFontSizePx: z.number().min(10).max(90).default(18),
  // Node sizing for icon-in-circle style
  nodeSizePx: z.number().min(14).max(120).default(34),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
});

export type TimelineSceneProps = z.infer<typeof TimelineSceneSchema>;
