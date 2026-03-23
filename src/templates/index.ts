import type { TemplateEntry } from "./types";

import { HeroText } from "./hero-text/HeroText";
import { BarChart } from "./bar-chart/BarChart";
import { NewsAlert } from "./news-alert/NewsAlert";
import { PieChart } from "./pie-chart/PieChart";
import { StatCounter } from "./stat-counter/StatCounter";
import { KineticTypography } from "./kinetic-typography/KineticTypography";
import { IconCallout } from "./icon-callout/IconCallout";
import { ComparisonLayout } from "./comparison-layout/ComparisonLayout";
import { TimelineScene } from "./timeline-scene/TimelineScene";
import { CardLayout } from "./card-layout/CardLayout";
import { SectionTitle } from "./section-title/SectionTitle";
import { BulletList } from "./bullet-list/BulletList";
import { QuoteHighlight } from "./quote-highlight/QuoteHighlight";
import { DataCallout } from "./data-callout/DataCallout";
import { FeatureHighlight } from "./feature-highlight/FeatureHighlight";
import { SplitScreen } from "./split-screen/SplitScreen";
import { ProblemSolution } from "./problem-solution/ProblemSolution";
import { BeforeAfter } from "./before-after/BeforeAfter";
import { ProcessSteps } from "./process-steps/ProcessSteps";
import { MapHighlight } from "./map-highlight/MapHighlight";
import { MaskedTextReveal } from "./masked-text-reveal/MaskedTextReveal";
import { CinematicHero } from "./cinematic-hero/CinematicHero";
import { CinematicTransition } from "./cinematic-transition/CinematicTransition";
import { DynamicShowcase } from "./dynamic-showcase/DynamicShowcase";
import { ParallaxShowcase } from "./parallax-showcase/ParallaxShowcase";

import { LoadingScreen } from "./loading-screen/LoadingScreen";
import { StreamStart } from "./stream-start/StreamStart";

import { TEMPLATE_DESCRIPTORS, getTemplateIdsFromDescriptors } from "./templateDescriptors";

// Keep values untyped here; TemplateEntry's `component` type is intentionally very broad,
// and most template components have more specific props. We cast when building the registry.
const CLIENT_COMPONENTS: Record<string, any> = {
  "hero-text": HeroText,
  "news-alert": NewsAlert,
  "loading-screen": LoadingScreen,
  "stream-start": StreamStart,
  "bar-chart": BarChart,
  "pie-chart": PieChart,
  "stat-counter": StatCounter,
  "kinetic-typography": KineticTypography,
  "icon-callout": IconCallout,
  "comparison-layout": ComparisonLayout,
  "timeline-scene": TimelineScene,
  "card-layout": CardLayout,
  "section-title": SectionTitle,
  "bullet-list": BulletList,
  "quote-highlight": QuoteHighlight,
  "data-callout": DataCallout,
  "feature-highlight": FeatureHighlight,
  "split-screen": SplitScreen,
  "problem-solution": ProblemSolution,
  "before-after": BeforeAfter,
  "process-steps": ProcessSteps,
  "map-highlight": MapHighlight,
  "masked-text-reveal": MaskedTextReveal,
  "cinematic-hero": CinematicHero,
  "cinematic-transition": CinematicTransition,
  "dynamic-showcase": DynamicShowcase,
  "parallax-showcase": ParallaxShowcase,
};

export const TEMPLATE_REGISTRY: Record<string, TemplateEntry> = Object.fromEntries(
  TEMPLATE_DESCRIPTORS.map((d) => {
    const component = CLIENT_COMPONENTS[d.id];
    if (!component) {
      if (process.env.NODE_ENV !== "production") {
        console.error(`[templates] Missing client component for template "${d.id}"`);
      }
      // Still create an entry to avoid hard crashes; TemplateRouter will show an error card.
      return [
        d.id,
        {
          id: d.id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          component: (() => null) as any,
          schema: d.schema,
          manifest: d.manifest,
        } satisfies TemplateEntry,
      ];
    }

    return [
      d.id,
      {
        id: d.id,
        component: component as TemplateEntry["component"],
        schema: d.schema,
        manifest: d.manifest,
      } satisfies TemplateEntry,
    ];
  }),
) as Record<string, TemplateEntry>;

if (process.env.NODE_ENV !== "production") {
  const descriptorIds = getTemplateIdsFromDescriptors().sort();
  const registryIds = Object.keys(TEMPLATE_REGISTRY).sort();
  if (descriptorIds.join("|") !== registryIds.join("|")) {
    console.error("[templates] Client registry drift detected:", {
      descriptorIds,
      registryIds,
    });
  }
}

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
