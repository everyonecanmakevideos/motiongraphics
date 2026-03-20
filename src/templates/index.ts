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
import { SectionTitle } from "./section-title/SectionTitle";
import { SectionTitleSchema } from "./section-title/schema";
import sectionTitleManifest from "./section-title/manifest.json";
import { BulletList } from "./bullet-list/BulletList";
import { BulletListSchema } from "./bullet-list/schema";
import bulletListManifest from "./bullet-list/manifest.json";
import { QuoteHighlight } from "./quote-highlight/QuoteHighlight";
import { QuoteHighlightSchema } from "./quote-highlight/schema";
import quoteHighlightManifest from "./quote-highlight/manifest.json";
import { DataCallout } from "./data-callout/DataCallout";
import { DataCalloutSchema } from "./data-callout/schema";
import dataCalloutManifest from "./data-callout/manifest.json";
import { FeatureHighlight } from "./feature-highlight/FeatureHighlight";
import { FeatureHighlightSchema } from "./feature-highlight/schema";
import featureHighlightManifest from "./feature-highlight/manifest.json";
import { SplitScreen } from "./split-screen/SplitScreen";
import { SplitScreenSchema } from "./split-screen/schema";
import splitScreenManifest from "./split-screen/manifest.json";
import { ProblemSolution } from "./problem-solution/ProblemSolution";
import { ProblemSolutionSchema } from "./problem-solution/schema";
import problemSolutionManifest from "./problem-solution/manifest.json";
import { BeforeAfter } from "./before-after/BeforeAfter";
import { BeforeAfterSchema } from "./before-after/schema";
import beforeAfterManifest from "./before-after/manifest.json";
import { ProcessSteps } from "./process-steps/ProcessSteps";
import { ProcessStepsSchema } from "./process-steps/schema";
import processStepsManifest from "./process-steps/manifest.json";
import { MapHighlight } from "./map-highlight/MapHighlight";
import { MapHighlightSchema } from "./map-highlight/schema";
import mapHighlightManifest from "./map-highlight/manifest.json";
import { MaskedTextReveal } from "./masked-text-reveal/MaskedTextReveal";
import { MaskedTextRevealSchema } from "./masked-text-reveal/schema";
import maskedTextRevealManifest from "./masked-text-reveal/manifest.json";
import { CinematicHero } from "./cinematic-hero/CinematicHero";
import { CinematicHeroSchema } from "./cinematic-hero/schema";
import cinematicHeroManifest from "./cinematic-hero/manifest.json";
import { CinematicTransition } from "./cinematic-transition/CinematicTransition";
import { CinematicTransitionSchema } from "./cinematic-transition/schema";
import cinematicTransitionManifest from "./cinematic-transition/manifest.json";
import { DynamicShowcase } from "./dynamic-showcase/DynamicShowcase";
import { DynamicShowcaseSchema } from "./dynamic-showcase/schema";
import dynamicShowcaseManifest from "./dynamic-showcase/manifest.json";
import { ParallaxShowcase } from "./parallax-showcase/ParallaxShowcase";
import { ParallaxShowcaseSchema } from "./parallax-showcase/schema";
import parallaxShowcaseManifest from "./parallax-showcase/manifest.json";

import { NewsAlert } from "./news-alert/NewsAlert";
import { NewsAlertSchema } from "./news-alert/schema";
import newsAlertManifest from "./news-alert/manifest.json";

import { LoadingScreen } from "./loading-screen/LoadingScreen";
import { LoadingScreenSchema } from "./loading-screen/schema";
import loadingScreenManifest from "./loading-screen/manifest.json";

import { StreamStart } from "./stream-start/StreamStart";
import { StreamStartSchema } from "./stream-start/schema";
import streamStartManifest from "./stream-start/manifest.json";

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
  "section-title": {
    id: "section-title",
    component: SectionTitle as TemplateEntry["component"],
    schema: SectionTitleSchema,
    manifest: sectionTitleManifest as TemplateEntry["manifest"],
  },
  "bullet-list": {
    id: "bullet-list",
    component: BulletList as TemplateEntry["component"],
    schema: BulletListSchema,
    manifest: bulletListManifest as TemplateEntry["manifest"],
  },
  "quote-highlight": {
    id: "quote-highlight",
    component: QuoteHighlight as TemplateEntry["component"],
    schema: QuoteHighlightSchema,
    manifest: quoteHighlightManifest as TemplateEntry["manifest"],
  },
  "data-callout": {
    id: "data-callout",
    component: DataCallout as TemplateEntry["component"],
    schema: DataCalloutSchema,
    manifest: dataCalloutManifest as TemplateEntry["manifest"],
  },
  "feature-highlight": {
    id: "feature-highlight",
    component: FeatureHighlight as TemplateEntry["component"],
    schema: FeatureHighlightSchema,
    manifest: featureHighlightManifest as TemplateEntry["manifest"],
  },
  "split-screen": {
    id: "split-screen",
    component: SplitScreen as TemplateEntry["component"],
    schema: SplitScreenSchema,
    manifest: splitScreenManifest as TemplateEntry["manifest"],
  },
  "problem-solution": {
    id: "problem-solution",
    component: ProblemSolution as TemplateEntry["component"],
    schema: ProblemSolutionSchema,
    manifest: problemSolutionManifest as TemplateEntry["manifest"],
  },
  "before-after": {
    id: "before-after",
    component: BeforeAfter as TemplateEntry["component"],
    schema: BeforeAfterSchema,
    manifest: beforeAfterManifest as TemplateEntry["manifest"],
  },
  "process-steps": {
    id: "process-steps",
    component: ProcessSteps as TemplateEntry["component"],
    schema: ProcessStepsSchema,
    manifest: processStepsManifest as TemplateEntry["manifest"],
  },
  "map-highlight": {
    id: "map-highlight",
    component: MapHighlight as TemplateEntry["component"],
    schema: MapHighlightSchema,
    manifest: mapHighlightManifest as TemplateEntry["manifest"],
  },
  "masked-text-reveal": {
    id: "masked-text-reveal",
    component: MaskedTextReveal as TemplateEntry["component"],
    schema: MaskedTextRevealSchema,
    manifest: maskedTextRevealManifest as TemplateEntry["manifest"],
  },
  "cinematic-hero": {
    id: "cinematic-hero",
    component: CinematicHero as TemplateEntry["component"],
    schema: CinematicHeroSchema,
    manifest: cinematicHeroManifest as TemplateEntry["manifest"],
  },
  "cinematic-transition": {
    id: "cinematic-transition",
    component: CinematicTransition as TemplateEntry["component"],
    schema: CinematicTransitionSchema,
    manifest: cinematicTransitionManifest as TemplateEntry["manifest"],
  },
  "dynamic-showcase": {
    id: "dynamic-showcase",
    component: DynamicShowcase as TemplateEntry["component"],
    schema: DynamicShowcaseSchema,
    manifest: dynamicShowcaseManifest as TemplateEntry["manifest"],
  },
  "parallax-showcase": {
    id: "parallax-showcase",
    component: ParallaxShowcase as TemplateEntry["component"],
    schema: ParallaxShowcaseSchema,
    manifest: parallaxShowcaseManifest as TemplateEntry["manifest"],
  },
  "news-alert": {
    id: "news-alert",
    component: NewsAlert as TemplateEntry["component"],
    schema: NewsAlertSchema,
    manifest: newsAlertManifest as TemplateEntry["manifest"],
  },
  "loading-screen": {
    id: "loading-screen",
    component: LoadingScreen as TemplateEntry["component"],
    schema: LoadingScreenSchema,
    manifest: loadingScreenManifest as TemplateEntry["manifest"],
  },
  "stream-start": {
    id: "stream-start",
    component: StreamStart as TemplateEntry["component"],
    schema: StreamStartSchema,
    manifest: streamStartManifest as TemplateEntry["manifest"],
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
