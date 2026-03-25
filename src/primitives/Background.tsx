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

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const safe = hex.replace("#", "");
  return {
    r: parseInt(safe.slice(0, 2), 16),
    g: parseInt(safe.slice(2, 4), 16),
    b: parseInt(safe.slice(4, 6), 16),
  };
}

function alpha(hex: string, opacity: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
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
    const densityMap: Record<string, number> = { sparse: 36, normal: 24, dense: 16 };
    const spacing = densityMap[config.density] ?? 24;
    const dotRadius = Math.max(1, Math.round(config.dotSize));
    const seed = isAnimated ? Math.floor(frame / 3) : 0;
    const offset = isAnimated ? (frame * 0.2 + seed * 0.7) % spacing : 0;

    return (
      <AbsoluteFill style={{ backgroundColor: config.baseColor, overflow: "hidden" }}>
        <AbsoluteFill
          style={{
            backgroundImage: `radial-gradient(circle, ${alpha(config.dotColor, config.dotOpacity)} ${dotRadius}px, transparent ${dotRadius + 0.6}px)`,
            backgroundSize: `${spacing}px ${spacing}px`,
            backgroundPosition: `${offset}px ${offset}px`,
            opacity: 1,
          }}
        />
      </AbsoluteFill>
    );
  }

  // ── Grid ───────────────────────────────────────────────────────────────
  if (config.type === "grid") {
    const cell = Math.max(10, Math.round(config.cellSize));
    const lineW = Math.max(1, Math.round(config.lineWidth));
    const offset = isAnimated ? (frame * 0.25) % cell : 0;

    const gridBg = `linear-gradient(to right, ${alpha(config.gridColor, config.gridOpacity)} ${lineW}px, transparent ${lineW}px),
linear-gradient(to bottom, ${alpha(config.gridColor, config.gridOpacity)} ${lineW}px, transparent ${lineW}px)`;

    return (
      <AbsoluteFill style={{ backgroundColor: config.baseColor, overflow: "hidden" }}>
        <AbsoluteFill
          style={{
            backgroundImage: gridBg,
            backgroundSize: `${cell}px ${cell}px`,
            backgroundPosition: `${-offset}px ${-offset}px`,
          }}
        />
      </AbsoluteFill>
    );
  }

  // ── Radial glow ────────────────────────────────────────────────────────
  if (config.type === "radial-glow") {
    const cx = isAnimated ? 50 + (triangleWave(frame, 240) - 0.5) * 10 : 50;
    const cy = isAnimated ? 50 + (triangleWave(frame + 60, 180) - 0.5) * 8 : 50;
    const glow = alpha(config.glowColor, config.glowOpacity);
    return (
      <AbsoluteFill style={{ backgroundColor: config.baseColor, overflow: "hidden" }}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at ${cx}% ${cy}%, ${glow} 0%, transparent 60%)`,
            opacity: 1,
          }}
        />
      </AbsoluteFill>
    );
  }

  // Fallback: treat as solid white
  return <AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }} />;
};
