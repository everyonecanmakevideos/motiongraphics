import { z } from "zod";
import { BackgroundSchema, StylePresetSchema, TypographySchema, MotionStyleSchema, EffectsSchema } from "../types";

export const EventPromoSlateSchema = z.object({
  eyebrow: z.string().max(32).optional(),
  title: z.string().min(1).max(80),
  subtitle: z.string().max(160).optional(),
  dateText: z.string().max(40).optional(),
  timeText: z.string().max(40).optional(),
  venueText: z.string().max(50).optional(),
  locationText: z.string().max(50).optional(),
  ctaLabel: z.string().max(28).default("Register Now"),
  supportLabel: z.string().max(48).optional(),
  badgeText: z.string().max(24).optional(),
  visualStyle: z.enum(["night-neon", "conference-clean", "festival-burst"]).default("night-neon"),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  subtitleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#CBD5E1"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#60A5FA"),
  secondaryAccentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#F97316"),
  cardBackground: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#0F172A"),
  mutedTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#94A3B8"),
  metadataTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#F8FAFC"),
  buttonTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#0B1020"),
  background: BackgroundSchema.default({ type: "gradient", from: "#090B1A", to: "#101B3A", direction: "radial" }),
  entranceAnimation: z.enum(["fade-in", "slide-up", "scale-pop", "none"]).default("slide-up"),
  duration: z.number().min(4).max(12).default(7),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
});

export type EventPromoSlateProps = z.infer<typeof EventPromoSlateSchema>;
