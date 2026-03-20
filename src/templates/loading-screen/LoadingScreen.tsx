import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { phaseFrames, fadeIn, fadeOut } from "../../primitives/animations";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveEffects } from "../../primitives/useEffects";
import { resolveSecondaryMotion } from "../../primitives/useSecondaryMotion";
import { DecorativeLayer } from "../../primitives/DecorativeLayer";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { LoadingScreenProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const LoadingScreen: React.FC<LoadingScreenProps> = (props) => {
  const frame = useCurrentFrame();
  const { scale } = useResponsiveConfig();

  const resolved = resolveStylePreset(
    props.stylePreset,
    props.typography,
    props.motionStyle,
    props.effects,
  );
  const typo = resolveTypography(resolved.typography);
  const fx = resolveEffects(resolved.effects, props.accentColor);

  const phases = phaseFrames(props.duration, props.pacingProfile);
  const enter = fadeIn(frame, phases.entrance);
  const exit = fadeOut(frame, phases.exit);
  const opacity = enter.opacity * exit.opacity;

  const secondaryM = resolveSecondaryMotion(frame, phases.main, props.secondaryMotion);

  const base =
    props.size === "small" ? 32 :
    props.size === "large" ? 56 :
    44;

  const fontSize = Math.round(base * scale);
  const subSize = Math.round(fontSize * 0.55);

  // Functional feedback: dots that cycle opacity.
  const count = Math.max(3, Math.min(5, Math.round(props.dotCount)));
  const dotPeriod = 18; // frames
  const active = Math.floor(frame / dotPeriod) % count;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} frame={frame} />

      <DecorativeLayer
        theme={props.decorativeTheme ?? "none"}
        accentColor={props.accentColor}
        frame={frame}
        totalFrames={phases.total}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity,
          transform: `translateY(${secondaryM.y}px) translateX(${secondaryM.x}px) scale(${secondaryM.scale}) rotate(${secondaryM.rotation}deg)`,
          filter: fx.glowFilter !== "none" ? fx.glowFilter : undefined,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              fontWeight: typo.fontWeight ?? 500,
              letterSpacing: typo.letterSpacing ?? "0.02em",
              lineHeight: typo.lineHeight ?? 1.15,
              fontSize: `${fontSize}px`,
              color: props.textColor,
              textTransform: "lowercase",
              opacity: interpolate(frame, [phases.entrance.startFrame, phases.entrance.endFrame], [0, 1], CLAMP),
            }}
          >
            {props.text}
          </div>

          {props.dotStyle === "three-dots" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: Math.round(10 * scale),
                marginTop: Math.round(18 * scale),
              }}
            >
              {new Array(count).fill(0).map((_, i) => {
                const o = i === active ? 1 : 0.25;
                const s = i === active ? 1 : 0.92;
                return (
                  <div
                    key={i}
                    style={{
                      width: Math.round(8 * scale),
                      height: Math.round(8 * scale),
                      borderRadius: 9999,
                      backgroundColor: props.accentColor,
                      opacity: o,
                      transform: `scale(${s})`,
                      boxShadow: fx.boxShadow !== "none" ? `0 0 ${Math.round(18 * scale)}px ${props.accentColor}55` : undefined,
                    }}
                  />
                );
              })}
            </div>
          )}

          {props.dotStyle === "bar" && (
            <div
              style={{
                width: Math.round(180 * scale),
                height: Math.round(6 * scale),
                borderRadius: 9999,
                backgroundColor: "#FFFFFF10",
                overflow: "hidden",
                margin: `${Math.round(18 * scale)}px auto 0`,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(frame % 60) / 60 * 100}%`,
                  background: `linear-gradient(90deg, transparent, ${props.accentColor}, transparent)`,
                }}
              />
            </div>
          )}

          {props.subtext && (
            <div
              style={{
                marginTop: Math.round(18 * scale),
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                fontWeight: 400,
                letterSpacing: "0.02em",
                fontSize: `${subSize}px`,
                color: props.subtextColor,
                opacity: 0.9,
              }}
            >
              {props.subtext}
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

