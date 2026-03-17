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

export const BackgroundSchema = z.discriminatedUnion("type", [
  SolidBgSchema,
  GradientBgSchema,
  StripeBgSchema,
  GrainBgSchema,
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
  "none",
]);

export type AnimationPreset = z.infer<typeof AnimationPresetSchema>;

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
