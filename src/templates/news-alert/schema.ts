import { z } from "zod";
import {
  BackgroundSchema,
  StylePresetSchema,
  TypographySchema,
  MotionStyleSchema,
  EffectsSchema,
  PacingProfileSchema,
  SecondaryMotionSchema,
  DecorativeThemeSchema,
} from "../types";

export const NewsAlertSchema = z.object({
  // Content
  headline: z.string().min(1).max(80),
  badgeText: z.string().min(1).max(10).default("LIVE"),
  showLiveBadge: z.boolean().default(true),

  // Core colors
  headlineColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#EF4444"),

  // Background + motion (aesthetic fields)
  background: BackgroundSchema.default({ type: "gradient", from: "#0A0A0A", to: "#1A1A2E", direction: "to-bottom-right" }),
  entranceAnimation: z.enum(["fade-in", "slide-up", "slide-left", "slide-right", "scale-pop", "blur-reveal", "none"]).default("slide-left"),
  duration: z.number().min(2).max(15).default(6),

  // Style token driven knobs
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
  pacingProfile: PacingProfileSchema.optional(),
  secondaryMotion: SecondaryMotionSchema.optional(),
  decorativeTheme: DecorativeThemeSchema.optional(),
});

export type NewsAlertProps = z.infer<typeof NewsAlertSchema>;

