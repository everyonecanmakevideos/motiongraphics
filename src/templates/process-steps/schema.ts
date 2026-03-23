import { z } from "zod";
import { BackgroundSchema, StylePresetSchema, TypographySchema, MotionStyleSchema, EffectsSchema } from "../types";

const StepSchema = z.object({
  label: z.string().min(1).max(40),
  description: z.string().max(100).optional(),
  // Optional icon for the step node (rendered via SVG Asset registry).
  iconId: z.string().min(1).optional(),
});

export const ProcessStepsSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(80).optional(),
  steps: z.array(StepSchema).min(3).max(6),
  // 1-based index of the step that should be visually highlighted.
  // If omitted, all steps render in their default/unhighlighted state.
  currentStep: z.number().int().min(1).max(6).optional(),
  connectorStyle: z.enum(["arrow", "line", "dashed"]).default("arrow"),
  stepColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  subtitleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  descriptionColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  numberColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  // If provided, the active step number/icon color override.
  activeStepColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  activeNumberColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  activeTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  activeDescriptionColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  activeGlowColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  activeGlowStrength: z.number().min(0).max(60).optional(),
  // Title / step hierarchy + sizing (used to keep premium typography).
  titleGapPx: z.number().min(0).max(200).default(60),
  subtitleGapPx: z.number().min(0).max(80).default(12),
  titleFontWeight: z.enum(["regular", "medium", "bold", "black"]).optional(),
  subtitleFontWeight: z.enum(["regular", "medium", "bold", "black"]).optional(),
  labelFontWeight: z.enum(["regular", "medium", "bold", "black"]).optional(),
  descriptionFontWeight: z.enum(["regular", "medium", "bold", "black"]).optional(),
  labelFontSizePx: z.number().min(10).max(90).default(20),
  descriptionFontSizePx: z.number().min(8).max(80).default(15),
  subtitleFontSizePx: z.number().min(10).max(90).default(18),
  nodeSizePx: z.number().min(20).max(140).default(52),
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
