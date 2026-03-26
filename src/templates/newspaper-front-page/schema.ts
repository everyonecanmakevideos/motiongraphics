import { z } from "zod";
import {
  BackgroundSchema,
  DecorativeThemeSchema,
  EffectsSchema,
  MotionStyleSchema,
  StylePresetSchema,
  TypographySchema,
} from "../types";

const ColumnSchema = z.object({
  title: z.string().max(40).optional(),
  text: z.string().min(20).max(500),
});

export const NewspaperFrontPageSchema = z.object({
  masthead: z.string().min(1).max(48).default("The Daily Chronicle"),
  editionLine: z.string().max(80).default("Vol. XLII No. 184"),
  dateLine: z.string().max(80).default("New York, Tuesday, October 24, 1939"),
  priceLine: z.string().max(24).default("Price Two Cents"),
  kicker: z.string().max(72).optional(),
  headline: z.string().min(1).max(80),
  subheadline: z.string().max(160).optional(),
  photoLabel: z.string().max(32).default("Wire Photo"),
  photoCaption: z.string().max(120).optional(),
  footerLine: z.string().max(120).optional(),
  columns: z.array(ColumnSchema).min(2).max(4),
  visualStyle: z
    .enum([
      "classic-front-page",
      "modern-breaking-news",
      "historic-edition",
      "financial-journal",
      "tabloid-shock",
      "sports-daily",
    ])
    .default("classic-front-page"),
  paperTone: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#F3E8CC"),
  inkColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#19140F"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B45309"),
  frameColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#D1C19A"),
  background: BackgroundSchema.default({
    type: "gradient",
    from: "#1A1510",
    to: "#2D241C",
    direction: "radial",
  }),
  entranceAnimation: z
    .enum(["fade-in", "slide-up", "scale-pop", "camera-drift", "none"])
    .default("scale-pop"),
  duration: z.number().min(5).max(12).default(7),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
  decorativeTheme: DecorativeThemeSchema.optional(),
  paperTilt: z.number().min(-10).max(10).default(-3),
  showPhotoFrame: z.boolean().default(true),
});

export type NewspaperFrontPageProps = z.infer<typeof NewspaperFrontPageSchema>;
