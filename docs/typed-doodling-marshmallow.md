# 10x Motion Graphics System Overhaul: From Mechanical to Cinematic

## Context

The current system produces technically correct but visually boring, mechanical output. Every video feels like it came from the same template factory: text fades in on a flat dark gradient, sits perfectly still for 3 seconds, fades out. Users want "any user can create very good motion graphic animations with just a simple prompt" — but the output lacks the craft, rhythm, and visual richness of professional motion design.

**Previous fix (already implemented):** Diversified LLM color/background choices, routed medium confidence to legacy pipeline. This helped variety but didn't address the structural reasons output feels lifeless.

**This plan addresses the deeper WHY:** The animation engine itself is shallow. Elements enter, freeze, and exit. Backgrounds are static. Timing is robotic. There's no visual depth, no choreography, no secondary motion, no physical feel. These are code-level problems, not prompt-tuning problems.

---

## Root Cause Analysis: Why Output Feels Mechanical

| Problem | Root Cause | Where |
|---------|-----------|-------|
| Robotic timing | Fixed 20/60/20 phase split for ALL moods | `animations.ts:phaseFrames()` |
| Elements look frozen | Zero motion during main phase (60% of video) | All template TSX files |
| Flat backgrounds | Static CSS, no frame-based animation | `Background.tsx` |
| No visual depth | No decorative elements (only CinematicHero has accents) | Template TSX files |
| Everything enters at once | No choreographed sequencing, same timing for all elements | Template TSX files |
| Only 4 visual identities | 4 style presets for 24 templates | `useStylePreset.ts` |
| Animations lack weight | Linear A→B motion, no anticipation/overshoot/settle | `animations.ts` |

---

## The 7 Changes

### Change 1: Adaptive Phase Timing (Replace Fixed 20/60/20)

**Why:** A "Flash Sale" and a "Cinematic Hero" should not have the same rhythm. Currently they do. This makes every video feel cookie-cutter.

**Files:**
- `src/primitives/animations.ts` — modify `phaseFrames()` to accept a pacing profile
- `src/templates/types.ts` — add `PacingProfileSchema`
- `lib/templates/creativeEnhancer.ts` — add pacing selection to LLM prompt

**Implementation:**
```typescript
// In types.ts — add new schema
export const PacingProfileSchema = z.enum([
  "dramatic",    // 35% entrance, 40% main, 25% exit — slow reveals
  "energetic",   // 12% entrance, 63% main, 25% exit — fast punchy
  "elegant",     // 25% entrance, 55% exit, 20% exit — leisurely
  "standard",    // 20% entrance, 60% main, 20% exit — current default
  "suspense",    // 40% entrance, 35% main, 25% exit — long build
]);

// In animations.ts — update phaseFrames()
const PACING_MAP = {
  dramatic:  { entrance: 0.35, main: 0.40, exit: 0.25 },
  energetic: { entrance: 0.12, main: 0.63, exit: 0.25 },
  elegant:   { entrance: 0.25, main: 0.55, exit: 0.20 },
  standard:  { entrance: 0.20, main: 0.60, exit: 0.20 },
  suspense:  { entrance: 0.40, main: 0.35, exit: 0.25 },
};

export function phaseFrames(durationSec: number, profile: PacingProfile = "standard") {
  const p = PACING_MAP[profile];
  const total = secToFrame(durationSec);
  const entranceEnd = Math.round(total * p.entrance);
  const exitStart = Math.round(total * (p.entrance + p.main));
  return { entrance: { startFrame: 0, endFrame: entranceEnd }, main: { startFrame: entranceEnd, endFrame: exitStart }, exit: { startFrame: exitStart, endFrame: total }, total };
}
```

- Add optional `pacingProfile` field to each template's Zod schema
- Creative enhancer maps mood → pacing (e.g., cinematic → dramatic, sale → energetic, luxury → elegant)
- Each template passes its `pacingProfile` prop to `phaseFrames()`

**Impact:** Dramatic videos build slowly; energetic videos snap. Same system, completely different emotional rhythm.

---

### Change 2: Secondary Motion Layer (Elements Stay Alive)

**Why:** This is the BIGGEST gap. After entrance, every element sits perfectly still for 60% of the video. Professional motion always has subtle continuous motion: breathing, floating, drifting. The `microFloat` primitive exists but only 2 templates use it.

**Files:**
- `src/primitives/animations.ts` — add new secondary motion functions
- `src/templates/types.ts` — add `SecondaryMotionSchema`
- New file: `src/primitives/useSecondaryMotion.ts` — resolver for secondary motion
- Template TSX files (hero-text, section-title, quote-highlight, kinetic-typography, stat-counter, data-callout, bullet-list, icon-callout) — apply during main phase

**Implementation:**
```typescript
// In animations.ts — new deterministic secondary motion primitives

/** Scale breathing: oscillates 1.0 → 1+amplitude → 1.0 using segmented interpolation */
export function breathe(frame: number, range: FrameRange, amplitude: number = 0.015, period: number = 90): { scale: number } {
  const elapsed = Math.max(0, frame - range.startFrame);
  const halfPeriod = period / 2;
  const posInCycle = elapsed % period;
  const scale = posInCycle < halfPeriod
    ? interpolate(posInCycle, [0, halfPeriod], [1, 1 + amplitude], CLAMP)
    : interpolate(posInCycle, [halfPeriod, period], [1 + amplitude, 1], CLAMP);
  return { scale };
}

/** Gentle horizontal drift */
export function driftX(frame: number, range: FrameRange, amplitude: number = 3, period: number = 100): { x: number } {
  const elapsed = Math.max(0, frame - range.startFrame);
  const halfPeriod = period / 2;
  const posInCycle = elapsed % period;
  const x = posInCycle < halfPeriod
    ? interpolate(posInCycle, [0, halfPeriod], [0, amplitude], CLAMP)
    : interpolate(posInCycle, [halfPeriod, period], [amplitude, 0], CLAMP);
  return { x: x - amplitude / 2 };
}

/** Gentle rotation oscillation */
export function gentleRotate(frame: number, range: FrameRange, maxDeg: number = 1.5, period: number = 120): { rotation: number } {
  // Same segmented interpolation pattern
}
```

```typescript
// In types.ts
export const SecondaryMotionSchema = z.object({
  type: z.enum(["breathe", "float", "drift", "rotate", "none"]).default("none"),
  intensity: z.enum(["subtle", "medium", "strong"]).default("subtle"),
});
```

```typescript
// In useSecondaryMotion.ts
const INTENSITY_MAP = {
  subtle:  { amplitude: 0.01,  period: 120 },
  medium:  { amplitude: 0.02,  period: 90  },
  strong:  { amplitude: 0.035, period: 70  },
};
export function resolveSecondaryMotion(type, intensity, frame, range) { ... }
```

- In templates, apply secondary motion to the content container during main phase
- Creative enhancer maps mood: elegant→breathe, cinematic→drift, playful→float, tech→none

**Impact:** Every element subtly pulses with life. Text breathes, backgrounds drift. The frame never looks frozen.

---

### Change 3: Animated Backgrounds (Backgrounds Get Motion)

**Why:** Currently `Background.tsx` renders static CSS. A solid color, a gradient, some stripes — none move. Professional motion always has ambient background motion: slow gradient shifts, moving grain, drifting patterns.

**Files:**
- `src/primitives/Background.tsx` — add `frame` prop, animate all background types
- `src/templates/types.ts` — extend `BackgroundConfig` with optional `bgAnimation` field

**Implementation:**
- `Background` accepts optional `frame: number` prop
- **Gradient**: Animate angle with `Math.sin(frame * 0.015) * 10` for slow swaying. For radial, shift center point slightly.
- **Grain**: Vary SVG `seed` based on `Math.floor(frame / 3)` — grain "flickers" at film cadence
- **Stripe**: `backgroundPosition: \`${frame * 0.3}px 0\`` for slow stripe crawl
- **Solid**: Optional pulsing radial vignette overlay (opacity oscillates 0.03-0.12)
- Add `bgAnimation?: "slow-drift" | "pulse" | "none"` to `BackgroundConfig`
- Default: `"slow-drift"` for gradient/grain, `"none"` for solid

**Impact:** Backgrounds feel like living environments, not flat wallpaper. Even a simple gradient now breathes.

---

### Change 4: Decorative Elements Layer (Visual Depth)

**Why:** 23 of 24 templates render text on a bare background. Only CinematicHero has accent shapes. Professional motion uses decorative elements — geometric shapes, light streaks, corner accents — to create depth and fill visual space.

**Files:**
- New file: `src/primitives/DecorativeLayer.tsx` — shared decorative renderer
- `src/templates/types.ts` — add `DecorativeThemeSchema`
- Templates (hero-text, section-title, quote-highlight, kinetic-typography, stat-counter, bullet-list, data-callout) — add `<DecorativeLayer />` between Background and content

**Implementation:**
- Extract and generalize accent shape logic from CinematicHero.tsx (lines 33-135)
- Define 5 deterministic themes:
  - `"geometric"`: 3-5 hollow circles + rotated squares + thin lines at varying depths
  - `"minimal-dots"`: 6-8 small dots at varying opacities, scattered
  - `"light-streaks"`: 2-3 diagonal gradient lines that sweep slowly
  - `"corner-accents"`: L-shaped brackets in two opposite corners
  - `"none"`: no decorative elements
- Each element gets: depth value (for parallaxLayer), entrance animation (fade in first 25%), secondary motion (gentle drift/rotate)
- Component API: `<DecorativeLayer theme="geometric" accentColor="#D4AF37" frame={frame} totalFrames={totalFrames} />`
- Add optional `decorativeTheme` to template schemas
- Creative enhancer selects theme: luxury→geometric, minimal→minimal-dots, cinematic→light-streaks

**Impact:** Every template gains depth and visual richness. Hero-text with floating geometric shapes behind it feels layered and crafted, not flat.

---

### Change 5: Choreographed Entrance Sequencing (Visual Hierarchy)

**Why:** Currently all elements enter with the same timing. In professional motion, elements arrive in a deliberate sequence: accent line first, then headline, then subtitle. This creates visual hierarchy and guides the eye.

**Files:**
- `src/primitives/animations.ts` — add `choreograph()` utility
- Template TSX files — replace ad-hoc timing with choreographed sequences

**Implementation:**
```typescript
interface ChoreographyStep {
  id: string;
  startOffset: number;  // frames after sequence start
  duration: number;     // frames for this element's entrance
}

export function choreograph(
  totalEntranceFrames: number,
  steps: ChoreographyStep[]
): Map<string, FrameRange> {
  const result = new Map<string, FrameRange>();
  for (const step of steps) {
    result.set(step.id, {
      startFrame: step.startOffset,
      endFrame: step.startOffset + step.duration,
    });
  }
  return result;
}
```

In templates like HeroText, replace current timing:
```typescript
// Before: everything enters in the same window
const entranceEnd = Math.round(totalFrames * 0.25);

// After: choreographed sequence
const seq = choreograph(entranceFrames, [
  { id: "decoration", startOffset: 0,  duration: 8  },
  { id: "headline",   startOffset: 4,  duration: 18 },
  { id: "subtitle",   startOffset: 14, duration: 12 },
]);
```

Define 3 choreography presets that creative enhancer can select:
- `"cascading"`: each element starts 40% into previous animation
- `"build-up"`: decorative first, supporting text next, hero element last
- `"simultaneous"`: all start within 200ms window, different easings

**Impact:** Elements arrive in deliberate sequence. Eye is guided from accent to headline to subtitle. Animations overlap naturally.

---

### Change 6: Expanded Style Identity System (4 → 12 Presets)

**Why:** 24 templates × 4 presets = everything looks like it came from the same 4 mood boards. Expanding to 12+ presets with distinct personality gives much wider visual vocabulary.

**Files:**
- `src/primitives/useStylePreset.ts` — add 8 new presets
- `src/primitives/useMotionStyle.ts` — add new easing curves
- `src/templates/types.ts` — extend `StylePresetSchema` enum
- `lib/templates/creativeEnhancer.ts` — map moods to expanded presets

**Implementation — New presets:**
| Preset | Font | Weight | Easing | Speed | Effects | Use For |
|--------|------|--------|--------|-------|---------|---------|
| `cinematic-noir` | Inter | regular | smooth | slow | strong shadow, blur | Movie/dramatic |
| `retro-arcade` | Space Grotesk | black | snappy | fast | neon glow | Gaming/retro |
| `editorial` | Clash Display | medium | smooth | slow | soft shadow | News/editorial |
| `brutalist` | Space Grotesk | black | snappy | fast | strong shadow | Bold statements |
| `glass-morphism` | Inter | medium | smooth | medium | subtle glow, blur | Modern/UI |
| `gradient-dream` | Clash Display | bold | elastic | medium | subtle glow | Creative/art |
| `tech-terminal` | Space Grotesk | bold | snappy | fast | neon glow, blur | Tech/hacker |
| `warm-organic` | Inter | regular | smooth | slow | soft shadow | Wellness/nature |

- Add 2 new easing curves: `"dramatic"` (0.7, 0, 0.3, 1) and `"playful"` (0.34, 1.56, 0.64, 1)
- Creative enhancer maps moods to expanded palette

**Impact:** A cinematic trailer and a tech product launch produce fundamentally different visual DNA.

---

### Change 7: Anticipation & Follow-Through on Entrance Animations

**Why:** Current animations are linear A→B. `slideUp` goes from 40px to 0px — done. Professional animation uses anticipation (slight opposite movement first) and overshoot (past target, then settle). These are Disney's principles #6 and #7. They make motion feel physical.

**Files:**
- `src/primitives/animations.ts` — upgrade slideUp, slideDown, slideLeft, slideRight, scalePop, fadeIn

**Implementation:**
```typescript
// slideUp — 3-phase with anticipation + overshoot
export function slideUp(frame: number, range: FrameRange, offsetPx: number = 40): { y: number; opacity: number } {
  const antic = range.startFrame + Math.round((range.endFrame - range.startFrame) * 0.08);
  const main = range.startFrame + Math.round((range.endFrame - range.startFrame) * 0.7);

  const y = interpolate(
    frame,
    [range.startFrame, antic, main, range.endFrame],
    [offsetPx + 5, offsetPx + 10, -6, 0],  // dip → rise past → settle
    CLAMP
  );
  const opacity = interpolate(frame, [range.startFrame, antic + 4], [0, 1], CLAMP);
  return { y, opacity };
}

// scalePop — 4-phase spring
export function scalePop(frame: number, range: FrameRange): { scale: number; opacity: number } {
  const total = range.endFrame - range.startFrame;
  const scale = interpolate(
    frame,
    [range.startFrame, range.startFrame + total*0.15, range.startFrame + total*0.5, range.startFrame + total*0.75, range.endFrame],
    [0, 0.95, 1.12, 0.98, 1.0],  // squish → overshoot → undershoot → settle
    CLAMP
  );
  const opacity = interpolate(frame, [range.startFrame, range.startFrame + total*0.3], [0, 1], CLAMP);
  return { scale, opacity };
}
```

- Apply same pattern to slideDown, slideLeft, slideRight
- Add optional `anticipation?: boolean` parameter (default true) to preserve old behavior when needed

**Impact:** Every entrance gains physical weight. SlideUp no longer looks like a CSS transition — it looks like something with mass and momentum. Viewers *feel* the difference.

---

## Implementation Order (Recommended)

| Phase | Changes | Why This Order |
|-------|---------|----------------|
| Phase 1 | Change 7 (anticipation) + Change 1 (pacing) | Foundation: improve existing animation quality first |
| Phase 2 | Change 2 (secondary motion) + Change 3 (animated backgrounds) | Life: make everything feel alive |
| Phase 3 | Change 4 (decorative layer) + Change 5 (choreography) | Depth: add visual richness and sequencing |
| Phase 4 | Change 6 (expanded presets) | Identity: widen the visual vocabulary |
| Final | Update creative enhancer prompts for all new capabilities | Wiring: connect LLM to all new features |

## Critical Files

| File | Changes |
|------|---------|
| `src/primitives/animations.ts` | Adaptive phasing, secondary motion primitives, choreography util, anticipation/overshoot |
| `src/primitives/Background.tsx` | Frame-based animation for all background types |
| `src/templates/types.ts` | PacingProfile, SecondaryMotion, DecorativeTheme schemas |
| `src/primitives/useStylePreset.ts` | 8 new style presets |
| `src/primitives/useMotionStyle.ts` | 2 new easing curves |
| NEW: `src/primitives/DecorativeLayer.tsx` | Shared decorative element renderer |
| NEW: `src/primitives/useSecondaryMotion.ts` | Secondary motion resolver |
| `lib/templates/creativeEnhancer.ts` | LLM prompt updates for all new capabilities |
| Template TSX files (8-10 most-used) | Integrate secondary motion, decoratives, choreography |

## Before vs After (Hero-Text Example)

**Before:**
> Text fades in on flat dark gradient. Sits still for 3 seconds. Fades out. Every video feels the same.

**After:**
> Gradient background slowly shifts direction. Geometric accent shapes parallax-drift in first (frame 0-8). Accent line draws across (frame 4-12). Headline slides up with anticipation dip + overshoot (frame 4-22). Subtitle cascades in 400ms later (frame 14-26). During hold, headline breathes subtly (scale 1.0-1.015), decorative shapes gently rotate. Everything uses cinematic-noir preset with dramatic pacing. Exit: clip-reveal wipes out in reverse order.

## Verification

1. `npx tsc --noEmit` after each phase
2. Render 3-5 sample prompts per phase and compare before/after
3. Check that all animations remain deterministic (same frame → same output)
4. Verify creative enhancer correctly selects new options (check console logs)
5. Final: render full sample.json and confirm visual variety across all prompts
