import { z } from "zod";
import { BackgroundSchema, StylePresetSchema, TypographySchema, MotionStyleSchema, EffectsSchema } from "../types";

const PlanFeatureSchema = z.object({
  label: z.string().min(1).max(56),
  included: z.boolean().default(true),
  emphasis: z.boolean().default(false),
});

const PlanSchema = z.object({
  name: z.string().min(1).max(24),
  price: z.string().min(1).max(20),
  priceSuffix: z.string().max(20).optional(),
  description: z.string().max(90).optional(),
  badge: z.string().max(24).optional(),
  iconId: z.string().max(40).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  ctaLabel: z.string().max(24).optional(),
  features: z.array(PlanFeatureSchema).min(3).max(8),
});

export const PricingComparisonSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(120).optional(),
  plans: z.array(PlanSchema).length(3),
  visualStyle: z.enum(["saas-dark", "investor-clean", "creative-studio"]).default("saas-dark"),
  highlightedPlan: z.number().min(0).max(2).default(1),
  highlightLabel: z.string().max(24).default("Best Value"),
  comparisonNote: z.string().max(100).optional(),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  subtitleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#A7B0C0"),
  planNameColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  priceColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  mutedTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#A7B0C0"),
  featureTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#EEF2FF"),
  cardBackground: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#16181F"),
  mutedCardBackground: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#101218"),
  cardBorderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#2D3342"),
  iconColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  includedColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4ADE80"),
  excludedColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#7C8599"),
  buttonTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#0B1020"),
  entranceAnimation: z.enum(["fade-in", "slide-up", "scale-pop", "none"]).default("slide-up"),
  duration: z.number().min(4).max(15).default(7),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
});

export type PricingComparisonProps = z.infer<typeof PricingComparisonSchema>;
