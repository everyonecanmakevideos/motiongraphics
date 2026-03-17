import { z } from "zod";
import { BackgroundSchema, AnimationPresetSchema } from "../types";

export const HeroTextSchema = z.object({
  headline: z.string().min(1).max(80),
  subheadline: z.string().max(150).optional(),
  headlineColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  subheadlineColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  entranceAnimation: z
    .enum(["fade-in", "slide-up", "scale-pop", "blur-reveal", "typewriter", "none"])
    .default("fade-in"),
  subheadlineAnimation: z
    .enum(["fade-in", "slide-up", "scale-pop", "blur-reveal", "none"])
    .default("fade-in"),
  duration: z.number().min(2).max(15).default(6),
  style: z.enum(["centered", "left-aligned", "split"]).default("centered"),
  decoration: z.enum(["none", "underline", "highlight-box", "accent-line"]).default("none"),
});

export type HeroTextProps = z.infer<typeof HeroTextSchema>;
