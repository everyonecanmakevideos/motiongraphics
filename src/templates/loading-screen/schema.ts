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

export const LoadingScreenSchema = z.object({
  // Content
  text: z.string().min(1).max(60).default("loading..."),
  subtext: z.string().max(80).optional(),

  // Visual
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#E2E8F0"),
  subtextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#94A3B8"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#22D3EE"),
  background: BackgroundSchema.default({ type: "solid", color: "#05070C" }),

  // Behavior
  dotStyle: z.enum(["three-dots", "bar"]).default("three-dots"),
  dotCount: z.number().min(3).max(5).default(3),
  size: z.enum(["small", "medium", "large"]).default("medium"),
  duration: z.number().min(2).max(15).default(4),

  // Creative knobs (token-driven)
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
  pacingProfile: PacingProfileSchema.optional(),
  secondaryMotion: SecondaryMotionSchema.optional(),
  decorativeTheme: DecorativeThemeSchema.optional(),
});

export type LoadingScreenProps = z.infer<typeof LoadingScreenSchema>;

