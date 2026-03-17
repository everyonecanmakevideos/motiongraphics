import { z } from "zod";
import { BackgroundSchema } from "../types";

const SplitSideSchema = z.object({
  title: z.string().min(1).max(60),
  body: z.string().max(200).optional(),
  iconId: z.string().optional(),
});

export const SplitScreenSchema = z.object({
  left: SplitSideSchema,
  right: SplitSideSchema,
  dividerStyle: z.enum(["line", "gap", "none"]).default("line"),
  dividerColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#333333"),
  leftAccentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  rightAccentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FF8A65"),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  bodyColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  iconColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  entranceAnimation: z.enum(["fade-in", "slide-in", "scale-pop", "none"]).default("slide-in"),
  duration: z.number().min(3).max(15).default(6),
});

export type SplitScreenProps = z.infer<typeof SplitScreenSchema>;
