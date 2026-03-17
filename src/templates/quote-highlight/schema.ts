import { z } from "zod";
import { BackgroundSchema } from "../types";

export const QuoteHighlightSchema = z.object({
  quote: z.string().min(1).max(300),
  attribution: z.string().max(80).optional(),
  attributionTitle: z.string().max(80).optional(),
  quoteColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  attributionColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  quoteMarkStyle: z.enum(["large", "small", "bar", "none"]).default("large"),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  entranceAnimation: z.enum(["fade-in", "slide-up", "scale-pop", "blur-reveal", "typewriter", "none"]).default("fade-in"),
  duration: z.number().min(3).max(15).default(6),
});

export type QuoteHighlightProps = z.infer<typeof QuoteHighlightSchema>;
