import { Easing } from "remotion";
import type { MotionStyle } from "../templates/types";

export interface MotionConfig {
  /** Multiplier for entrance/exit phase durations. <1 = faster, >1 = slower. */
  durationMultiplier: number;
  /** Easing function for interpolate calls. */
  easing: (t: number) => number;
  /** Whether stagger should be applied to multi-item templates. */
  staggerEnabled: boolean;
  /** Whether micro-motion (subtle float) should be applied during main phase. */
  microMotionEnabled: boolean;
}

const SPEED_MAP: Record<string, number> = {
  slow: 1.4,
  medium: 1.0,
  fast: 0.7,
};

const EASING_MAP: Record<string, (t: number) => number> = {
  smooth: Easing.bezier(0.4, 0, 0.2, 1),
  snappy: Easing.bezier(0.25, 0.1, 0.25, 1.0),
  elastic: Easing.bezier(0.68, -0.55, 0.265, 1.55),
};

const DEFAULT_CONFIG: MotionConfig = {
  durationMultiplier: 1.0,
  easing: (t: number) => t,
  staggerEnabled: false,
  microMotionEnabled: false,
};

/**
 * Resolve a MotionStyle object into a MotionConfig.
 * Returns default config when motionStyle is undefined.
 */
export function resolveMotionStyle(motionStyle?: MotionStyle): MotionConfig {
  if (!motionStyle) return DEFAULT_CONFIG;

  return {
    durationMultiplier: SPEED_MAP[motionStyle.speed] ?? 1.0,
    easing: EASING_MAP[motionStyle.easing] ?? ((t: number) => t),
    staggerEnabled: motionStyle.stagger,
    microMotionEnabled: motionStyle.microMotion,
  };
}

export { EASING_MAP };
