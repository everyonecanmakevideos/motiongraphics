import { z } from "zod";
import { BackgroundSchema, StylePresetSchema, TypographySchema, MotionStyleSchema, EffectsSchema } from "../types";

export const DynamicShowcaseSchema = z.object({
  iconId: z.string().min(1),
  title: z.string().min(1).max(60),
  description: z.string().max(200).optional(),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  glowColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  orbitStyle: z.enum(["dots", "rings", "mixed"]).default("dots"),
  orbitCount: z.number().min(3).max(8).default(5),
  background: BackgroundSchema.default({ type: "gradient", from: "#0A0A0A", to: "#111133", direction: "radial" }),
  layout: z.enum(["center", "left-focus"]).default("center"),
  duration: z.number().min(4).max(15).default(7),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
});

export type DynamicShowcaseProps = z.infer<typeof DynamicShowcaseSchema>;
