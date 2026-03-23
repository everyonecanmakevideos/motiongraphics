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
  headline: z.string().min(1).max(80).default("LIVE"),
  badgeText: z.string().min(1).max(10).default("LIVE"),
  showLiveBadge: z.boolean().default(true),

  // Core colors
  headlineColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  badgeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#22D3EE"),
  background: BackgroundSchema.default({
    type: "gradient",
    from: "#050510",
    to: "#0A0A20",
    direction: "to-bottom",
  }),

  // Motion + timing
  entranceAnimation: z
    .enum(["fade-in", "slide-up", "slide-left", "scale-pop", "blur-reveal", "none"])
    .default("slide-up"),
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

