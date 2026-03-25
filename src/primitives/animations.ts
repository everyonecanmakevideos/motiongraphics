import { interpolate } from "remotion";
import type { PacingProfile } from "../templates/types";

// ── Types ─────────────────────────────────────────────────────────────────

export interface FrameRange {
  startFrame: number;
  endFrame: number;
}

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// ── Helpers ───────────────────────────────────────────────────────────────

/** Convert seconds to frame number at 30fps. */
export function secToFrame(sec: number): number {
  return Math.round(sec * 30);
}

// ── Adaptive Phase Timing ────────────────────────────────────────────────

const PACING_MAP: Record<PacingProfile, { entrance: number; main: number; exit: number }> = {
  dramatic:  { entrance: 0.35, main: 0.40, exit: 0.25 },
  energetic: { entrance: 0.12, main: 0.63, exit: 0.25 },
  elegant:   { entrance: 0.25, main: 0.55, exit: 0.20 },
  standard:  { entrance: 0.20, main: 0.60, exit: 0.20 },
  suspense:  { entrance: 0.40, main: 0.35, exit: 0.25 },
};

/** Compute entrance/main/exit frame boundaries with mood-adaptive pacing. */
export function phaseFrames(durationSec: number, profile: PacingProfile = "standard"): {
  entrance: FrameRange;
  main: FrameRange;
  exit: FrameRange;
  total: number;
} {
  const p = PACING_MAP[profile] ?? PACING_MAP.standard;
  const total = secToFrame(durationSec);
  const entranceEnd = Math.round(total * p.entrance);
  const exitStart = Math.round(total * (p.entrance + p.main));
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

/**
 * Adaptive entrance window that stays readable across durations:
 * - short videos are not blink-fast
 * - long videos don't spend too much time only on entrance
 */
export function adaptiveEntranceWindow(
  durationSec: number,
  totalFrames: number,
  speedMultiplier: number = 1,
  opts?: {
    startPct?: number;
    minSec?: number;
    maxSec?: number;
    maxEndPct?: number;
  }
): FrameRange {
  const startPct = opts?.startPct ?? 0.08;
  const minSec = opts?.minSec ?? 1.6;
  const maxSec = opts?.maxSec ?? 4.0;
  const maxEndPct = opts?.maxEndPct ?? 0.75;

  const startFrame = Math.round(totalFrames * startPct);
  const rawSec = durationSec * 0.45;
  const cappedSec = Math.max(minSec, Math.min(rawSec, maxSec));
  const scaledSec = cappedSec * Math.max(0.85, Math.min(1.15, speedMultiplier));
  const endFrame = Math.min(startFrame + secToFrame(scaledSec), Math.round(totalFrames * maxEndPct));
  return { startFrame, endFrame };
}

// ── Entrance Animation Presets (with anticipation & follow-through) ─────

/** Fade in: opacity 0 → 1, with optional subtle scale for physical feel. */
export function fadeIn(frame: number, range: FrameRange): { opacity: number; scale: number } {
  return {
    opacity: interpolate(frame, [range.startFrame, range.endFrame], [0, 1], CLAMP),
    scale: interpolate(frame, [range.startFrame, range.endFrame], [0.97, 1], CLAMP),
  };
}

/** Fade out: opacity 1 → 0 */
export function fadeOut(frame: number, range: FrameRange): { opacity: number } {
  return {
    opacity: interpolate(frame, [range.startFrame, range.endFrame], [1, 0], CLAMP),
  };
}

/**
 * Slide up with anticipation + overshoot + settle.
 * Phase 1 (0-8%):  anticipation dip (slight downward)
 * Phase 2 (8-70%): main rise past target (overshoot)
 * Phase 3 (70-100%): settle to final position
 */
export function slideUp(
  frame: number,
  range: FrameRange,
  offsetPx: number = 40
): { y: number; opacity: number } {
  const dur = range.endFrame - range.startFrame;
  const antic = range.startFrame + Math.round(dur * 0.08);
  const main = range.startFrame + Math.round(dur * 0.70);

  const y = interpolate(
    frame,
    [range.startFrame, antic, main, range.endFrame],
    [offsetPx + 5, offsetPx + 10, -6, 0],
    CLAMP
  );
  const opacity = interpolate(frame, [range.startFrame, antic + 4], [0, 1], CLAMP);
  return { y, opacity };
}

/**
 * Slide down with anticipation + overshoot + settle.
 */
export function slideDown(
  frame: number,
  range: FrameRange,
  offsetPx: number = 40
): { y: number; opacity: number } {
  const dur = range.endFrame - range.startFrame;
  const antic = range.startFrame + Math.round(dur * 0.08);
  const main = range.startFrame + Math.round(dur * 0.70);

  const y = interpolate(
    frame,
    [range.startFrame, antic, main, range.endFrame],
    [-(offsetPx + 5), -(offsetPx + 10), 6, 0],
    CLAMP
  );
  const opacity = interpolate(frame, [range.startFrame, antic + 4], [0, 1], CLAMP);
  return { y, opacity };
}

/**
 * Slide left with anticipation + overshoot + settle.
 */
export function slideLeft(
  frame: number,
  range: FrameRange,
  offsetPx: number = 60
): { x: number; opacity: number } {
  const dur = range.endFrame - range.startFrame;
  const antic = range.startFrame + Math.round(dur * 0.08);
  const main = range.startFrame + Math.round(dur * 0.70);

  const x = interpolate(
    frame,
    [range.startFrame, antic, main, range.endFrame],
    [offsetPx + 8, offsetPx + 14, -5, 0],
    CLAMP
  );
  const opacity = interpolate(frame, [range.startFrame, antic + 4], [0, 1], CLAMP);
  return { x, opacity };
}

/**
 * Slide right with anticipation + overshoot + settle.
 */
export function slideRight(
  frame: number,
  range: FrameRange,
  offsetPx: number = 60
): { x: number; opacity: number } {
  const dur = range.endFrame - range.startFrame;
  const antic = range.startFrame + Math.round(dur * 0.08);
  const main = range.startFrame + Math.round(dur * 0.70);

  const x = interpolate(
    frame,
    [range.startFrame, antic, main, range.endFrame],
    [-(offsetPx + 8), -(offsetPx + 14), 5, 0],
    CLAMP
  );
  const opacity = interpolate(frame, [range.startFrame, antic + 4], [0, 1], CLAMP);
  return { x, opacity };
}

/**
 * Scale pop: 4-phase spring with anticipation squish, overshoot, undershoot, settle.
 * 0 → 0.95 (squish) → 1.12 (overshoot) → 0.98 (undershoot) → 1.0 (settle)
 */
export function scalePop(
  frame: number,
  range: FrameRange,
  overshoot: number = 1.12
): { scale: number; opacity: number } {
  const dur = range.endFrame - range.startFrame;
  const scale = interpolate(
    frame,
    [
      range.startFrame,
      range.startFrame + Math.round(dur * 0.15),
      range.startFrame + Math.round(dur * 0.50),
      range.startFrame + Math.round(dur * 0.75),
      range.endFrame,
    ],
    [0, 0.95, overshoot, 0.98, 1.0],
    CLAMP
  );
  const opacity = interpolate(
    frame,
    [range.startFrame, range.startFrame + Math.round(dur * 0.3)],
    [0, 1],
    CLAMP
  );
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
  driftXPx: number = 20,
  driftYPx: number = 10,
  zoomStart: number = 1.0,
  zoomEnd: number = 1.05
): { x: number; y: number; scale: number } {
  return {
    x: interpolate(frame, [range.startFrame, range.endFrame], [0, driftXPx], CLAMP),
    y: interpolate(frame, [range.startFrame, range.endFrame], [0, driftYPx], CLAMP),
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

// ── Secondary Motion (continuous during main phase) ─────────────────────

/** Scale breathing: oscillates 1.0 → 1+amplitude → 1.0 deterministically. */
export function breathe(
  frame: number,
  range: FrameRange,
  amplitude: number = 0.015,
  period: number = 90
): { scale: number } {
  if (frame < range.startFrame || frame > range.endFrame) return { scale: 1 };
  const elapsed = frame - range.startFrame;
  const halfPeriod = period / 2;
  const posInCycle = elapsed % period;
  const scale =
    posInCycle < halfPeriod
      ? interpolate(posInCycle, [0, halfPeriod], [1, 1 + amplitude], CLAMP)
      : interpolate(posInCycle, [halfPeriod, period], [1 + amplitude, 1], CLAMP);
  return { scale };
}

/** Gentle horizontal drift: oscillates left/right deterministically. */
export function driftX(
  frame: number,
  range: FrameRange,
  amplitude: number = 3,
  period: number = 100
): { x: number } {
  if (frame < range.startFrame || frame > range.endFrame) return { x: 0 };
  const elapsed = frame - range.startFrame;
  const halfPeriod = period / 2;
  const posInCycle = elapsed % period;
  const raw =
    posInCycle < halfPeriod
      ? interpolate(posInCycle, [0, halfPeriod], [0, amplitude], CLAMP)
      : interpolate(posInCycle, [halfPeriod, period], [amplitude, 0], CLAMP);
  return { x: raw - amplitude / 2 };
}

/** Gentle rotation oscillation: deterministic pendulum. */
export function gentleRotate(
  frame: number,
  range: FrameRange,
  maxDeg: number = 1.5,
  period: number = 120
): { rotation: number } {
  if (frame < range.startFrame || frame > range.endFrame) return { rotation: 0 };
  const elapsed = frame - range.startFrame;
  const quarterPeriod = period / 4;
  const posInCycle = elapsed % period;
  let rotation: number;
  if (posInCycle < quarterPeriod) {
    rotation = interpolate(posInCycle, [0, quarterPeriod], [0, maxDeg], CLAMP);
  } else if (posInCycle < quarterPeriod * 2) {
    rotation = interpolate(posInCycle, [quarterPeriod, quarterPeriod * 2], [maxDeg, 0], CLAMP);
  } else if (posInCycle < quarterPeriod * 3) {
    rotation = interpolate(posInCycle, [quarterPeriod * 2, quarterPeriod * 3], [0, -maxDeg], CLAMP);
  } else {
    rotation = interpolate(posInCycle, [quarterPeriod * 3, period], [-maxDeg, 0], CLAMP);
  }
  return { rotation };
}

/** Deterministic subtle floating motion based on frame number. */
export function microFloat(frame: number, amplitude: number = 2, period: number = 60): { y: number } {
  const halfPeriod = period / 2;
  const posInCycle = frame % period;
  const raw =
    posInCycle < halfPeriod
      ? interpolate(posInCycle, [0, halfPeriod], [0, amplitude], CLAMP)
      : interpolate(posInCycle, [halfPeriod, period], [amplitude, 0], CLAMP);
  return { y: raw - amplitude / 2 };
}

// ── Choreography ────────────────────────────────────────────────────────

export interface ChoreographyStep {
  id: string;
  startOffset: number;  // frames after sequence start
  duration: number;     // frames for this element's entrance
}

/**
 * Compute absolute FrameRanges for a choreographed entrance sequence.
 * Each step has a relative startOffset and duration within the entrance window.
 */
export function choreograph(
  entranceStartFrame: number,
  steps: ChoreographyStep[]
): Map<string, FrameRange> {
  const result = new Map<string, FrameRange>();
  for (const step of steps) {
    result.set(step.id, {
      startFrame: entranceStartFrame + step.startOffset,
      endFrame: entranceStartFrame + step.startOffset + step.duration,
    });
  }
  return result;
}
