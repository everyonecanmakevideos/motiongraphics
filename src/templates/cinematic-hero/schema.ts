import { z } from "zod";
import { BackgroundSchema, StylePresetSchema, TypographySchema, MotionStyleSchema, EffectsSchema } from "../types";

export const CinematicHeroSchema = z.object({
  headline: z.string().min(1).max(80),
  subheadline: z.string().max(150).optional(),
  kicker: z.string().max(40).optional(),
  headlineColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  mood: z.enum(["minimal", "bold", "elegant"]).default("bold"),
  revealDirection: z.enum(["left", "right", "center", "bottom"]).default("left"),
  background: BackgroundSchema.default({ type: "gradient", from: "#0A0A0A", to: "#1A1A2E", direction: "to-bottom-right" }),
  duration: z.number().min(4).max(15).default(7),
  lightSweep: z.boolean().default(true),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
});

export type CinematicHeroProps = z.infer<typeof CinematicHeroSchema>;
