# Progress So Far (Shareable for Intern)

## Goal
Build an AI-driven motion graphics designer:
`user prompt -> normalized style tokens -> deterministic mapping -> Remotion output ready for preview/render`.

## What’s been implemented

### 1) Reusable visual primitives + extended vocab
- Expanded **BackgroundSchema** with additional background types (e.g. dots, grid, radial glow).
- Expanded **EffectsSchema** to support more effects (scanlines, vignette, chromatic aberration, shake).
- Expanded **TransitionType** and implemented new transition presets for multi-scene sequences.

### 2) creativeEnhancer improvements (deterministic mapping + domain overrides)
- `lib/templates/creativeEnhancer.ts`
  - Enhanced style-token mapping into constrained template enums (Zod-validated).
  - Added deterministic **domain overrides** (light/dark role palettes + content-domain heuristics).
  - Creator/lifestyle/vlog prompts get editorial typography + readable light backgrounds.
  - Minimal UI process flows get neutral connectors and restrained effects.

### 3) `process-steps` upgraded into a progress-tracker (timeline) layout
To support prompts that are specifically **status timelines / progress trackers**:
- Updated `process-steps/schema.ts` to add `layoutMode: "cards" | "tracker"`.
- Updated `process-steps/ProcessSteps.tsx`:
  - New `layoutMode="tracker"` renders a **horizontal timeline**:
    - base line (grey)
    - active progress line (orange sweep over time)
    - numbered nodes + step labels
    - active/completed/upcoming state clarity
  - Active step is derived from animation time (not static layout).

### 4) Progress-tracker domain/pattern overrides
- `creativeEnhancer` now detects order-delivery/progress-tracker phrasing and forces:
  - `layoutMode="tracker"`
  - warm accent for delivery/progress
  - neutral inactive states
  - constrained effects (keeps it clean, avoids repeated “bad combinations”)

### 5) LLM-judge for style archetypes (all templates)
- Added a second-pass **style judge** inside `creativeEnhancer`:
  - Classifies prompt into an archetype (personal story, product progress, tech terminal, news alert, promo ad, minimal UI, neon cyberpunk, default).
  - Deterministically maps archetype to constrained template fields:
    - typography (font family/weight/italic)
    - palette roles (primary/secondary/accent)
    - background tone
    - polishIntensity + postFx defaults
  - This reduces repeated “wrong vibe” outputs and makes styling more theme-aware.

### 6) Preview player improvements (autoplay-friendly)
- `components/RemotionTemplatePreview.tsx`
  - Preview starts **muted by default** to satisfy browser autoplay rules.
  - Ensures play state is synced on preview load so you don’t have to drag the timeline.

## Files most relevant for intern work
- `lib/templates/creativeEnhancer.ts`
- `lib/pipeline/intentAnalyzer.ts`
- `src/templates/process-steps/schema.ts`
- `src/templates/process-steps/ProcessSteps.tsx`
- `components/RemotionTemplatePreview.tsx`
- `src/primitives/Background.tsx`
- `src/primitives/PostFxLayer.tsx`

## Open problems / Next upgrades (Suggested)
- Make the style judge mapping even more consistent to your benchmarks (especially typography hierarchy + spacing) per template/pattern.
- Expand progress-tracker node design with icons per state (if schema supports it or add optional iconId).
- Add an eval harness to automatically score tracker correctness + typography hierarchy to prevent regressions.

