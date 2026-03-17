import React from "react";
import { AbsoluteFill } from "remotion";
import type { BackgroundConfig } from "../templates/types";

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

export const Background: React.FC<{ config: BackgroundConfig }> = ({ config }) => {
  if (config.type === "solid") {
    return (
      <AbsoluteFill
        style={{ backgroundColor: config.color, overflow: "hidden" }}
      />
    );
  }

  if (config.type === "gradient") {
    const bg =
      config.direction === "radial"
        ? "radial-gradient(circle at center, " + config.from + ", " + config.to + ")"
        : "linear-gradient(" + gradientDirection(config.direction) + ", " + config.from + ", " + config.to + ")";
    return (
      <AbsoluteFill style={{ background: bg, overflow: "hidden" }} />
    );
  }

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
    return (
      <AbsoluteFill style={{ backgroundColor: config.baseColor, overflow: "hidden" }}>
        <AbsoluteFill style={{ background: bg, opacity: 0.15 }} />
      </AbsoluteFill>
    );
  }

  if (config.type === "grain") {
    return (
      <AbsoluteFill style={{ backgroundColor: config.baseColor, overflow: "hidden" }}>
        <AbsoluteFill style={{ opacity: config.grainOpacity }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <filter id="grain-filter">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.65"
                numOctaves="3"
                seed="42"
                stitchTiles="stitch"
              />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain-filter)" />
          </svg>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // Fallback: treat as solid white
  return <AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }} />;
};
