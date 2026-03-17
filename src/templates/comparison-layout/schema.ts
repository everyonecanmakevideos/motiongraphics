import { z } from "zod";
import { BackgroundSchema } from "../types";

export const ComparisonLayoutSchema = z.object({
  leftTitle: z.string().min(1).max(40),
  rightTitle: z.string().min(1).max(40),
  leftItems: z.array(z.string().max(60)).min(1).max(6),
  rightItems: z.array(z.string().max(60)).min(1).max(6),
  vsText: z.string().max(10).default("VS"),
  leftColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  rightColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FF8A65"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  vsColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFD700"),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  entranceAnimation: z.enum(["fade-in", "slide-in", "scale-pop", "none"]).default("slide-in"),
  duration: z.number().min(3).max(15).default(7),
});

export type ComparisonLayoutProps = z.infer<typeof ComparisonLayoutSchema>;
