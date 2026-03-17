import { z } from "zod";
import { BackgroundSchema } from "../types";

export const ProblemSolutionSchema = z.object({
  problemLabel: z.string().max(20).default("Problem"),
  solutionLabel: z.string().max(20).default("Solution"),
  problem: z.string().min(1).max(200),
  solution: z.string().min(1).max(200),
  problemIconId: z.string().optional(),
  solutionIconId: z.string().optional(),
  problemColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FF6B6B"),
  solutionColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#51CF66"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  labelColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  entranceAnimation: z.enum(["fade-in", "slide-up", "scale-pop", "none"]).default("slide-up"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  transitionStyle: z.enum(["fade-switch", "slide-switch", "side-by-side"]).default("fade-switch"),
  duration: z.number().min(4).max(15).default(7),
});

export type ProblemSolutionProps = z.infer<typeof ProblemSolutionSchema>;
