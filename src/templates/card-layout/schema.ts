import { z } from "zod";
import { BackgroundSchema } from "../types";

const CardSchema = z.object({
  heading: z.string().min(1).max(40),
  body: z.string().max(120).optional(),
  iconId: z.string().optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const CardLayoutSchema = z.object({
  title: z.string().max(80).optional(),
  cards: z.array(CardSchema).min(2).max(6),
  background: BackgroundSchema.default({ type: "solid", color: "#0A0A0A" }),
  columns: z.number().min(1).max(3).default(3),
  cardBackground: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#1E1E2E"),
  titleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  headingColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  bodyColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B0BEC5"),
  iconColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4FC3F7"),
  entranceAnimation: z.enum(["fade-in", "slide-up", "scale-pop", "none"]).default("fade-in"),
  duration: z.number().min(3).max(15).default(7),
});

export type CardLayoutProps = z.infer<typeof CardLayoutSchema>;
