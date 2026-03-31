import { z } from "zod";
import {
  BackgroundSchema,
  EffectsSchema,
  MotionStyleSchema,
  StylePresetSchema,
  TypographySchema,
} from "../types";

const HexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const IndiaMapRouteSchema = z.object({
  title: z.string().min(1).max(90),
  subtitle: z.string().max(180).optional(),
  originState: z.string().min(1).max(60),
  destinationState: z.string().min(1).max(60),
  viaStates: z.array(z.string().min(1).max(60)).max(4).default([]),
  originLabel: z.string().min(1).max(40).optional(),
  destinationLabel: z.string().min(1).max(40).optional(),
  routeLabel: z.string().min(1).max(72).optional(),
  titleColor: HexColor.default("#F8FAFC"),
  subtitleColor: HexColor.default("#9FB0C7"),
  labelColor: HexColor.default("#F8FAFC"),
  baseFillColor: HexColor.default("#0D131A"),
  outlineColor: HexColor.default("#2A3444"),
  routeColor: HexColor.default("#86B7FF"),
  nodeColor: HexColor.default("#3DDC97"),
  background: BackgroundSchema.default({
    type: "gradient",
    from: "#02060B",
    to: "#0A1320",
    direction: "to-bottom-right",
  }),
  entranceAnimation: z
    .enum(["fade-in", "slide-up", "scale-pop", "none"])
    .default("slide-up"),
  duration: z.number().min(4).max(18).default(8),
  stylePreset: StylePresetSchema.optional(),
  typography: TypographySchema.optional(),
  motionStyle: MotionStyleSchema.optional(),
  effects: EffectsSchema.optional(),
});

export type IndiaMapRouteProps = z.infer<typeof IndiaMapRouteSchema>;
