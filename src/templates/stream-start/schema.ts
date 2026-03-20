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

export const StreamStartSchema = z.object({
  // Content
  headline: z.string().min(1).max(80),
  showLiveBadge: z.boolean().default(true),
  badgeText: z.string().min(1).max(10).default("LIVE"),

  // Styling
  headlineColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#EF4444"),
  background: BackgroundSchema.default({ type: "solid", color: "#000000" }),

  // Stream UI feel knobs
  scanlines: z.boolean().default(true),
  flicker: z.boolean().default(true),
  glowOnLiveWord: z.boolean().default(true),

  // Motion
  entranceAnimation: z.enum(["fade-in", "slide-up", "slide-left", "scale-pop", "blur-reveal", "none"]).default("slide-left"),
  duration: z.number().min(2).max(15).default(5),

  // Creative knobs (token-driven)
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
  pacingProfile: PacingProfileSchema.optional(),
  secondaryMotion: SecondaryMotionSchema.optional(),
  decorativeTheme: DecorativeThemeSchema.optional(),
});

export type StreamStartProps = z.infer<typeof StreamStartSchema>;

