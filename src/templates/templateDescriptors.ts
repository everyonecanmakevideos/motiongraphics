import type { z } from "zod";
import type { TemplateManifest } from "./types";

import { HeroTextSchema } from "./hero-text/schema";
import heroTextManifest from "./hero-text/manifest.json";

import { NewsAlertSchema } from "./news-alert/schema";
import newsAlertManifest from "./news-alert/manifest.json";

import { LoadingScreenSchema } from "./loading-screen/schema";
import loadingScreenManifest from "./loading-screen/manifest.json";

import { StreamStartSchema } from "./stream-start/schema";
import streamStartManifest from "./stream-start/manifest.json";

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

export interface TemplateDescriptor {
  id: string;
  schema: z.ZodType;
  manifest: TemplateManifest;
}

/**
 * Template descriptors shared between server and client.
 *
 * Note: we intentionally DO NOT include React components here, because the
 * Next.js server registry must stay "schema/manifest only" to avoid importing
 * Remotion components into the server bundle.
 */
export const TEMPLATE_DESCRIPTORS: TemplateDescriptor[] = [
  { id: "hero-text", schema: HeroTextSchema, manifest: heroTextManifest as TemplateManifest },
  { id: "news-alert", schema: NewsAlertSchema, manifest: newsAlertManifest as TemplateManifest },
  {
    id: "loading-screen",
    schema: LoadingScreenSchema,
    manifest: loadingScreenManifest as TemplateManifest,
  },
  { id: "stream-start", schema: StreamStartSchema, manifest: streamStartManifest as TemplateManifest },
  { id: "bar-chart", schema: BarChartSchema, manifest: barChartManifest as TemplateManifest },
  { id: "pie-chart", schema: PieChartSchema, manifest: pieChartManifest as TemplateManifest },
  { id: "stat-counter", schema: StatCounterSchema, manifest: statCounterManifest as TemplateManifest },
  {
    id: "kinetic-typography",
    schema: KineticTypographySchema,
    manifest: kineticTypographyManifest as TemplateManifest,
  },
  {
    id: "icon-callout",
    schema: IconCalloutSchema,
    manifest: iconCalloutManifest as TemplateManifest,
  },
  {
    id: "comparison-layout",
    schema: ComparisonLayoutSchema,
    manifest: comparisonLayoutManifest as TemplateManifest,
  },
  {
    id: "timeline-scene",
    schema: TimelineSceneSchema,
    manifest: timelineSceneManifest as TemplateManifest,
  },
  { id: "card-layout", schema: CardLayoutSchema, manifest: cardLayoutManifest as TemplateManifest },
  {
    id: "section-title",
    schema: SectionTitleSchema,
    manifest: sectionTitleManifest as TemplateManifest,
  },
  { id: "bullet-list", schema: BulletListSchema, manifest: bulletListManifest as TemplateManifest },
  {
    id: "quote-highlight",
    schema: QuoteHighlightSchema,
    manifest: quoteHighlightManifest as TemplateManifest,
  },
  { id: "data-callout", schema: DataCalloutSchema, manifest: dataCalloutManifest as TemplateManifest },
  {
    id: "feature-highlight",
    schema: FeatureHighlightSchema,
    manifest: featureHighlightManifest as TemplateManifest,
  },
  { id: "split-screen", schema: SplitScreenSchema, manifest: splitScreenManifest as TemplateManifest },
  {
    id: "problem-solution",
    schema: ProblemSolutionSchema,
    manifest: problemSolutionManifest as TemplateManifest,
  },
  {
    id: "before-after",
    schema: BeforeAfterSchema,
    manifest: beforeAfterManifest as TemplateManifest,
  },
  {
    id: "process-steps",
    schema: ProcessStepsSchema,
    manifest: processStepsManifest as TemplateManifest,
  },
  {
    id: "map-highlight",
    schema: MapHighlightSchema,
    manifest: mapHighlightManifest as TemplateManifest,
  },
  {
    id: "masked-text-reveal",
    schema: MaskedTextRevealSchema,
    manifest: maskedTextRevealManifest as TemplateManifest,
  },
  {
    id: "cinematic-hero",
    schema: CinematicHeroSchema,
    manifest: cinematicHeroManifest as TemplateManifest,
  },
  {
    id: "cinematic-transition",
    schema: CinematicTransitionSchema,
    manifest: cinematicTransitionManifest as TemplateManifest,
  },
  {
    id: "dynamic-showcase",
    schema: DynamicShowcaseSchema,
    manifest: dynamicShowcaseManifest as TemplateManifest,
  },
  {
    id: "parallax-showcase",
    schema: ParallaxShowcaseSchema,
    manifest: parallaxShowcaseManifest as TemplateManifest,
  },
];

export function getTemplateIdsFromDescriptors(): string[] {
  return TEMPLATE_DESCRIPTORS.map((d) => d.id);
}

