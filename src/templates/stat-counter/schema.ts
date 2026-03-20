import { z } from "zod";
import { BackgroundSchema, StylePresetSchema, TypographySchema, MotionStyleSchema, EffectsSchema, PacingProfileSchema, SecondaryMotionSchema, DecorativeThemeSchema } from "../types";

export const StatCounterSchema = z.object({
  value: z.number(),
  prefix: z.string().max(5).default(""),
  suffix: z.string().max(10).default(""),
  label: z.string().max(80).optional(),
  sublabel: z.string().max(120).optional(),
  valueColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  labelColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  duration: z.number().min(2).max(15).default(6),
  entranceAnimation: z.enum(["count-up", "fade-in", "scale-pop", "none"]).default("count-up"),
  valueSize: z.enum(["medium", "large", "xlarge"]).default("large"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
  pacingProfile: PacingProfileSchema.optional(),
  secondaryMotion: SecondaryMotionSchema.optional(),
  decorativeTheme: DecorativeThemeSchema.optional(),
});

export type StatCounterProps = z.infer<typeof StatCounterSchema>;
