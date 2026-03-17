import { interpolate } from "remotion";

// ── Types ─────────────────────────────────────────────────────────────────

interface FrameRange {
  startFrame: number;
  endFrame: number;
}

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// ── Helpers ───────────────────────────────────────────────────────────────

/** Convert seconds to frame number at 30fps. */
export function secToFrame(sec: number): number {
  return Math.round(sec * 30);
}

/** Compute entrance/main/exit frame boundaries for a given total duration (seconds). */
export function phaseFrames(durationSec: number): {
  entrance: FrameRange;
  main: FrameRange;
  exit: FrameRange;
  total: number;
} {
  const total = secToFrame(durationSec);
  const entranceEnd = Math.round(total * 0.2);
  const exitStart = Math.round(total * 0.8);
  return {
    entrance: { startFrame: 0, endFrame: entranceEnd },
    main: { startFrame: entranceEnd, endFrame: exitStart },
    exit: { startFrame: exitStart, endFrame: total },
    total,
  };
}

/** Compute stagger delay for item at `index` among `totalItems`, spread across `totalFrames`. */
export function staggerDelay(
  index: number,
  totalItems: number,
  totalFrames: number
): FrameRange {
  const itemDuration = Math.round(totalFrames * 0.6);
  const gap =
    totalItems > 1
      ? Math.round((totalFrames - itemDuration) / (totalItems - 1))
      : 0;
  const startFrame = index * gap;
  return {
    startFrame,
    endFrame: startFrame + itemDuration,
  };
}

// ── Animation Presets ─────────────────────────────────────────────────────

/** Fade in: opacity 0 → 1 */
export function fadeIn(frame: number, range: FrameRange): { opacity: number } {
  return {
    opacity: interpolate(frame, [range.startFrame, range.endFrame], [0, 1], CLAMP),
  };
}

/** Fade out: opacity 1 → 0 */
export function fadeOut(frame: number, range: FrameRange): { opacity: number } {
  return {
    opacity: interpolate(frame, [range.startFrame, range.endFrame], [1, 0], CLAMP),
  };
}

/** Slide up: translateY from +offset to 0, with opacity fade. */
export function slideUp(
  frame: number,
  range: FrameRange,
  offsetPx: number = 40
): { y: number; opacity: number } {
  return {
    y: interpolate(frame, [range.startFrame, range.endFrame], [offsetPx, 0], CLAMP),
    opacity: interpolate(frame, [range.startFrame, range.endFrame], [0, 1], CLAMP),
  };
}

/** Slide down: translateY from -offset to 0, with opacity fade. */
export function slideDown(
  frame: number,
  range: FrameRange,
  offsetPx: number = 40
): { y: number; opacity: number } {
  return {
    y: interpolate(frame, [range.startFrame, range.endFrame], [-offsetPx, 0], CLAMP),
    opacity: interpolate(frame, [range.startFrame, range.endFrame], [0, 1], CLAMP),
  };
}

/** Slide left: translateX from +offset to 0, with opacity fade. */
export function slideLeft(
  frame: number,
  range: FrameRange,
  offsetPx: number = 60
): { x: number; opacity: number } {
  return {
    x: interpolate(frame, [range.startFrame, range.endFrame], [offsetPx, 0], CLAMP),
    opacity: interpolate(frame, [range.startFrame, range.endFrame], [0, 1], CLAMP),
  };
}

/** Slide right: translateX from -offset to 0, with opacity fade. */
export function slideRight(
  frame: number,
  range: FrameRange,
  offsetPx: number = 60
): { x: number; opacity: number } {
  return {
    x: interpolate(frame, [range.startFrame, range.endFrame], [-offsetPx, 0], CLAMP),
    opacity: interpolate(frame, [range.startFrame, range.endFrame], [0, 1], CLAMP),
  };
}

/** Scale pop: two-phase overshoot (0 → 1.15 → 1) with opacity fade in first half. */
export function scalePop(
  frame: number,
  range: FrameRange,
  overshoot: number = 1.15
): { scale: number; opacity: number } {
  const mid = Math.round((range.startFrame + range.endFrame) / 2);
  const phase1 = interpolate(frame, [range.startFrame, mid], [0, overshoot], CLAMP);
  const phase2 = interpolate(frame, [mid, range.endFrame], [overshoot, 1], CLAMP);
  const scale = frame < mid ? phase1 : phase2;
  const opacity = interpolate(frame, [range.startFrame, mid], [0, 1], CLAMP);
  return { scale, opacity };
}

/** Blur reveal: blur 12→0, opacity 0→1, scale 0.8→1 */
export function blurReveal(
  frame: number,
  range: FrameRange,
  blurStart: number = 12
): { blur: number; opacity: number; scale: number } {
  return {
    blur: interpolate(frame, [range.startFrame, range.endFrame], [blurStart, 0], CLAMP),
    opacity: interpolate(frame, [range.startFrame, range.endFrame], [0, 1], CLAMP),
    scale: interpolate(frame, [range.startFrame, range.endFrame], [0.8, 1], CLAMP),
  };
}

/** Typewriter: reveals characters 0 → totalChars */
export function typewriter(
  frame: number,
  range: FrameRange,
  totalChars: number
): number {
  return Math.round(
    interpolate(frame, [range.startFrame, range.endFrame], [0, totalChars], CLAMP)
  );
}

/** Count up: interpolates a number from `from` to `to`. */
export function countUp(
  frame: number,
  range: FrameRange,
  from: number,
  to: number
): number {
  return Math.round(
    interpolate(frame, [range.startFrame, range.endFrame], [from, to], CLAMP)
  );
}

/** Highlight reveal: scaleX 0 → 1 (for expanding highlight box behind text). */
export function highlightReveal(
  frame: number,
  range: FrameRange
): number {
  return interpolate(frame, [range.startFrame, range.endFrame], [0, 1], CLAMP);
}

/** Underline draw: width 0% → 100%. */
export function underlineDraw(
  frame: number,
  range: FrameRange
): number {
  return interpolate(frame, [range.startFrame, range.endFrame], [0, 100], CLAMP);
}
