# Creative Enhancement Fields — Full Implementation Plan

## Context

The creative enhancer (`lib/templates/creativeEnhancer.ts`) currently upgrades aesthetic params (colors, backgrounds, animations) using mood-based LLM prompts. The goal is to add **4 new structured design fields** — `stylePreset`, `typography`, `motionStyle`, `effects` — across all 25 templates, so the creative layer can produce richer, more production-ready motion specs.

This requires changes at every layer: Zod schemas, Remotion React components, shared utilities, and the creative enhancer LLM prompt.

---

## Phase 1: Schema Foundation

### 1a. Add shared Zod schemas to `src/templates/types.ts`

```ts
export const StylePresetSchema = z.enum(["modern-clean", "bold-startup", "neon-tech", "minimal-luxury"]);
export type StylePreset = z.infer<typeof StylePresetSchema>;

export const TypographySchema = z.object({
  fontFamily: z.enum(["inter", "clash-display", "space-grotesk"]),
  weight: z.enum(["regular", "medium", "bold", "black"]),
  letterSpacing: z.enum(["tight", "normal", "wide"]),
  lineHeight: z.enum(["compact", "normal", "relaxed"]),
});
export type Typography = z.infer<typeof TypographySchema>;

export const MotionStyleSchema = z.object({
  easing: z.enum(["smooth", "snappy", "elastic"]),
  speed: z.enum(["slow", "medium", "fast"]),
  stagger: z.boolean(),
  microMotion: z.boolean(),
});
export type MotionStyle = z.infer<typeof MotionStyleSchema>;

export const EffectsSchema = z.object({
  shadow: z.enum(["none", "soft", "strong"]),
  glow: z.enum(["none", "subtle", "neon"]),
  blur: z.enum(["none", "subtle", "transition"]),
});
export type Effects = z.infer<typeof EffectsSchema>;
```

### 1b. Add 4 optional fields to all 25 template schemas

Each `schema.ts` gets:
```ts
stylePreset: StylePresetSchema.optional(),
typography: TypographySchema.optional(),
motionStyle: MotionStyleSchema.optional(),
effects: EffectsSchema.optional(),
```

**Files** (all `src/templates/{id}/schema.ts`):
hero-text, bar-chart, pie-chart, stat-counter, kinetic-typography, icon-callout, comparison-layout, timeline-scene, card-layout, section-title, bullet-list, quote-highlight, data-callout, feature-highlight, split-screen, problem-solution, before-after, process-steps, map-highlight, masked-text-reveal, cinematic-hero, cinematic-transition, dynamic-showcase, parallax-showcase

All fields are `.optional()` so existing specs remain valid.

### 1c. Verify
Run `npx tsc --noEmit` to confirm no type errors.

---

## Phase 2: Font Infrastructure

### 2a. Install `@remotion/google-fonts@4.0.431`

### 2b. Create `src/primitives/fonts.ts`

- Load Inter and Space Grotesk via `@remotion/google-fonts`
- For Clash Display: use Plus Jakarta Sans from Google Fonts as substitute (avoids self-hosting complexity). Map `"clash-display"` → `"Plus Jakarta Sans"` internally.
- Export `ensureFontsLoaded()` function

### 2c. Call `ensureFontsLoaded()` in the root Remotion composition entry point

---

## Phase 3: Shared Utilities (new files in `src/primitives/`)

### 3a. `src/primitives/useStylePreset.ts`
Maps `stylePreset` → default values for typography/motionStyle/effects when those fields are not explicitly set.

| Preset | Font | Weight | Spacing | Easing | Speed | Shadow | Glow |
|--------|------|--------|---------|--------|-------|--------|------|
| modern-clean | inter | medium | normal | smooth | medium | soft | none |
| bold-startup | space-grotesk | bold | wide | snappy | fast | strong | subtle |
| neon-tech | space-grotesk | bold | wide | elastic | fast | none | neon |
| minimal-luxury | inter | regular | wide | smooth | slow | soft | none |

### 3b. `src/primitives/useTypography.ts`
Returns `React.CSSProperties` from a `Typography` object:
- fontFamily: `"inter"` → `"'Inter', sans-serif"`, `"clash-display"` → `"'Plus Jakarta Sans', sans-serif"`, `"space-grotesk"` → `"'Space Grotesk', sans-serif"`
- weight: regular→400, medium→500, bold→700, black→900
- letterSpacing: tight→"-0.03em", normal→"0em", wide→"0.05em"
- lineHeight: compact→1.1, normal→1.4, relaxed→1.7

Returns `{}` when undefined (preserves current hardcoded styles as fallback).

### 3c. `src/primitives/useMotionStyle.ts`
Returns a `MotionConfig` object:
- speed: slow→1.4x duration, medium→1.0x, fast→0.7x
- easing: smooth→`Easing.bezier(0.4,0,0.2,1)`, snappy→`Easing.bezier(0.25,0.1,0.25,1)`, elastic→`Easing.bezier(0.68,-0.55,0.265,1.55)`
- stagger/microMotion pass through as booleans

Add to `src/primitives/animations.ts`:
- `EASING_MAP` constant with the 3 easing curves
- `microFloat(frame, amplitude=2)` → `{ y: Math.sin(frame * 0.1) * amplitude }` (deterministic)

### 3d. `src/primitives/useEffects.ts`
Returns CSS properties from an `Effects` object:
- shadow: none→"none", soft→"0 4px 24px rgba(0,0,0,0.3)", strong→"0 8px 40px rgba(0,0,0,0.6)"
- glow: none→no filter, subtle→`drop-shadow(0 0 8px ${accentColor}40)`, neon→multiple layered drop-shadows
- blur: none/subtle/transition → flags for component-level blur application

---

## Phase 4: Template Component Integration

### Pattern (using hero-text as reference):

1. Import utilities: `resolveStylePreset`, `resolveTypography`, `resolveMotionStyle`, `resolveEffects`, `ensureFontsLoaded`
2. At top of component, resolve the style preset defaults, then merge with explicit overrides
3. Apply typography styles to text `<span>` elements (replacing hardcoded `"Arial, Helvetica, sans-serif"`)
4. Apply motion config to phase timing (`durationMultiplier`) and easing
5. Apply effects (boxShadow, glow filter) to content container
6. Apply microMotion during main phase if enabled

### Implementation order:
1. **hero-text** — reference implementation, test thoroughly
2. **kinetic-typography, section-title, quote-highlight** — text-heavy, similar pattern
3. **cinematic-hero, cinematic-transition** — cinematic templates benefit most from effects
4. **bar-chart, pie-chart, stat-counter, data-callout** — data templates
5. **Remaining 14 templates** — apply the established pattern

### Key changes per component:
- Replace `fontFamily: "Arial, Helvetica, sans-serif"` with resolved typography
- Replace hardcoded `fontWeight` with typography weight (when typography is set)
- Apply `durationMultiplier` to entrance/exit phase frame calculations
- Add `boxShadow` and `filter` from effects to content wrapper
- Add `microFloat` transform during main phase when enabled
- Add easing option to `interpolate` calls via `Easing` from remotion

---

## Phase 5: Creative Enhancer Updates

### 5a. File: `lib/templates/creativeEnhancer.ts`

Add `SHARED_CREATIVE_FIELDS` constant:
```ts
const SHARED_CREATIVE_FIELDS = {
  stylePreset: "modern-clean|bold-startup|neon-tech|minimal-luxury",
  typography: "{ fontFamily: inter|clash-display|space-grotesk, weight: regular|medium|bold|black, letterSpacing: tight|normal|wide, lineHeight: compact|normal|relaxed }",
  motionStyle: "{ easing: smooth|snappy|elastic, speed: slow|medium|fast, stagger: boolean, microMotion: boolean }",
  effects: "{ shadow: none|soft|strong, glow: none|subtle|neon, blur: none|subtle|transition }",
};
```

Spread into every `ENHANCEABLE_FIELDS` entry.

### 5b. Update `CREATIVE_SYSTEM_PROMPT`

Add rules 7-10 covering:
- When to set stylePreset (mood-based shorthand)
- Typography selection logic (font + weight + spacing based on content type)
- Motion style rules (easing/speed based on mood)
- Effects guidelines (shadow/glow/blur usage)

### 5c. Update `mergeAndSanitize`

Handle object-type fields (typography, motionStyle, effects) — shallow replace (not deep merge) since they're flat objects.

### 5d. Do NOT add these fields to `CONTENT_FIELDS` (they are aesthetic)

---

## Phase 6: Verification

1. **Type check**: `npx tsc --noEmit` passes
2. **Backward compat**: Existing spec JSON files (without new fields) still validate
3. **Remotion studio**: `npm run dev:remotion` — render hero-text with and without new fields
4. **Pipeline test**: Run a prompt through the full pipeline, verify creative enhancer outputs new fields
5. **Visual check**: Compare renders with/without new fields to ensure quality improvement

---

## Critical Files Summary

| File | Change |
|------|--------|
| `src/templates/types.ts` | Add 4 new Zod schemas + types |
| `src/templates/*/schema.ts` (×25) | Add 4 optional fields |
| `src/primitives/fonts.ts` | NEW — font loading |
| `src/primitives/useStylePreset.ts` | NEW — preset → defaults |
| `src/primitives/useTypography.ts` | NEW — typography → CSS |
| `src/primitives/useMotionStyle.ts` | NEW — motion config |
| `src/primitives/useEffects.ts` | NEW — effects → CSS |
| `src/primitives/animations.ts` | Add EASING_MAP, microFloat |
| `src/templates/*/Component.tsx` (×25) | Consume new fields |
| `lib/templates/creativeEnhancer.ts` | Prompt + fields + merge logic |
| `package.json` | Add @remotion/google-fonts |
