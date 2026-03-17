# Architecture Transition Plan: Template-Driven Motion Graphics System

## Context

The current Shape Motion Lab pipeline generates motion graphics by having the LLM design entire scene layouts from scratch — absolute positions, sizes, spacing, animation keyframes — for every prompt. This works for simple scenes but produces layout instability, overlapping elements, and spec bloat for complex multi-element scenes.

The goal is to shift to a **template-driven architecture** where pre-engineered Remotion React components guarantee layout correctness, and the LLM's role reduces to selecting a template and filling typed parameters.

This eliminates the entire code generation step, the fragile 1830-line rule set in `scripts/prompts/`, and the `GeneratedMotion.tsx` single-file overwrite pattern.

---

## Architectural Model

### Current Pipeline (3 LLM calls + code generation)
```
User Prompt
  → promptExpander.ts (GPT-4o)        → expanded prompt
  → specGenerator.ts (GPT-4o)         → Sparse Motion Spec JSON
  → codeGenerator.ts (GPT-4o + rules) → raw JSX body
  → renderer.ts (tsc + remotion)      → Video
```

### Target Pipeline (1 LLM call, 0 code generation)
```
User Prompt
  → intentAnalyzer.ts (GPT-4o, structured output) → { templateId, params }
  → resolver.ts (deterministic validation)         → Validated TemplateParams
  → templateRenderer.ts (Remotion inputProps)       → Video
```

### System Layers

| Layer | File | Role |
|-------|------|------|
| **Intent Analysis** | `lib/pipeline/intentAnalyzer.ts` | Single LLM call: prompt → template ID + params. Uses OpenAI structured output with Zod schema |
| **Template Resolution** | `lib/templates/resolver.ts` | Deterministic: validates params against template Zod schema, applies defaults, resolves assets |
| **Template Registry** | `src/templates/index.ts` | Maps template IDs to React components + schemas + manifests |
| **Primitives** | `src/primitives/` | Shared Background component and animation preset functions used by all templates |
| **Template Renderer** | `lib/pipeline/templateRenderer.ts` | Passes inputProps to Remotion composition — no file overwriting |

---

## Template System Design

### Directory Structure
```
src/templates/
  index.ts                          # Registry: templateId → { component, schema, manifest }
  types.ts                          # Shared type definitions
  hero-text/
    HeroText.tsx                    # Remotion React component
    schema.ts                       # Zod schema for typed props
    manifest.json                   # Metadata, tags, compatible animations
  kinetic-typography/
  bar-chart/
  pie-chart/
  icon-callout/
  comparison-layout/
  timeline-scene/
  stat-counter/
  card-layout/
```

### Template Schema Concept

Each template defines a Zod schema. Example for Hero Text:

```
HeroTextSchema:
  headline: string (max 60)
  subheadline?: string (max 120)
  headlineColor: hex string
  background: BackgroundConfig (discriminated union: solid | gradient | stripe | grain)
  entranceAnimation: enum [fade-in, slide-up, scale-pop, blur-reveal, typewriter]
  duration: number (2-15, default 6)
  style: enum [centered, left-aligned, split]
  decoration: enum [none, underline, highlight-box, accent-line]
```

Key principle: The LLM fills **semantic values** (text content, color choices, animation names). The template computes **all geometry** (positions, sizes, spacing, frame timing) internally.

### Template Manifest

Each template includes a manifest declaring:
- `id`, `name`, `description`
- `tags` (for template selection matching)
- `compatibleAnimations` (constrains Zod enum per template)
- `minDuration`, `maxDuration`, `defaultDuration`

---

## Renderer Evolution

### Current Problem
`renderer.ts` overwrites `src/GeneratedMotion.tsx` per job → runs `tsc` → runs `remotion render`. Single-file bottleneck, fragile code generation.

### New Approach: Remotion inputProps

A permanent `src/TemplateRouter.tsx` component reads `inputProps` at render time and dispatches to the correct template:

```
TemplateRouter({ templateId, params }) → TEMPLATE_REGISTRY[templateId].component(params)
```

`src/Root.tsx` registers a `TemplateScene` Composition alongside the existing `GeneratedMotion` Composition (for backward compatibility during migration).

`templateRenderer.ts` calls:
```
npx remotion render src/index.ts TemplateScene --props=<temp-json-file>
```

Benefits:
- No source file overwriting
- No TypeScript compilation step (templates are pre-compiled)
- No LLM fix loop
- Deterministic by construction

---

## Template Selection System

`intentAnalyzer.ts` makes a single GPT-4o call with:
1. List of available template IDs + descriptions + tags (from manifests)
2. Simplified schema descriptions per template
3. Available animation presets and background styles
4. Available asset IDs (47 SVGs)
5. Few-shot examples mapping prompts → template selections

Output (constrained via OpenAI structured output):
```
{ templateId: string, params: object, confidence: "high"|"medium"|"low" }
```

If `confidence === "low"`, the system falls back to the legacy pipeline.

---

## Background Style System

`src/primitives/Background.tsx` — single component handling all background variants:

| Type | Implementation | Controlled Via |
|------|---------------|----------------|
| **Solid** | `backgroundColor` on `AbsoluteFill` | `color` hex |
| **Gradient** | CSS `linear-gradient` / `radial-gradient` | `from`, `to`, `direction` |
| **Stripe** | CSS `repeating-linear-gradient` | `angle`, `density` token (sparse/normal/dense) |
| **Grain** | SVG `<feTurbulence>` filter overlay | `baseColor`, `grainOpacity` |

All templates render `<Background config={props.background} />` as their first child. The LLM selects from these primitives; it never generates raw background drawing instructions.

---

## Animation Preset System

`src/primitives/animations.ts` — pure functions returning interpolated values:

| Preset | Pattern | Source |
|--------|---------|--------|
| `fadeIn` | opacity 0→1 | Used across all current specs |
| `slideUp` | y offset + opacity | typography.js lines 129-174 |
| `scalePop` | two-phase: 0→1.15→1.0 | typography.js lines 7-59 |
| `blurReveal` | blur 12→0 + opacity + scale | typography.js lines 61-127 |
| `typewriter` | chars 0→N | typography.js lines 176-232 |
| `staggerDelay` | index-based offset calculation | dataviz.js stagger patterns |
| `countUp` | numeric interpolation | advanced.js counter patterns |
| `highlightReveal` | scaleX 0→1 behind text | typography.js highlight patterns |
| `underlineDraw` | width 0→100% | typography.js underline patterns |

Each template declares compatible presets in its manifest. The Zod schema constrains animation fields to only those presets.

Templates manage timing internally with a 3-phase model:
- **Entrance** (0–20% of duration): Elements animate in
- **Main** (20–80%): Visible, continuous animations
- **Exit** (80–100%): Optional fade/slide out

---

## Fallback System

### Decision Logic
```
Intent confidence HIGH + valid params → Template path
Intent confidence MEDIUM + valid params after Zod parse → Template path
Otherwise → Legacy pipeline (existing specGenerator + codeGenerator)
```

### Future: Experimental Template Generation (Phase 3+)
- LLM generates a new template component
- Must pass TypeScript compilation + dry-run render
- Saved to `src/templates/_experimental/` (capped at 20)
- Human review required for promotion to main registry
- Least-used experimental templates evicted at cap

---

## Validation

### Template Path (replaces tsc + fix loop)
1. **Zod schema validation** — catches invalid params before render
2. **Asset ID validation** — checks against `AVAILABLE_ASSET_IDS` from `src/assets/registry.ts`
3. **Duration bounds** — clamped to template's min/max
4. **Color validation** — hex regex
5. **Text length** — per-field max from schema
6. **Render error capture** — try/catch around `execSync`, graceful failure (no retry loop needed since there's no generated code to fix)

### Legacy Path (unchanged)
Existing validation in `codeGenerator.ts` and `renderer.ts` continues as-is.

---

## Migration Strategy

### Phase 0: Infrastructure (Week 1)
- Create `src/templates/`, `src/primitives/`, `lib/templates/` directories
- Add Zod dependency
- Create `TemplateRouter.tsx` skeleton
- Add `TemplateScene` Composition to `Root.tsx` alongside existing `GeneratedMotion`
- **No behavior change** — existing pipeline untouched

### Phase 1: First Template — Hero Text (Weeks 2-3)
- Build `Background.tsx` (solid, gradient, stripe, grain)
- Build `animations.ts` (fade-in, slide-up, scale-pop, blur-reveal, typewriter)
- Build `HeroText.tsx` + schema + manifest
- Build `intentAnalyzer.ts` (single LLM call, structured output)
- Build `templateRenderer.ts` (inputProps rendering)
- Test with 20 hero-text prompts

### Phase 2: Chart Templates (Weeks 3-5)
- Build `BarChart.tsx`, `PieChart.tsx`, `DonutChart.tsx`
- Build `StatCounter.tsx`
- Port rendering logic from `scripts/prompts/dataviz.js` into deterministic components
- Expand intent analyzer with chart detection

### Phase 3: Remaining Templates (Weeks 5-7)
- `KineticTypography.tsx` (multi-line stagger animations)
- `IconCallout.tsx` (asset + text, uses existing `Asset.tsx`)
- `ComparisonLayout.tsx` (side-by-side/versus)
- `TimelineScene.tsx` (sequential milestones)
- `CardLayout.tsx` (info cards with optional icons)

### Phase 4: Pipeline Integration (Weeks 7-8)
- Modify `lib/queue.ts` `runPipeline()`: try template path first, fall back to legacy
- Add job statuses: `analyzing_intent`, `template_rendering`
- Update `lib/types.ts` with new `STEP_LABELS`
- Store `template_id` and `template_params` in database alongside `spec_json`
- Update SSE events for frontend

### Phase 5: Legacy Deprecation (Weeks 9-10)
- Track template hit rate vs. legacy fallback rate
- When template coverage > 90%, make legacy opt-in
- Existing `promptExpander.ts`, `specGenerator.ts`, `codeGenerator.ts`, `scripts/prompts/` remain for fallback

### Dual-Pipeline Coexistence
During migration, `lib/queue.ts` runs both paths:
```
runPipeline(jobId):
  intent = await analyzeIntent(prompt)
  resolution = await resolveTemplate(intent)
  if resolution.mode === "template":
    await renderTemplate(jobId, resolution.templateId, resolution.params)
  else:
    await runLegacyPipeline(jobId)  // existing pipeline unchanged
```

Serial queue constraint preserved — one render at a time regardless of path.

---

## Key Files to Modify

| File | Change |
|------|--------|
| `src/Root.tsx` | Add `TemplateScene` Composition |
| `lib/queue.ts` | Dual-path routing in `runPipeline()` |
| `lib/types.ts` | New step labels and status types |
| `lib/db.ts` | New columns: `template_id`, `template_params` |

## Key Files to Create

| File | Purpose |
|------|---------|
| `lib/pipeline/intentAnalyzer.ts` | Single LLM call for template selection + params |
| `lib/pipeline/templateRenderer.ts` | Render via Remotion inputProps |
| `lib/templates/resolver.ts` | Validate and resolve template params |
| `src/TemplateRouter.tsx` | Dispatch to template component based on inputProps |
| `src/templates/index.ts` | Template registry |
| `src/primitives/Background.tsx` | Background style primitives |
| `src/primitives/animations.ts` | Animation preset functions |
| `src/templates/*/` | Individual template directories |

## Key Files to Reuse

| File | What to Reuse |
|------|---------------|
| `scripts/prompts/typography.js` | Animation patterns → convert to `animations.ts` functions |
| `scripts/prompts/dataviz.js` | Chart rendering logic → convert to chart template components |
| `src/assets/Asset.tsx` + `registry.ts` | Use unchanged in `IconCallout` and other templates |
| `lib/pipeline/renderer.ts` | Pattern for calling `remotion render` CLI |

---

## Verification Plan

1. **Unit test each template**: Render with known params, verify no Remotion errors
2. **Schema validation tests**: Verify Zod rejects invalid params and accepts valid ones
3. **Intent analyzer accuracy**: Run 50+ prompts through intent analyzer, verify correct template selection
4. **A/B comparison**: For prompts that work with both paths, compare template output vs. legacy output visually
5. **Fallback coverage**: Verify legacy pipeline still works unchanged when template path returns `confidence: "low"`
6. **End-to-end**: POST to `/api/jobs` with template-eligible prompts, verify video output via R2 URL
