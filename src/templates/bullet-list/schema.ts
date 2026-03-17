import { z } from "zod";
import { BackgroundSchema } from "../types";

export const BulletListSchema = z.object({
  title: z.string().max(80).optional(),
  items: z.array(z.string().min(1).max(120)).min(2).max(8),
  bulletStyle: z.enum(["dot", "checkmark", "number", "dash", "arrow"]).default("dot"),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  bulletColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  entranceAnimation: z.enum(["fade-in", "slide-up", "scale-pop", "none"]).default("slide-up"),
  duration: z.number().min(3).max(15).default(6),
  spacing: z.enum(["tight", "normal", "relaxed"]).default("normal"),
});

export type BulletListProps = z.infer<typeof BulletListSchema>;
