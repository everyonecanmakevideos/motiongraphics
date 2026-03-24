import { z } from "zod";
import { BackgroundSchema, StylePresetSchema, TypographySchema, MotionStyleSchema, EffectsSchema } from "../types";

const TestimonialItemSchema = z.object({
  quote: z.string().min(8).max(180),
  name: z.string().min(1).max(32),
  role: z.string().max(48).optional(),
  company: z.string().max(40).optional(),
  rating: z.number().min(1).max(5).default(5),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const TestimonialWallSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(120).optional(),
  testimonials: z.array(TestimonialItemSchema).min(3).max(6),
  featuredIndex: z.number().min(0).max(5).default(0),
  visualStyle: z.enum(["saas-grid", "editorial-light", "warm-brand"]).default("saas-grid"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#60A5FA"),
  secondaryAccentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#F59E0B"),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  subtitleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#A7B0C0"),
  quoteColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#F8FAFC"),
  metaTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#CBD5E1"),
  mutedTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#94A3B8"),
  cardBackground: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#101523"),
  mutedCardBackground: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#0B0F1A"),
  cardBorderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#25304A"),
  background: BackgroundSchema.default({ type: "gradient", from: "#050816", to: "#0E1A38", direction: "radial" }),
  entranceAnimation: z.enum(["fade-in", "slide-up", "scale-pop", "none"]).default("slide-up"),
  duration: z.number().min(5).max(12).default(7),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
});

export type TestimonialWallProps = z.infer<typeof TestimonialWallSchema>;
