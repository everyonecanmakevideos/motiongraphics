import { z } from "zod";
import {
  BackgroundSchema,
  EffectsSchema,
  MotionStyleSchema,
  StylePresetSchema,
  TypographySchema,
} from "../types";

const HexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const IndiaMapLogisticsSchema = z.object({
  title: z.string().min(1).max(90),
  subtitle: z.string().max(180).optional(),
  originState: z.string().min(1).max(60),
  destinationState: z.string().min(1).max(60),
  viaStates: z.array(z.string().min(1).max(60)).max(4).default([]),
  originLabel: z.string().min(1).max(40).optional(),
  destinationLabel: z.string().min(1).max(40).optional(),
  routeLabel: z.string().min(1).max(72).optional(),
  titleColor: HexColor.default("#172230"),
  subtitleColor: HexColor.default("#556476"),
  labelColor: HexColor.default("#172230"),
  baseFillColor: HexColor.default("#D5E0E9"),
  outlineColor: HexColor.default("#A7B9C8"),
  routeColor: HexColor.default("#FFB24A"),
  nodeColor: HexColor.default("#FFF7EA"),
  background: BackgroundSchema.default({
    type: "gradient",
    from: "#EEF2F6",
    to: "#E2E9F0",
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

export type IndiaMapLogisticsProps = z.infer<typeof IndiaMapLogisticsSchema>;
