import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { Effects } from "../templates/types";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

function levelOpacity(level: "off" | "subtle" | "strong", subtle: number, strong: number): number {
  if (level === "subtle") return subtle;
  if (level === "strong") return strong;
  return 0;
}

export const PostFxLayer: React.FC<{
  effects?: Effects;
  opacity?: number;
}> = ({ effects, opacity = 1 }) => {
  const frame = useCurrentFrame();
  if (!effects) return null;

  const scanOpacity = levelOpacity(effects.scanlines, 0.18, 0.32) * opacity;
  const vignetteOpacity = levelOpacity(effects.vignette, 0.22, 0.42) * opacity;
  const caOpacity = levelOpacity(effects.chromaticAberration, 0.16, 0.28) * opacity;
  const shakeAmp = effects.shake === "subtle" ? 0.6 : effects.shake === "strong" ? 1.4 : 0;

  const microShakeX = shakeAmp > 0 ? (Math.sin(frame * 0.9) + Math.sin(frame * 2.1)) * shakeAmp : 0;
  const microShakeY = shakeAmp > 0 ? (Math.cos(frame * 0.7) + Math.sin(frame * 1.7)) * shakeAmp : 0;

  // Fade overlays in quickly so they don't pop on frame 0.
  const ramp = interpolate(frame, [0, 8], [0, 1], CLAMP);

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        transform: `translate(${microShakeX}px, ${microShakeY}px)`,
      }}
    >
      {/* Scanlines */}
      {effects.scanlines !== "off" && (
        <AbsoluteFill
          style={{
            opacity: scanOpacity * ramp,
            background:
              "repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 2px, transparent 6px)",
            mixBlendMode: "overlay",
          }}
        />
      )}

      {/* Vignette */}
      {effects.vignette !== "off" && (
        <AbsoluteFill
          style={{
            opacity: vignetteOpacity * ramp,
            background:
              "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)",
            mixBlendMode: "multiply",
          }}
        />
      )}

      {/* Chromatic aberration (lightweight): colored edge ghosts */}
      {effects.chromaticAberration !== "off" && (
        <>
          <AbsoluteFill
            style={{
              opacity: caOpacity * ramp,
              transform: "translateX(2px)",
              backgroundColor: "rgba(0, 212, 255, 0.06)",
              mixBlendMode: "screen",
            }}
          />
          <AbsoluteFill
            style={{
              opacity: caOpacity * ramp,
              transform: "translateX(-2px)",
              backgroundColor: "rgba(255, 0, 90, 0.05)",
              mixBlendMode: "screen",
            }}
          />
        </>
      )}
    </AbsoluteFill>
  );
};

