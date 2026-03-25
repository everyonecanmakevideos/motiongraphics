import { z } from "zod";
import {
  BackgroundSchema,
  EffectsSchema,
  MotionStyleSchema,
  StylePresetSchema,
  TypographySchema,
} from "../types";

const ChapterSchema = z.object({
  timestamp: z.string().min(1).max(12),
  title: z.string().min(1).max(56),
  summary: z.string().max(96).optional(),
  iconId: z.string().max(40).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const YTChaptersSchema = z.object({
  eyebrow: z.string().max(32).optional(),
  title: z.string().max(88).default("In This Video"),
  subtitle: z.string().max(140).optional(),
  chapters: z.array(ChapterSchema).min(3).max(8),
  activeChapter: z.number().min(0).max(7).default(0),
  currentTimestamp: z.string().max(12).optional(),
  totalDurationLabel: z.string().max(16).optional(),
  ctaLabel: z.string().max(28).optional(),
  visualStyle: z
    .enum(["clean-broadcast", "editorial-index", "creator-dark"])
    .default("clean-broadcast"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#2563EB"),
  secondaryAccentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#EF4444"),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#0F172A"),
  subtitleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#475569"),
  bodyColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#1E293B"),
  mutedTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#64748B"),
  panelBackground: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  mutedPanelBackground: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#F8FAFC"),
  panelBorderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#CBD5E1"),
  buttonTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  background: BackgroundSchema.default({
    type: "gradient",
    from: "#F7F4EE",
    to: "#E6EEF8",
    direction: "to-bottom-right",
  }),
  entranceAnimation: z
    .enum(["fade-in", "slide-up", "scale-pop", "none"])
    .default("slide-up"),
  duration: z.number().min(5).max(12).default(7),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
});

export type YTChaptersProps = z.infer<typeof YTChaptersSchema>;
