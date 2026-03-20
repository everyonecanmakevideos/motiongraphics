import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import type { BackgroundConfig } from "../templates/types";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const DENSITY_MAP: Record<string, number> = {
  sparse: 40,
  normal: 20,
  dense: 10,
};

function gradientDirection(dir: string): string {
  const map: Record<string, string> = {
    "to-bottom": "to bottom",
    "to-right": "to right",
    "to-bottom-right": "to bottom right",
    "to-top": "to top",
    "to-left": "to left",
  };
  return map[dir] ?? "to bottom";
}

/** Convert direction string to base angle for animation */
function directionToAngle(dir: string): number {
  const map: Record<string, number> = {
    "to-bottom": 180,
    "to-right": 90,
    "to-bottom-right": 135,
    "to-top": 0,
    "to-left": 270,
  };
  return map[dir] ?? 180;
}

/** Deterministic triangle wave: oscillates 0→1→0 over `period` frames */
function triangleWave(frame: number, period: number): number {
  const halfPeriod = period / 2;
  const posInCycle = frame % period;
  return posInCycle < halfPeriod
    ? interpolate(posInCycle, [0, halfPeriod], [0, 1], CLAMP)
    : interpolate(posInCycle, [halfPeriod, period], [1, 0], CLAMP);
}

export const Background: React.FC<{ config: BackgroundConfig; frame?: number }> = ({
  config,
  frame,
}) => {
  const isAnimated = frame !== undefined;

  // ── Solid ──────────────────────────────────────────────────────────────
  if (config.type === "solid") {
    // Animated: subtle pulsing radial vignette overlay
    if (isAnimated) {
      const vignetteOpacity = 0.06 + triangleWave(frame, 150) * 0.08;
      return (
        <AbsoluteFill style={{ backgroundColor: config.color, overflow: "hidden" }}>
          <AbsoluteFill
            style={{
              background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${vignetteOpacity}) 100%)`,
            }}
          />
        </AbsoluteFill>
      );
    }
    return (
      <AbsoluteFill style={{ backgroundColor: config.color, overflow: "hidden" }} />
    );
  }

  // ── Gradient ───────────────────────────────────────────────────────────
  if (config.type === "gradient") {
    if (isAnimated && config.direction !== "radial") {
      // Slow angle sway: ±8° around the base direction
      const baseAngle = directionToAngle(config.direction);
      const sway = (triangleWave(frame, 200) - 0.5) * 16; // -8 to +8 degrees
      const angle = baseAngle + sway;
      const bg = `linear-gradient(${angle}deg, ${config.from}, ${config.to})`;
      return <AbsoluteFill style={{ background: bg, overflow: "hidden" }} />;
    }
    if (isAnimated && config.direction === "radial") {
      // Radial: slowly shift center point
      const cx = 50 + (triangleWave(frame, 240) - 0.5) * 8; // 46%-54%
      const cy = 50 + (triangleWave(frame + 60, 180) - 0.5) * 6; // 47%-53%
      const bg = `radial-gradient(circle at ${cx}% ${cy}%, ${config.from}, ${config.to})`;
      return <AbsoluteFill style={{ background: bg, overflow: "hidden" }} />;
    }
    // Static fallback
    const bg =
      config.direction === "radial"
        ? `radial-gradient(circle at center, ${config.from}, ${config.to})`
        : `linear-gradient(${gradientDirection(config.direction)}, ${config.from}, ${config.to})`;
    return <AbsoluteFill style={{ background: bg, overflow: "hidden" }} />;
  }

  // ── Stripe ─────────────────────────────────────────────────────────────
  if (config.type === "stripe") {
    const gap = DENSITY_MAP[config.density] ?? 20;
    const stripeW = Math.max(1, Math.round(gap * 0.3));
    const bg =
      "repeating-linear-gradient(" +
      config.angle +
      "deg, " +
      config.stripeColor +
      " 0px, " +
      config.stripeColor +
      " " +
      stripeW +
      "px, transparent " +
      stripeW +
      "px, transparent " +
      gap +
      "px)";

    // Animated: slow stripe crawl
    const offset = isAnimated ? frame * 0.3 : 0;
    return (
      <AbsoluteFill style={{ backgroundColor: config.baseColor, overflow: "hidden" }}>
        <AbsoluteFill
          style={{
            background: bg,
            opacity: 0.15,
            backgroundPosition: `${offset}px ${offset}px`,
          }}
        />
      </AbsoluteFill>
    );
  }

  // ── Grain ──────────────────────────────────────────────────────────────
  if (config.type === "grain") {
    // Animated: vary seed every 3 frames for film grain flicker
    const seed = isAnimated ? 42 + Math.floor(frame / 3) : 42;
    const filterId = `grain-filter-${seed}`;
    return (
      <AbsoluteFill style={{ backgroundColor: config.baseColor, overflow: "hidden" }}>
        <AbsoluteFill style={{ opacity: config.grainOpacity }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <filter id={filterId}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.65"
                numOctaves="3"
                seed={seed}
                stitchTiles="stitch"
              />
            </filter>
            <rect width="100%" height="100%" filter={`url(#${filterId})`} />
          </svg>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // ── Dots ───────────────────────────────────────────────────────────────
  if (config.type === "dots") {
    const offset = isAnimated ? (frame * 0.35) % config.gap : 0;
    const bg = `radial-gradient(circle, ${config.dotColor} 0 ${config.size}px, transparent ${config.size + 1}px)`;
    return (
      <AbsoluteFill style={{ backgroundColor: config.baseColor, overflow: "hidden" }}>
        <AbsoluteFill
          style={{
            opacity: config.opacity,
            backgroundImage: bg,
            backgroundSize: `${config.gap}px ${config.gap}px`,
            backgroundPosition: `${offset}px ${offset}px`,
          }}
        />
      </AbsoluteFill>
    );
  }

  // ── Grid ───────────────────────────────────────────────────────────────
  if (config.type === "grid") {
    const offset = isAnimated ? (frame * 0.25) % config.cell : 0;
    const grid = `
      linear-gradient(to right, ${config.lineColor} ${config.lineWidth}px, transparent ${config.lineWidth}px),
      linear-gradient(to bottom, ${config.lineColor} ${config.lineWidth}px, transparent ${config.lineWidth}px)
    `;
    return (
      <AbsoluteFill style={{ backgroundColor: config.baseColor, overflow: "hidden" }}>
        <AbsoluteFill
          style={{
            opacity: config.opacity,
            backgroundImage: grid,
            backgroundSize: `${config.cell}px ${config.cell}px`,
            backgroundPosition: `${offset}px ${offset}px`,
          }}
        />
      </AbsoluteFill>
    );
  }

  // ── Radial Glow ────────────────────────────────────────────────────────
  if (config.type === "radial-glow") {
    const cx = isAnimated ? 50 + (triangleWave(frame, 220) - 0.5) * 10 : 50;
    const cy = isAnimated ? 50 + (triangleWave(frame + 60, 180) - 0.5) * 8 : 50;
    return (
      <AbsoluteFill style={{ backgroundColor: config.baseColor, overflow: "hidden" }}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at ${cx}% ${cy}%, ${config.glowColor}${Math.round(
              config.intensity * 255,
            ).toString(16).padStart(2, "0")}, transparent 60%)`,
            mixBlendMode: "screen",
            opacity: 1,
          }}
        />
      </AbsoluteFill>
    );
  }

  // Fallback: treat as solid white
  return <AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }} />;
};
