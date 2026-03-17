import { z } from "zod";
import { BackgroundSchema } from "../types";

export const BeforeAfterSchema = z.object({
  beforeLabel: z.string().max(20).default("Before"),
  afterLabel: z.string().max(20).default("After"),
  beforeTitle: z.string().min(1).max(80),
  afterTitle: z.string().min(1).max(80),
  beforeItems: z.array(z.string().max(80)).max(4).optional(),
  afterItems: z.array(z.string().max(80)).max(4).optional(),
  beforeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FF8A65"),
  afterColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  revealStyle: z.enum(["wipe", "fade", "split"]).default("wipe"),
  entranceAnimation: z.enum(["fade-in", "slide-up", "scale-pop", "none"]).default("fade-in"),
  duration: z.number().min(4).max(15).default(7),
});

export type BeforeAfterProps = z.infer<typeof BeforeAfterSchema>;
