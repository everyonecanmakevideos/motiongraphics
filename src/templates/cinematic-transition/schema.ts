import { z } from "zod";
import { BackgroundSchema, StylePresetSchema, TypographySchema, MotionStyleSchema, EffectsSchema } from "../types";

export const CinematicTransitionSchema = z.object({
  sectionLabel: z.string().max(40).optional(),
  labelColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  wipeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  transitionStyle: z
    .enum(["wipe-horizontal", "wipe-vertical", "diagonal", "iris", "split"])
    .default("wipe-horizontal"),
  trailEffect: z.boolean().default(true),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  backgroundAfter: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  speed: z.enum(["slow", "normal", "fast"]).default("normal"),
  labelAnimation: z.enum(["scale-pop", "fade-in", "spring"]).default("scale-pop"),
  duration: z.number().min(2).max(8).default(3),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
});

export type CinematicTransitionProps = z.infer<typeof CinematicTransitionSchema>;
