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

// ── Advanced Animation Presets ──────────────────────────────────────────

export type ClipDirection =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "center-h"
  | "center-v"
  | "circle"
  | "diagonal";

/** Build a clipPath string for a given progress (0→1) and direction. */
function buildClipPath(progress: number, direction: ClipDirection): string {
  const p = Math.max(0, Math.min(1, progress));
  switch (direction) {
    case "left":
      return `inset(0 ${(1 - p) * 100}% 0 0)`;
    case "right":
      return `inset(0 0 0 ${(1 - p) * 100}%)`;
    case "top":
      return `inset(0 0 ${(1 - p) * 100}% 0)`;
    case "bottom":
      return `inset(${(1 - p) * 100}% 0 0 0)`;
    case "center-h": {
      const half = ((1 - p) * 100) / 2;
      return `inset(0 ${half}% 0 ${half}%)`;
    }
    case "center-v": {
      const half = ((1 - p) * 100) / 2;
      return `inset(${half}% 0 ${half}% 0)`;
    }
    case "circle":
      return `circle(${p * 75}% at 50% 50%)`;
    case "diagonal": {
      const x = p * 150;
      return `polygon(${x - 50}% 0%, ${x}% 0%, ${x - 50}% 100%, ${x - 100}% 100%)`;
    }
    default:
      return `inset(0 0 0 0)`;
  }
}

/** Clip reveal: animates clipPath from hidden to fully visible. */
export function clipReveal(
  frame: number,
  range: FrameRange,
  direction: ClipDirection = "left"
): { clipPath: string } {
  const progress = interpolate(frame, [range.startFrame, range.endFrame], [0, 1], CLAMP);
  return { clipPath: buildClipPath(progress, direction) };
}

/** Clip exit: animates clipPath from fully visible to hidden. */
export function clipExit(
  frame: number,
  range: FrameRange,
  direction: ClipDirection = "left"
): { clipPath: string } {
  const progress = interpolate(frame, [range.startFrame, range.endFrame], [1, 0], CLAMP);
  return { clipPath: buildClipPath(progress, direction) };
}

/** Camera drift: slow Ken Burns-style pan + zoom over the range. */
export function cameraDrift(
  frame: number,
  range: FrameRange,
  driftX: number = 20,
  driftY: number = 10,
  zoomStart: number = 1.0,
  zoomEnd: number = 1.05
): { x: number; y: number; scale: number } {
  return {
    x: interpolate(frame, [range.startFrame, range.endFrame], [0, driftX], CLAMP),
    y: interpolate(frame, [range.startFrame, range.endFrame], [0, driftY], CLAMP),
    scale: interpolate(frame, [range.startFrame, range.endFrame], [zoomStart, zoomEnd], CLAMP),
  };
}

/** Parallax layer: depth-based horizontal translation. depth 0=slow bg, 1=fast fg. */
export function parallaxLayer(
  frame: number,
  range: FrameRange,
  depth: number,
  basePx: number = 50
): { x: number } {
  const travel = basePx * depth;
  return {
    x: interpolate(frame, [range.startFrame, range.endFrame], [0, -travel], CLAMP),
  };
}

/** Glow pulse: deterministic sine-like pulse using segmented interpolation. */
export function glowPulse(
  frame: number,
  range: FrameRange,
  cycles: number = 2
): { opacity: number; spread: number } {
  const totalDuration = range.endFrame - range.startFrame;
  const cycleFrames = totalDuration / cycles;
  const halfCycle = cycleFrames / 2;
  const elapsed = Math.max(0, frame - range.startFrame);
  const posInCycle = elapsed % cycleFrames;
  const pulseValue =
    posInCycle < halfCycle
      ? interpolate(posInCycle, [0, halfCycle], [0.3, 1], CLAMP)
      : interpolate(posInCycle, [halfCycle, cycleFrames], [1, 0.3], CLAMP);
  return {
    opacity: frame < range.startFrame || frame > range.endFrame ? 0 : pulseValue,
    spread: frame < range.startFrame || frame > range.endFrame ? 0 : pulseValue * 20,
  };
}

/** Spring in: multi-phase overshoot entrance (0→1.2→0.95→1.0 for bounces=2). */
export function springIn(
  frame: number,
  range: FrameRange,
  bounces: number = 2
): { scale: number; opacity: number } {
  const segments = bounces + 1;
  const segLen = Math.round((range.endFrame - range.startFrame) / segments);
  const keyframes = [0];
  for (let i = 1; i <= bounces; i++) {
    const overshoot = i % 2 === 1 ? 1 + 0.2 / i : 1 - 0.1 / i;
    keyframes.push(overshoot);
  }
  keyframes.push(1);

  let scale = 0;
  for (let i = 0; i < segments; i++) {
    const segStart = range.startFrame + i * segLen;
    const segEnd = i === segments - 1 ? range.endFrame : segStart + segLen;
    if (frame >= segStart && frame <= segEnd) {
      scale = interpolate(frame, [segStart, segEnd], [keyframes[i], keyframes[i + 1]], CLAMP);
      break;
    }
    if (frame > segEnd) {
      scale = keyframes[i + 1];
    }
  }

  const opacityEnd = range.startFrame + segLen;
  const opacity = interpolate(frame, [range.startFrame, opacityEnd], [0, 1], CLAMP);
  return { scale, opacity };
}

/** Stagger cascade: center-out or edges-in stagger ordering. */
export function staggerCascade(
  index: number,
  totalItems: number,
  totalFrames: number,
  direction: "center-out" | "edges-in" = "center-out"
): FrameRange {
  const mid = (totalItems - 1) / 2;
  const maxDist = mid;
  const dist = Math.abs(index - mid);
  const order = direction === "center-out" ? dist : maxDist - dist;
  const normalizedOrder = maxDist > 0 ? order / maxDist : 0;
  const itemDuration = Math.round(totalFrames * 0.6);
  const maxDelay = totalFrames - itemDuration;
  const startFrame = Math.round(normalizedOrder * maxDelay);
  return { startFrame, endFrame: startFrame + itemDuration };
}

// ── Micro Motion ────────────────────────────────────────────────────────

/** Deterministic subtle floating motion based on frame number. */
export function microFloat(frame: number, amplitude: number = 2): { y: number } {
  return { y: Math.sin(frame * 0.1) * amplitude };
}
