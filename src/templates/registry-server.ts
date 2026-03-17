/**
 * Server-safe template registry — schemas and manifests only, NO React components.
 * Use this in lib/ code (API routes, pipeline) to avoid pulling Remotion into the Next.js server bundle.
 */
import type { z } from "zod";
import type { TemplateManifest } from "./types";
import { HeroTextSchema } from "./hero-text/schema";
import heroTextManifest from "./hero-text/manifest.json";
import { BarChartSchema } from "./bar-chart/schema";
import barChartManifest from "./bar-chart/manifest.json";
import { PieChartSchema } from "./pie-chart/schema";
import pieChartManifest from "./pie-chart/manifest.json";
import { StatCounterSchema } from "./stat-counter/schema";
import statCounterManifest from "./stat-counter/manifest.json";
import { KineticTypographySchema } from "./kinetic-typography/schema";
import kineticTypographyManifest from "./kinetic-typography/manifest.json";
import { IconCalloutSchema } from "./icon-callout/schema";
import iconCalloutManifest from "./icon-callout/manifest.json";
import { ComparisonLayoutSchema } from "./comparison-layout/schema";
import comparisonLayoutManifest from "./comparison-layout/manifest.json";
import { TimelineSceneSchema } from "./timeline-scene/schema";
import timelineSceneManifest from "./timeline-scene/manifest.json";
import { CardLayoutSchema } from "./card-layout/schema";
import cardLayoutManifest from "./card-layout/manifest.json";

export interface ServerTemplateEntry {
  id: string;
  schema: z.ZodType;
  manifest: TemplateManifest;
}

export const SERVER_TEMPLATE_REGISTRY: Record<string, ServerTemplateEntry> = {
  "hero-text": {
    id: "hero-text",
    schema: HeroTextSchema,
    manifest: heroTextManifest as TemplateManifest,
  },
  "bar-chart": {
    id: "bar-chart",
    schema: BarChartSchema,
    manifest: barChartManifest as TemplateManifest,
  },
  "pie-chart": {
    id: "pie-chart",
    schema: PieChartSchema,
    manifest: pieChartManifest as TemplateManifest,
  },
  "stat-counter": {
    id: "stat-counter",
    schema: StatCounterSchema,
    manifest: statCounterManifest as TemplateManifest,
  },
  "kinetic-typography": {
    id: "kinetic-typography",
    schema: KineticTypographySchema,
    manifest: kineticTypographyManifest as TemplateManifest,
  },
  "icon-callout": {
    id: "icon-callout",
    schema: IconCalloutSchema,
    manifest: iconCalloutManifest as TemplateManifest,
  },
  "comparison-layout": {
    id: "comparison-layout",
    schema: ComparisonLayoutSchema,
    manifest: comparisonLayoutManifest as TemplateManifest,
  },
  "timeline-scene": {
    id: "timeline-scene",
    schema: TimelineSceneSchema,
    manifest: timelineSceneManifest as TemplateManifest,
  },
  "card-layout": {
    id: "card-layout",
    schema: CardLayoutSchema,
    manifest: cardLayoutManifest as TemplateManifest,
  },
};

export function getTemplateIds(): string[] {
  return Object.keys(SERVER_TEMPLATE_REGISTRY);
}

export function getTemplateDescriptions(): string {
  return Object.values(SERVER_TEMPLATE_REGISTRY)
    .map((entry) => {
      const m = entry.manifest;
      return (
        "- " + m.id + ": " + m.description +
        " [tags: " + m.tags.join(", ") + "]" +
        " [animations: " + m.compatibleAnimations.join(", ") + "]" +
        " [duration: " + m.minDuration + "-" + m.maxDuration + "s]"
      );
    })
    .join("\n");
}
