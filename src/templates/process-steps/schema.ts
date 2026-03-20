import { z } from "zod";
import { BackgroundSchema, StylePresetSchema, TypographySchema, MotionStyleSchema, EffectsSchema } from "../types";

const StepSchema = z.object({
  label: z.string().min(1).max(40),
  description: z.string().max(100).optional(),
});

export const ProcessStepsSchema = z.object({
  title: z.string().max(80).optional(),
  steps: z.array(StepSchema).min(3).max(6),
  // Layout mode:
  // - "cards": current card-based process layout
  // - "tracker": horizontal progress tracker / status timeline (e.g., track your order)
  layoutMode: z.enum(["cards", "tracker"]).default("cards"),
  connectorStyle: z.enum(["arrow", "line", "dashed"]).default("arrow"),
  connectorColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  stepColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  descriptionColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  numberColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  cardBackground: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#111827"),
  cardBorderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#334155"),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  markerStyle: z.enum(["circle", "square", "pill"]).default("circle"),
  entranceAnimation: z.enum(["progressive", "fade-in", "slide-up", "none"]).default("progressive"),
  duration: z.number().min(3).max(15).default(7),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
});

export type ProcessStepsProps = z.infer<typeof ProcessStepsSchema>;
