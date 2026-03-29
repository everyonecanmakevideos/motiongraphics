import { z } from "zod";
import {
  BackgroundSchema,
  StylePresetSchema,
  TypographySchema,
  MotionStyleSchema,
  EffectsSchema,
} from "../types";

const LocationSchema = z.object({
  label: z.string().min(1).max(40),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  description: z.string().max(100).optional(),
});

export const MapHighlightSchema = z.object({
  title: z.string().max(80).optional(),
  locations: z.array(LocationSchema).min(1).max(8),
  mapRegion: z.enum(["world", "europe", "usa", "india"]).default("world"),
  mapStyle: z
    .enum([
      "world-dots",
      "abstract-grid",
      "minimal-outline",
      "technical-dark",
      "editorial-light",
      "geo-color",
    ])
    .default("world-dots"),
  markerColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#FF6B6B"),
  markerPulse: z.boolean().default(true),
  titleColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#FFFFFF"),
  labelColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#FFFFFF"),
  mapColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#2A2A3A"),
  connectionLines: z.boolean().default(false),
  connectionStyle: z.enum(["solid", "dashed", "dotted"]).default("solid"),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  entranceAnimation: z
    .enum(["fade-in", "scale-pop", "progressive", "none"])
    .default("progressive"),
  duration: z.number().min(3).max(15).default(7),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
});

export type MapHighlightProps = z.infer<typeof MapHighlightSchema>;
