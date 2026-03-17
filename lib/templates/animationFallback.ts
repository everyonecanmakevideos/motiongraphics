import { SERVER_TEMPLATE_REGISTRY } from "../../src/templates/registry-server";

/**
 * Maps common out-of-vocabulary animation terms to the closest standard animation.
 * Each key is a keyword that might appear in LLM output; the value is the standard
 * animation it should map to (if available in the target template).
 */
const SIMILARITY_MAP: Record<string, string[]> = {
  // → scale-pop candidates
  explode: ["scale-pop"],
  burst: ["scale-pop"],
  fireworks: ["scale-pop"],
  shatter: ["scale-pop"],
  bounce: ["scale-pop"],
  spring: ["scale-pop"],
  elastic: ["scale-pop"],
  jump: ["scale-pop"],
  zoom: ["scale-pop"],
  magnify: ["scale-pop"],
  enlarge: ["scale-pop"],
  pop: ["scale-pop"],
  pulse: ["scale-pop"],

  // → fade-in candidates
  dissolve: ["fade-in"],
  appear: ["fade-in"],
  materialize: ["fade-in"],
  emerge: ["fade-in"],
  manifest: ["fade-in"],
  unveil: ["fade-in"],

  // → slide-up candidates
  wipe: ["slide-up", "slide-in"],
  sweep: ["slide-up", "slide-in"],
  reveal: ["slide-up", "fade-in"],
  curtain: ["slide-up"],
  fly: ["slide-up"],
  float: ["slide-up"],
  rise: ["slide-up"],
  ascend: ["slide-up"],
  lift: ["slide-up"],

  // → typewriter candidates
  type: ["typewriter"],
  typing: ["typewriter"],
  cursor: ["typewriter"],
  terminal: ["typewriter"],

  // → spin candidates (pie-chart specific)
  rotate: ["spin", "grow"],
  spin: ["spin", "grow"],
  swirl: ["spin", "grow"],
  wheel: ["spin", "grow"],

  // → progressive candidates (timeline specific)
  draw: ["progressive", "fade-in"],
  sketch: ["progressive", "fade-in"],
  trace: ["progressive", "fade-in"],
  build: ["progressive", "grow"],

  // → count-up candidates (stat-counter specific)
  count: ["count-up", "fade-in"],
  increment: ["count-up", "fade-in"],
  tick: ["count-up", "fade-in"],
  odometer: ["count-up", "fade-in"],

  // → grow candidates (bar-chart specific)
  grow: ["grow", "slide-up"],
  expand: ["grow", "scale-pop"],
  stretch: ["grow", "slide-up"],
  fill: ["grow", "fade-in"],

  // → blur-reveal candidates
  blur: ["blur-reveal", "fade-in"],
  focus: ["blur-reveal", "fade-in"],
  sharpen: ["blur-reveal", "fade-in"],
  clarity: ["blur-reveal", "fade-in"],

  // → slide-in candidates (comparison specific)
  "slide-in": ["slide-in", "slide-up"],
  converge: ["slide-in", "slide-up"],
  merge: ["slide-in", "fade-in"],

  // → progressive candidates (process/map)
  stagger: ["progressive", "fade-in"],
  sequential: ["progressive", "fade-in"],
  step: ["progressive", "fade-in"],
  flow: ["progressive", "slide-up"],

  // → map/location candidates
  marker: ["progressive", "scale-pop"],
  pin: ["progressive", "scale-pop"],
  locate: ["progressive", "fade-in"],
  place: ["progressive", "fade-in"],

  // → wipe candidates (before-after)
  "wipe-reveal": ["fade-in", "slide-up"],
  transition: ["fade-in", "slide-up"],
  transform: ["fade-in", "scale-pop"],
};

/**
 * Normalizes an animation value to one that's compatible with the given template.
 *
 * 1. If already compatible → return as-is
 * 2. Look up similarity map → find first compatible match
 * 3. Fallback → use template's first (signature) animation
 */
export function normalizeAnimation(
  templateId: string,
  requestedAnimation: string
): { animation: string; wasNormalized: boolean } {
  const entry = SERVER_TEMPLATE_REGISTRY[templateId];
  if (!entry) {
    return { animation: requestedAnimation, wasNormalized: false };
  }

  const compatible = entry.manifest.compatibleAnimations as string[];

  // Already valid
  if (compatible.includes(requestedAnimation)) {
    return { animation: requestedAnimation, wasNormalized: false };
  }

  // Check similarity map — try each candidate in order
  const normalizedKey = requestedAnimation.toLowerCase().replace(/[-_\s]/g, "");
  for (const [keyword, candidates] of Object.entries(SIMILARITY_MAP)) {
    if (normalizedKey.includes(keyword) || keyword.includes(normalizedKey)) {
      for (const candidate of candidates) {
        if (compatible.includes(candidate)) {
          return { animation: candidate, wasNormalized: true };
        }
      }
    }
  }

  // Fallback: use the template's signature animation (first in list)
  return { animation: compatible[0], wasNormalized: true };
}
