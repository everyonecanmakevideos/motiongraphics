import { z } from "zod";
import { BackgroundSchema, StylePresetSchema, TypographySchema, MotionStyleSchema, EffectsSchema } from "../types";

export const KineticTypographySchema = z.object({
  lines: z.array(z.string().min(1).max(80)).min(1).max(8),
  lineColors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).optional(),
  defaultColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  fontSize: z.number().min(24).max(160).default(72),
  fontWeight: z.enum(["normal", "bold", "black"]).default("bold"),
  alignment: z.enum(["center", "left", "right"]).default("center"),
  lineSpacing: z.number().min(0.8).max(2.5).default(1.3),
  staggerStyle: z.enum(["line-by-line", "word-by-word", "all-at-once"]).default("line-by-line"),
  entranceAnimation: z.enum(["fade-in", "slide-up", "scale-pop", "blur-reveal", "typewriter", "none"]).default("fade-in"),
  duration: z.number().min(2).max(15).default(6),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
});

export type KineticTypographyProps = z.infer<typeof KineticTypographySchema>;
