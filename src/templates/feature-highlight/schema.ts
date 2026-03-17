import { z } from "zod";
import { BackgroundSchema } from "../types";

export const FeatureHighlightSchema = z.object({
  iconId: z.string().min(1),
  title: z.string().min(1).max(60),
  description: z.string().max(200).optional(),
  bulletPoints: z.array(z.string().max(80)).max(4).optional(),
  iconColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  descriptionColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  bulletColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  iconBackground: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  layout: z.enum(["icon-left", "icon-top", "icon-right"]).default("icon-left"),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  entranceAnimation: z.enum(["fade-in", "slide-up", "scale-pop", "none"]).default("fade-in"),
  duration: z.number().min(3).max(15).default(6),
});

export type FeatureHighlightProps = z.infer<typeof FeatureHighlightSchema>;
