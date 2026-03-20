import { z } from "zod";
import { BackgroundSchema, AnimationPresetSchema, StylePresetSchema, TypographySchema, MotionStyleSchema, EffectsSchema, PacingProfileSchema, SecondaryMotionSchema, DecorativeThemeSchema } from "../types";

export const HeroTextSchema = z.object({
  headline: z.string().min(1).max(80),
  subheadline: z.string().max(150).optional(),
  headlineColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  textEffect: z
    .enum(["none", "glitch"])
    .default("none"),
  emphasisMode: z
    .enum(["none", "second-word-accent"])
    .default("none"),
  scanlines: z.boolean().default(false),
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
  // "pill" decorations are used to create CTA-like rounded containers behind short slogans.
  // They behave like capsule buttons (rounded rectangle with large radius).
  decoration: z.enum([
    "none",
    "underline",
    "highlight-box",
    "accent-line",
    "pill-outline",
    "pill-fill",
  ]).default("none"),
  fontSize: z.enum(["medium", "large", "xlarge"]).default("large"),
  fontWeight: z.enum(["normal", "bold", "black"]).default("bold"),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
  pacingProfile: PacingProfileSchema.optional(),
  secondaryMotion: SecondaryMotionSchema.optional(),
  decorativeTheme: DecorativeThemeSchema.optional(),
});

export type HeroTextProps = z.infer<typeof HeroTextSchema>;
