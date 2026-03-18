import type { FrameRange } from "./animations";
import { breathe, driftX, gentleRotate, microFloat } from "./animations";
import type { SecondaryMotion } from "../templates/types";

export interface SecondaryMotionResult {
  scale: number;
  x: number;
  y: number;
  rotation: number;
}

const INTENSITY_MAP: Record<string, { amplitude: number; period: number }> = {
  subtle:  { amplitude: 0.010, period: 120 },
  medium:  { amplitude: 0.020, period: 90  },
  strong:  { amplitude: 0.035, period: 70  },
};

const DRIFT_INTENSITY: Record<string, { amplitude: number; period: number }> = {
  subtle:  { amplitude: 2,  period: 130 },
  medium:  { amplitude: 4,  period: 100 },
  strong:  { amplitude: 7,  period: 80  },
};

const ROTATE_INTENSITY: Record<string, { maxDeg: number; period: number }> = {
  subtle:  { maxDeg: 1.0, period: 150 },
  medium:  { maxDeg: 2.0, period: 110 },
  strong:  { maxDeg: 3.5, period: 85  },
};

const FLOAT_INTENSITY: Record<string, { amplitude: number; period: number }> = {
  subtle:  { amplitude: 1.5, period: 80  },
  medium:  { amplitude: 3,   period: 60  },
  strong:  { amplitude: 5,   period: 45  },
};

const IDENTITY: SecondaryMotionResult = { scale: 1, x: 0, y: 0, rotation: 0 };

/**
 * Resolve a SecondaryMotion config into concrete transform values for a given frame.
 * Returns identity (no-op) transforms when secondaryMotion is undefined or type is "none".
 */
export function resolveSecondaryMotion(
  frame: number,
  range: FrameRange,
  secondaryMotion?: SecondaryMotion,
): SecondaryMotionResult {
  if (!secondaryMotion || secondaryMotion.type === "none") return IDENTITY;

  const intensity = secondaryMotion.intensity ?? "subtle";

  switch (secondaryMotion.type) {
    case "breathe": {
      const cfg = INTENSITY_MAP[intensity] ?? INTENSITY_MAP.subtle;
      const { scale } = breathe(frame, range, cfg.amplitude, cfg.period);
      return { scale, x: 0, y: 0, rotation: 0 };
    }
    case "float": {
      const cfg = FLOAT_INTENSITY[intensity] ?? FLOAT_INTENSITY.subtle;
      const { y } = microFloat(frame, cfg.amplitude, cfg.period);
      return { scale: 1, x: 0, y, rotation: 0 };
    }
    case "drift": {
      const cfg = DRIFT_INTENSITY[intensity] ?? DRIFT_INTENSITY.subtle;
      const { x } = driftX(frame, range, cfg.amplitude, cfg.period);
      return { scale: 1, x, y: 0, rotation: 0 };
    }
    case "rotate": {
      const cfg = ROTATE_INTENSITY[intensity] ?? ROTATE_INTENSITY.subtle;
      const { rotation } = gentleRotate(frame, range, cfg.maxDeg, cfg.period);
      return { scale: 1, x: 0, y: 0, rotation };
    }
    default:
      return IDENTITY;
  }
}
