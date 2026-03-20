import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { driftX, gentleRotate } from "./animations";
import type { FrameRange } from "./animations";
import type { DecorativeTheme } from "../templates/types";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// ── Shape Definitions per Theme ──────────────────────────────────────────

interface DecoShape {
  type: "circle" | "line" | "dot" | "square" | "bracket" | "streak";
  x: string;
  y: string;
  size: number;
  depth: number;       // 0=slow bg, 1=fast fg (parallax)
  rotation?: number;
  opacity?: number;
}

const THEME_SHAPES: Record<Exclude<DecorativeTheme, "none">, DecoShape[]> = {
  geometric: [
    { type: "circle", x: "82%", y: "18%", size: 140, depth: 0.15, opacity: 0.12 },
    { type: "square", x: "12%", y: "72%", size: 50, depth: 0.3, rotation: 20, opacity: 0.1 },
    { type: "line", x: "70%", y: "78%", size: 100, depth: 0.2, rotation: -15, opacity: 0.15 },
    { type: "circle", x: "18%", y: "25%", size: 30, depth: 0.4, opacity: 0.08 },
    { type: "square", x: "75%", y: "55%", size: 22, depth: 0.5, rotation: 45, opacity: 0.1 },
  ],
  "minimal-dots": [
    { type: "dot", x: "15%", y: "20%", size: 6, depth: 0.2, opacity: 0.2 },
    { type: "dot", x: "85%", y: "30%", size: 4, depth: 0.35, opacity: 0.15 },
    { type: "dot", x: "78%", y: "75%", size: 8, depth: 0.15, opacity: 0.12 },
    { type: "dot", x: "25%", y: "80%", size: 5, depth: 0.4, opacity: 0.18 },
    { type: "dot", x: "50%", y: "12%", size: 3, depth: 0.5, opacity: 0.1 },
    { type: "dot", x: "10%", y: "55%", size: 7, depth: 0.25, opacity: 0.14 },
    { type: "dot", x: "92%", y: "55%", size: 5, depth: 0.3, opacity: 0.12 },
    { type: "dot", x: "60%", y: "90%", size: 4, depth: 0.45, opacity: 0.08 },
  ],
  "light-streaks": [
    { type: "streak", x: "0%", y: "30%", size: 300, depth: 0.1, rotation: 25, opacity: 0.06 },
    { type: "streak", x: "40%", y: "60%", size: 250, depth: 0.2, rotation: 25, opacity: 0.04 },
    { type: "streak", x: "70%", y: "10%", size: 200, depth: 0.15, rotation: 25, opacity: 0.05 },
  ],
  "corner-accents": [
    { type: "bracket", x: "4%", y: "4%", size: 40, depth: 0.1, rotation: 0, opacity: 0.2 },
    { type: "bracket", x: "88%", y: "82%", size: 40, depth: 0.1, rotation: 180, opacity: 0.2 },
  ],
  confetti: [
    { type: "dot", x: "10%", y: "18%", size: 10, depth: 0.55, opacity: 0.16 },
    { type: "dot", x: "20%", y: "82%", size: 12, depth: 0.45, opacity: 0.14 },
    { type: "dot", x: "86%", y: "22%", size: 9, depth: 0.50, opacity: 0.14 },
    { type: "dot", x: "78%", y: "78%", size: 11, depth: 0.40, opacity: 0.12 },
    { type: "circle", x: "8%", y: "55%", size: 22, depth: 0.35, opacity: 0.10 },
    { type: "circle", x: "92%", y: "55%", size: 18, depth: 0.35, opacity: 0.10 },
    { type: "line", x: "15%", y: "35%", size: 70, depth: 0.55, rotation: -20, opacity: 0.14 },
    { type: "line", x: "82%", y: "40%", size: 60, depth: 0.50, rotation: 25, opacity: 0.12 },
    { type: "line", x: "25%", y: "65%", size: 65, depth: 0.45, rotation: 15, opacity: 0.12 },
    { type: "line", x: "74%", y: "70%", size: 80, depth: 0.55, rotation: -15, opacity: 0.14 },
    { type: "square", x: "35%", y: "14%", size: 14, depth: 0.60, rotation: 30, opacity: 0.12 },
    { type: "square", x: "62%", y: "86%", size: 16, depth: 0.55, rotation: -25, opacity: 0.12 },
    { type: "dot", x: "50%", y: "10%", size: 8, depth: 0.65, opacity: 0.12 },
    { type: "dot", x: "48%", y: "90%", size: 8, depth: 0.65, opacity: 0.12 },
    { type: "dot", x: "4%", y: "40%", size: 7, depth: 0.70, opacity: 0.10 },
    { type: "dot", x: "96%", y: "42%", size: 7, depth: 0.70, opacity: 0.10 },
  ],
};

// ── Shape Renderers ─────────────────────────────────────────────────────

function renderShape(
  shape: DecoShape,
  index: number,
  accentColor: string,
  fadeOpacity: number,
  parallaxX: number,
  rotationOffset: number,
  scaleMultiplier: number,
): React.ReactNode {
  const opacity = (shape.opacity ?? 0.1) * fadeOpacity;
  const s = Math.round(shape.size * scaleMultiplier);
  const rot = (shape.rotation ?? 0) + rotationOffset;
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: shape.x,
    top: shape.y,
    opacity,
    transform: `translateX(${parallaxX}px) rotate(${rot}deg)`,
    pointerEvents: "none",
  };

  switch (shape.type) {
    case "circle":
      return (
        <div
          key={`deco-${index}`}
          style={{
            ...baseStyle,
            width: s,
            height: s,
            borderRadius: "50%",
            border: `1.5px solid ${accentColor}`,
          }}
        />
      );
    case "square":
      return (
        <div
          key={`deco-${index}`}
          style={{
            ...baseStyle,
            width: s,
            height: s,
            border: `1.5px solid ${accentColor}`,
            borderRadius: 2,
          }}
        />
      );
    case "dot":
      return (
        <div
          key={`deco-${index}`}
          style={{
            ...baseStyle,
            width: s,
            height: s,
            borderRadius: "50%",
            backgroundColor: accentColor,
          }}
        />
      );
    case "line":
      return (
        <div
          key={`deco-${index}`}
          style={{
            ...baseStyle,
            width: s,
            height: 1.5,
            backgroundColor: accentColor,
          }}
        />
      );
    case "streak":
      return (
        <div
          key={`deco-${index}`}
          style={{
            ...baseStyle,
            width: s,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          }}
        />
      );
    case "bracket": {
      const arm = Math.round(s * 0.6);
      const thickness = 2;
      return (
        <div key={`deco-${index}`} style={{ ...baseStyle, width: s, height: s }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: arm,
              height: thickness,
              backgroundColor: accentColor,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: thickness,
              height: arm,
              backgroundColor: accentColor,
            }}
          />
        </div>
      );
    }
    default:
      return null;
  }
}

// ── DecorativeLayer Component ───────────────────────────────────────────

interface DecorativeLayerProps {
  theme: DecorativeTheme;
  accentColor: string;
  frame: number;
  totalFrames: number;
}

/**
 * Renders deterministic decorative elements between Background and content.
 * Elements fade in during first 25% of total duration and have subtle
 * continuous motion (drift + gentle rotation) throughout.
 */
export const DecorativeLayer: React.FC<DecorativeLayerProps> = ({
  theme,
  accentColor,
  frame,
  totalFrames,
}) => {
  if (theme === "none") return null;

  const shapes = THEME_SHAPES[theme];
  if (!shapes) return null;

  // Fade in during first 25%
  const fadeEnd = Math.round(totalFrames * 0.25);
  const fadeOpacity = interpolate(frame, [0, fadeEnd], [0, 1], CLAMP);

  const fullRange: FrameRange = { startFrame: 0, endFrame: totalFrames };

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {shapes.map((shape, i) => {
        // Each shape gets unique drift/rotation based on its depth
        const drift = driftX(frame, fullRange, 10 * shape.depth, 140 + i * 30);
        const rot = gentleRotate(frame, fullRange, 2 * shape.depth, 180 + i * 40);

        return renderShape(
          shape,
          i,
          accentColor,
          fadeOpacity,
          drift.x,
          rot.rotation,
          1,
        );
      })}
    </AbsoluteFill>
  );
};
