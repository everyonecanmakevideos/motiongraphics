import { z } from "zod";
import { BackgroundSchema } from "../types";

export const IconCalloutSchema = z.object({
  iconId: z.string().min(1),
  headline: z.string().min(1).max(80),
  description: z.string().max(200).optional(),
  iconColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  headlineColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  descriptionColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  iconSize: z.number().min(40).max(300).default(120),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  layout: z.enum(["icon-top", "icon-left", "icon-right"]).default("icon-top"),
  entranceAnimation: z.enum(["fade-in", "slide-up", "scale-pop", "none"]).default("fade-in"),
  duration: z.number().min(2).max(15).default(6),
});

export type IconCalloutProps = z.infer<typeof IconCalloutSchema>;
