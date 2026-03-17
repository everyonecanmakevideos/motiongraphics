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
import { SectionTitleSchema } from "./section-title/schema";
import sectionTitleManifest from "./section-title/manifest.json";
import { BulletListSchema } from "./bullet-list/schema";
import bulletListManifest from "./bullet-list/manifest.json";
import { QuoteHighlightSchema } from "./quote-highlight/schema";
import quoteHighlightManifest from "./quote-highlight/manifest.json";
import { DataCalloutSchema } from "./data-callout/schema";
import dataCalloutManifest from "./data-callout/manifest.json";
import { FeatureHighlightSchema } from "./feature-highlight/schema";
import featureHighlightManifest from "./feature-highlight/manifest.json";
import { SplitScreenSchema } from "./split-screen/schema";
import splitScreenManifest from "./split-screen/manifest.json";
import { ProblemSolutionSchema } from "./problem-solution/schema";
import problemSolutionManifest from "./problem-solution/manifest.json";
import { BeforeAfterSchema } from "./before-after/schema";
import beforeAfterManifest from "./before-after/manifest.json";
import { ProcessStepsSchema } from "./process-steps/schema";
import processStepsManifest from "./process-steps/manifest.json";
import { MapHighlightSchema } from "./map-highlight/schema";
import mapHighlightManifest from "./map-highlight/manifest.json";
import { MaskedTextRevealSchema } from "./masked-text-reveal/schema";
import maskedTextRevealManifest from "./masked-text-reveal/manifest.json";
import { CinematicHeroSchema } from "./cinematic-hero/schema";
import cinematicHeroManifest from "./cinematic-hero/manifest.json";
import { CinematicTransitionSchema } from "./cinematic-transition/schema";
import cinematicTransitionManifest from "./cinematic-transition/manifest.json";
import { DynamicShowcaseSchema } from "./dynamic-showcase/schema";
import dynamicShowcaseManifest from "./dynamic-showcase/manifest.json";
import { ParallaxShowcaseSchema } from "./parallax-showcase/schema";
import parallaxShowcaseManifest from "./parallax-showcase/manifest.json";

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
  "section-title": {
    id: "section-title",
    schema: SectionTitleSchema,
    manifest: sectionTitleManifest as TemplateManifest,
  },
  "bullet-list": {
    id: "bullet-list",
    schema: BulletListSchema,
    manifest: bulletListManifest as TemplateManifest,
  },
  "quote-highlight": {
    id: "quote-highlight",
    schema: QuoteHighlightSchema,
    manifest: quoteHighlightManifest as TemplateManifest,
  },
  "data-callout": {
    id: "data-callout",
    schema: DataCalloutSchema,
    manifest: dataCalloutManifest as TemplateManifest,
  },
  "feature-highlight": {
    id: "feature-highlight",
    schema: FeatureHighlightSchema,
    manifest: featureHighlightManifest as TemplateManifest,
  },
  "split-screen": {
    id: "split-screen",
    schema: SplitScreenSchema,
    manifest: splitScreenManifest as TemplateManifest,
  },
  "problem-solution": {
    id: "problem-solution",
    schema: ProblemSolutionSchema,
    manifest: problemSolutionManifest as TemplateManifest,
  },
  "before-after": {
    id: "before-after",
    schema: BeforeAfterSchema,
    manifest: beforeAfterManifest as TemplateManifest,
  },
  "process-steps": {
    id: "process-steps",
    schema: ProcessStepsSchema,
    manifest: processStepsManifest as TemplateManifest,
  },
  "map-highlight": {
    id: "map-highlight",
    schema: MapHighlightSchema,
    manifest: mapHighlightManifest as TemplateManifest,
  },
  "masked-text-reveal": {
    id: "masked-text-reveal",
    schema: MaskedTextRevealSchema,
    manifest: maskedTextRevealManifest as TemplateManifest,
  },
  "cinematic-hero": {
    id: "cinematic-hero",
    schema: CinematicHeroSchema,
    manifest: cinematicHeroManifest as TemplateManifest,
  },
  "cinematic-transition": {
    id: "cinematic-transition",
    schema: CinematicTransitionSchema,
    manifest: cinematicTransitionManifest as TemplateManifest,
  },
  "dynamic-showcase": {
    id: "dynamic-showcase",
    schema: DynamicShowcaseSchema,
    manifest: dynamicShowcaseManifest as TemplateManifest,
  },
  "parallax-showcase": {
    id: "parallax-showcase",
    schema: ParallaxShowcaseSchema,
    manifest: parallaxShowcaseManifest as TemplateManifest,
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
