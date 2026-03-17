import { z } from "zod";
import { BackgroundSchema } from "../types";

export const ParallaxShowcaseSchema = z.object({
  title: z.string().min(1).max(60),
  description: z.string().max(200).optional(),
  subtitle: z.string().max(80).optional(),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  parallaxDirection: z.enum(["left", "right", "up"]).default("left"),
  depthIntensity: z.enum(["subtle", "medium", "strong"]).default("medium"),
  foregroundStyle: z.enum(["dots", "lines", "geometric"]).default("geometric"),
  background: BackgroundSchema.default({ type: "gradient", from: "#0F0F23", to: "#1A1A3E", direction: "radial" }),
  entranceAnimation: z.enum(["fade-in", "slide-up", "clip-reveal"]).default("clip-reveal"),
  duration: z.number().min(5).max(15).default(8),
});

export type ParallaxShowcaseProps = z.infer<typeof ParallaxShowcaseSchema>;
