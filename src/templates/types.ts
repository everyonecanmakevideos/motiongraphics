import { z } from "zod";

// ── Background Schemas ────────────────────────────────────────────────────

export const SolidBgSchema = z.object({
  type: z.literal("solid"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const GradientBgSchema = z.object({
  type: z.literal("gradient"),
  from: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  to: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  direction: z
    .enum(["to-bottom", "to-right", "to-bottom-right", "to-top", "to-left", "radial"])
    .default("to-bottom"),
});

export const StripeBgSchema = z.object({
  type: z.literal("stripe"),
  baseColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  stripeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  angle: z.number().default(45),
  density: z.enum(["sparse", "normal", "dense"]).default("normal"),
});

export const GrainBgSchema = z.object({
  type: z.literal("grain"),
  baseColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  grainOpacity: z.number().min(0).max(1).default(0.08),
});

export const DotsBgSchema = z.object({
  type: z.literal("dots"),
  baseColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  dotColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  size: z.number().min(2).max(24).default(6),
  gap: z.number().min(6).max(120).default(34),
  opacity: z.number().min(0).max(1).default(0.16),
});

export const GridBgSchema = z.object({
  type: z.literal("grid"),
  baseColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  lineColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  cell: z.number().min(12).max(220).default(64),
  lineWidth: z.number().min(1).max(6).default(1),
  opacity: z.number().min(0).max(1).default(0.14),
});

export const RadialGlowBgSchema = z.object({
  type: z.literal("radial-glow"),
  baseColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  glowColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  intensity: z.number().min(0).max(1).default(0.45),
});

export const BackgroundSchema = z.discriminatedUnion("type", [
  SolidBgSchema,
  GradientBgSchema,
  StripeBgSchema,
  GrainBgSchema,
  DotsBgSchema,
  GridBgSchema,
  RadialGlowBgSchema,
]);

export type BackgroundConfig = z.infer<typeof BackgroundSchema>;

// ── Animation Presets ─────────────────────────────────────────────────────

export const AnimationPresetSchema = z.enum([
  "fade-in",
  "slide-up",
  "slide-down",
  "slide-left",
  "slide-right",
  "scale-pop",
  "blur-reveal",
  "typewriter",
  "clip-reveal",
  "spring",
  "camera-drift",
  "none",
]);

export type AnimationPreset = z.infer<typeof AnimationPresetSchema>;

// ── Creative Enhancement Schemas ─────────────────────────────────────────

export const StylePresetSchema = z.enum([
  "modern-clean",
  "bold-startup",
  "neon-tech",
  "minimal-luxury",
  "cinematic-noir",
  "retro-arcade",
  "editorial",
  "brutalist",
  "glass-morphism",
  "gradient-dream",
  "tech-terminal",
  "warm-organic",
]);
export type StylePreset = z.infer<typeof StylePresetSchema>;

export const TypographySchema = z.object({
  fontFamily: z.enum(["inter", "clash-display", "space-grotesk", "playfair-display"]),
  weight: z.enum(["regular", "medium", "bold", "black"]),
  letterSpacing: z.enum(["tight", "normal", "wide"]),
  lineHeight: z.enum(["compact", "normal", "relaxed"]),
  fontStyle: z.enum(["normal", "italic"]).default("normal"),
});
export type Typography = z.infer<typeof TypographySchema>;

export const MotionStyleSchema = z.object({
  easing: z.enum(["smooth", "snappy", "elastic", "dramatic", "playful"]),
  speed: z.enum(["slow", "medium", "fast"]),
  stagger: z.boolean(),
  microMotion: z.boolean(),
});
export type MotionStyle = z.infer<typeof MotionStyleSchema>;

export const EffectsSchema = z.object({
  shadow: z.enum(["none", "soft", "strong"]),
  glow: z.enum(["none", "subtle", "neon"]),
  blur: z.enum(["none", "subtle", "transition"]),
  scanlines: z.enum(["off", "subtle", "strong"]).default("off"),
  vignette: z.enum(["off", "subtle", "strong"]).default("off"),
  chromaticAberration: z.enum(["off", "subtle", "strong"]).default("off"),
  shake: z.enum(["off", "subtle", "strong"]).default("off"),
});
export type Effects = z.infer<typeof EffectsSchema>;

// ── Pacing Profile ──────────────────────────────────────────────────────

export const PacingProfileSchema = z.enum([
  "dramatic",    // 35% entrance, 40% main, 25% exit — slow reveals
  "energetic",   // 12% entrance, 63% main, 25% exit — fast punchy
  "elegant",     // 25% entrance, 55% main, 20% exit — leisurely
  "standard",    // 20% entrance, 60% main, 20% exit — current default
  "suspense",    // 40% entrance, 35% main, 25% exit — long build
]);
export type PacingProfile = z.infer<typeof PacingProfileSchema>;

// ── Secondary Motion ────────────────────────────────────────────────────

export const SecondaryMotionSchema = z.object({
  type: z.enum(["breathe", "float", "drift", "rotate", "none"]).default("none"),
  intensity: z.enum(["subtle", "medium", "strong"]).default("subtle"),
});
export type SecondaryMotion = z.infer<typeof SecondaryMotionSchema>;

// ── Decorative Theme ────────────────────────────────────────────────────

export const DecorativeThemeSchema = z.enum([
  "geometric",
  "minimal-dots",
  "light-streaks",
  "corner-accents",
  "confetti",
  "none",
]);
export type DecorativeTheme = z.infer<typeof DecorativeThemeSchema>;

// ── Template Manifest ─────────────────────────────────────────────────────

export interface TemplateManifest {
  id: string;
  name: string;
  description: string;
  tags: string[];
  compatibleAnimations: AnimationPreset[];
  minDuration: number;
  maxDuration: number;
  defaultDuration: number;
}

// ── Template Registry Entry ───────────────────────────────────────────────

export interface TemplateEntry {
  id: string;
  component: React.FC<Record<string, unknown>>;
  schema: z.ZodType;
  manifest: TemplateManifest;
}
