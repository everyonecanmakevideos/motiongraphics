import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background } from "../../primitives/Background";
import type { LoadingScreenProps } from "./schema";
import { phaseFrames } from "../../primitives/animations";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveEffects } from "../../primitives/useEffects";
import { DecorativeLayer } from "../../primitives/DecorativeLayer";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

function dotOpacity(frame: number, index: number): number {
  // 12-frame loop, each dot is slightly phase-shifted.
  const loop = 12;
  const phase = (frame + index * 2) % loop;
  // 0→1→0 pulse
  if (phase < loop / 2) {
    return interpolate(phase, [0, loop / 2], [0.25, 1], CLAMP);
  }
  return interpolate(phase, [loop / 2, loop], [1, 0.25], CLAMP);
}

export const LoadingScreen: React.FC<LoadingScreenProps> = (props) => {
  const frame = useCurrentFrame();
  const { scale, width } = useResponsiveConfig();

  const resolved = resolveStylePreset(
    props.stylePreset,
    props.typography,
    props.motionStyle,
    props.effects,
  );
  const typo = resolveTypography(resolved.typography);
  const fx = resolveEffects(resolved.effects, props.accentColor);

  const phases = phaseFrames(props.duration, props.pacingProfile);

  const dotSize =
    props.size === "small" ? Math.round(6 * scale) : props.size === "large" ? Math.round(10 * scale) : Math.round(8 * scale);

  const dotCount = Math.min(5, Math.max(3, props.dotCount));

  const isDots = props.dotStyle === "three-dots";

  const barProgress = (frame % 30) / 30;
  const barW = Math.round((width * 0.22) * barProgress);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} frame={frame} />
      <DecorativeLayer
        theme={props.decorativeTheme ?? "none"}
        accentColor={props.accentColor}
        frame={frame}
        totalFrames={phases.total}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "86%",
          maxWidth: 920 * scale,
          textAlign: "center",
          color: props.textColor,
          opacity: interpolate(frame, [0, Math.max(1, phases.entrance.endFrame)], [0, 1], CLAMP),
          filter: fx.glowFilter !== "none" ? fx.glowFilter : undefined,
          boxShadow: fx.boxShadow,
          borderRadius: Math.round(24 * scale),
          padding: Math.round(26 * scale),
          background: "rgba(0,0,0,0.10)",
        }}
      >
        <div
          style={{
            fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
            fontWeight: typo.fontWeight ?? 700,
            letterSpacing: typo.letterSpacing ?? "normal",
            lineHeight: typo.lineHeight ?? 1.2,
            fontSize: Math.round(44 * scale),
          }}
        >
          {props.text}
        </div>

        {props.subtext && (
          <div
            style={{
              marginTop: Math.round(10 * scale),
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              fontWeight: typo.fontWeight ?? 600,
              letterSpacing: typo.letterSpacing ?? "normal",
              lineHeight: 1.2,
              fontSize: Math.round(18 * scale),
              color: props.subtextColor,
              opacity: 0.95,
            }}
          >
            {props.subtext}
          </div>
        )}

        <div
          style={{
            marginTop: Math.round(22 * scale),
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: Math.round(10 * scale),
          }}
        >
          {isDots ? (
            Array.from({ length: dotCount }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: 9999,
                  backgroundColor: props.accentColor,
                  boxShadow: `0 0 ${Math.round(16 * scale)}px ${props.accentColor}66`,
                  opacity: dotOpacity(frame, i),
                }}
              />
            ))
          ) : (
            <div
              style={{
                width: Math.round(width * 0.22),
                height: Math.round(10 * scale),
                borderRadius: 9999,
                background: "rgba(255,255,255,0.10)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: barW,
                  background: props.accentColor,
                  boxShadow: `0 0 ${Math.round(18 * scale)}px ${props.accentColor}AA`,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

