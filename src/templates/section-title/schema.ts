import { z } from "zod";
import { BackgroundSchema } from "../types";

export const SectionTitleSchema = z.object({
  title: z.string().min(1).max(80),
  subtitle: z.string().max(150).optional(),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  subtitleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  accentStyle: z.enum(["line-left", "line-bottom", "line-top", "dot", "none"]).default("line-left"),
  alignment: z.enum(["center", "left"]).default("center"),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  entranceAnimation: z.enum(["fade-in", "slide-up", "scale-pop", "blur-reveal", "none"]).default("fade-in"),
  duration: z.number().min(2).max(10).default(4),
});

export type SectionTitleProps = z.infer<typeof SectionTitleSchema>;
