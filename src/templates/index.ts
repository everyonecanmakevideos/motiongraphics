import type { TemplateEntry } from "./types";
import { HeroText } from "./hero-text/HeroText";
import { HeroTextSchema } from "./hero-text/schema";
import heroTextManifest from "./hero-text/manifest.json";
import { BarChart } from "./bar-chart/BarChart";
import { BarChartSchema } from "./bar-chart/schema";
import barChartManifest from "./bar-chart/manifest.json";
import { PieChart } from "./pie-chart/PieChart";
import { PieChartSchema } from "./pie-chart/schema";
import pieChartManifest from "./pie-chart/manifest.json";
import { StatCounter } from "./stat-counter/StatCounter";
import { StatCounterSchema } from "./stat-counter/schema";
import statCounterManifest from "./stat-counter/manifest.json";
import { KineticTypography } from "./kinetic-typography/KineticTypography";
import { KineticTypographySchema } from "./kinetic-typography/schema";
import kineticTypographyManifest from "./kinetic-typography/manifest.json";
import { IconCallout } from "./icon-callout/IconCallout";
import { IconCalloutSchema } from "./icon-callout/schema";
import iconCalloutManifest from "./icon-callout/manifest.json";
import { ComparisonLayout } from "./comparison-layout/ComparisonLayout";
import { ComparisonLayoutSchema } from "./comparison-layout/schema";
import comparisonLayoutManifest from "./comparison-layout/manifest.json";
import { TimelineScene } from "./timeline-scene/TimelineScene";
import { TimelineSceneSchema } from "./timeline-scene/schema";
import timelineSceneManifest from "./timeline-scene/manifest.json";
import { CardLayout } from "./card-layout/CardLayout";
import { CardLayoutSchema } from "./card-layout/schema";
import cardLayoutManifest from "./card-layout/manifest.json";

export const TEMPLATE_REGISTRY: Record<string, TemplateEntry> = {
  "hero-text": {
    id: "hero-text",
    component: HeroText as TemplateEntry["component"],
    schema: HeroTextSchema,
    manifest: heroTextManifest as TemplateEntry["manifest"],
  },
  "bar-chart": {
    id: "bar-chart",
    component: BarChart as TemplateEntry["component"],
    schema: BarChartSchema,
    manifest: barChartManifest as TemplateEntry["manifest"],
  },
  "pie-chart": {
    id: "pie-chart",
    component: PieChart as TemplateEntry["component"],
    schema: PieChartSchema,
    manifest: pieChartManifest as TemplateEntry["manifest"],
  },
  "stat-counter": {
    id: "stat-counter",
    component: StatCounter as TemplateEntry["component"],
    schema: StatCounterSchema,
    manifest: statCounterManifest as TemplateEntry["manifest"],
  },
  "kinetic-typography": {
    id: "kinetic-typography",
    component: KineticTypography as TemplateEntry["component"],
    schema: KineticTypographySchema,
    manifest: kineticTypographyManifest as TemplateEntry["manifest"],
  },
  "icon-callout": {
    id: "icon-callout",
    component: IconCallout as TemplateEntry["component"],
    schema: IconCalloutSchema,
    manifest: iconCalloutManifest as TemplateEntry["manifest"],
  },
  "comparison-layout": {
    id: "comparison-layout",
    component: ComparisonLayout as TemplateEntry["component"],
    schema: ComparisonLayoutSchema,
    manifest: comparisonLayoutManifest as TemplateEntry["manifest"],
  },
  "timeline-scene": {
    id: "timeline-scene",
    component: TimelineScene as TemplateEntry["component"],
    schema: TimelineSceneSchema,
    manifest: timelineSceneManifest as TemplateEntry["manifest"],
  },
  "card-layout": {
    id: "card-layout",
    component: CardLayout as TemplateEntry["component"],
    schema: CardLayoutSchema,
    manifest: cardLayoutManifest as TemplateEntry["manifest"],
  },
};

export function getTemplateIds(): string[] {
  return Object.keys(TEMPLATE_REGISTRY);
}

export function getTemplateDescriptions(): string {
  return Object.values(TEMPLATE_REGISTRY)
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
