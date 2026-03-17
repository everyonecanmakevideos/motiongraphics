import { z } from "zod";
import { BackgroundSchema } from "../types";

export const MaskedTextRevealSchema = z.object({
  headline: z.string().min(1).max(60),
  subheadline: z.string().max(150).optional(),
  tagline: z.string().max(60).optional(),
  headlineColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  subheadlineColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  maskShape: z
    .enum(["wipe-left", "wipe-right", "circle-expand", "diagonal-slice", "vertical-split", "horizontal-split"])
    .default("wipe-left"),
  exitStyle: z.enum(["fade", "reverse-mask"]).default("fade"),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  fontSize: z.enum(["medium", "large", "xlarge"]).default("large"),
  duration: z.number().min(3).max(15).default(6),
});

export type MaskedTextRevealProps = z.infer<typeof MaskedTextRevealSchema>;
