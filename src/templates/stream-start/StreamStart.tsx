import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import {
  phaseFrames,
  fadeIn,
  slideUp,
  slideLeft,
  scalePop,
  blurReveal,
  choreograph,
} from "../../primitives/animations";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveEffects } from "../../primitives/useEffects";
import { resolveSecondaryMotion } from "../../primitives/useSecondaryMotion";
import { DecorativeLayer } from "../../primitives/DecorativeLayer";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { StreamStartProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

function applyEntrance(
  frame: number,
  preset: string,
  range: { startFrame: number; endFrame: number },
): { opacity: number; x: number; y: number; scale: number; blur: number } {
  if (preset === "none") return { opacity: 1, x: 0, y: 0, scale: 1, blur: 0 };
  if (preset === "fade-in") {
    const f = fadeIn(frame, range);
    return { opacity: f.opacity, x: 0, y: 0, scale: f.scale, blur: 0 };
  }
  if (preset === "slide-up") {
    const s = slideUp(frame, range, 50);
    return { opacity: s.opacity, x: 0, y: s.y, scale: 1, blur: 0 };
  }
  if (preset === "slide-left") {
    const s = slideLeft(frame, range, 70);
    return { opacity: s.opacity, x: s.x, y: 0, scale: 1, blur: 0 };
  }
  if (preset === "scale-pop") {
    const p = scalePop(frame, range, 1.12);
    return { opacity: p.opacity, x: 0, y: 0, scale: p.scale, blur: 0 };
  }
  if (preset === "blur-reveal") {
    const b = blurReveal(frame, range, 10);
    return { opacity: b.opacity, x: 0, y: 0, scale: b.scale, blur: b.blur };
  }
  return { opacity: 1, x: 0, y: 0, scale: 1, blur: 0 };
}

export const StreamStart: React.FC<StreamStartProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, scale } = useResponsiveConfig();

  const resolved = resolveStylePreset(
    props.stylePreset,
    props.typography,
    props.motionStyle,
    props.effects,
  );
  const typo = resolveTypography(resolved.typography);
  const fx = resolveEffects(resolved.effects, props.accentColor);

  const phases = phaseFrames(props.duration, props.pacingProfile);

  const entranceDur = phases.entrance.endFrame;
  const seq = choreograph(0, [
    { id: "badge", startOffset: 0, duration: Math.round(entranceDur * 0.55) },
    { id: "headline", startOffset: Math.round(entranceDur * 0.12), duration: Math.round(entranceDur * 0.9) },
  ]);

  const badgeRange = seq.get("badge")!;
  const headlineRange = seq.get("headline")!;
  const badgeE = applyEntrance(frame, props.entranceAnimation, badgeRange);
  const headlineE = applyEntrance(frame, props.entranceAnimation, headlineRange);

  const exitOpacity = interpolate(frame, [phases.exit.startFrame, phases.exit.endFrame], [1, 0], CLAMP);
  const secondaryM = resolveSecondaryMotion(frame, phases.main, props.secondaryMotion);

  const words = props.headline.split(/\s+/).filter(Boolean);
  const liveIdx = words.findIndex((w) => w.toLowerCase() === "live");

  const fontSize =
    Math.round(
      (props.headline.length > 24 ? 110 : props.headline.length > 16 ? 130 : 150) * scale
    );

  // Badge pulse reads “functional” like streaming UIs.
  const pulse = 1 + (frame % 30) / 30 * 0.06;
  const badgeOpacity = (frame % 20 < 10 ? 1 : 0.65) * exitOpacity * badgeE.opacity;

  // Scanlines/flicker: subtle, not noisy.
  const flicker =
    props.flicker
      ? 0.92 + (frame % 17 < 1 ? 0.08 : 0) + (frame % 53 < 1 ? 0.12 : 0)
      : 1;

  const scanOpacity =
    props.scanlines
      ? interpolate(frame, [0, phases.entrance.endFrame], [0, 0.22], CLAMP) * exitOpacity
      : 0;

  const accent = props.accentColor;
  const liveGlow =
    props.glowOnLiveWord
      ? `drop-shadow(0 0 ${Math.round(20 * scale)}px ${accent}88) drop-shadow(0 0 ${Math.round(50 * scale)}px ${accent}44)`
      : "none";

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ opacity: flicker }}>
        <Background config={props.background} frame={frame} />
      </div>

      <DecorativeLayer
        theme={props.decorativeTheme ?? "none"}
        accentColor={accent}
        frame={frame}
        totalFrames={phases.total}
      />

      {/* Scanlines overlay */}
      {props.scanlines && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            opacity: scanOpacity,
            background:
              "repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 2px, transparent 6px)",
            mixBlendMode: "overlay",
          }}
        />
      )}

      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: exitOpacity,
          transform: `translateY(${secondaryM.y}px) translateX(${secondaryM.x}px) scale(${secondaryM.scale}) rotate(${secondaryM.rotation}deg)`,
          filter: fx.glowFilter !== "none" ? fx.glowFilter : undefined,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "92%" }}>
          {props.showLiveBadge && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: Math.round(10 * scale),
                padding: `${Math.round(10 * scale)}px ${Math.round(18 * scale)}px`,
                borderRadius: 9999,
                backgroundColor: "#0B0B0F",
                border: `2px solid ${accent}`,
                color: "#FFFFFF",
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                fontWeight: 900,
                letterSpacing: typo.letterSpacing ?? "0.02em",
                fontSize: Math.round(20 * scale),
                opacity: badgeOpacity,
                transform: `translateX(${badgeE.x}px) translateY(${badgeE.y}px) scale(${badgeE.scale * pulse})`,
                boxShadow: fx.boxShadow !== "none" ? fx.boxShadow : `0 0 ${Math.round(18 * scale)}px ${accent}44`,
              }}
            >
              <span
                style={{
                  width: Math.round(10 * scale),
                  height: Math.round(10 * scale),
                  borderRadius: 9999,
                  backgroundColor: accent,
                  boxShadow: `0 0 ${Math.round(20 * scale)}px ${accent}`,
                }}
              />
              {props.badgeText}
            </div>
          )}

          <div
            style={{
              marginTop: Math.round(30 * scale),
              opacity: headlineE.opacity,
              transform: `translateX(${headlineE.x}px) translateY(${headlineE.y}px) scale(${headlineE.scale})`,
              filter: headlineE.blur > 0 ? `blur(${headlineE.blur}px)` : undefined,
            }}
          >
            <span
              style={{
                fontSize: `${fontSize}px`,
                fontWeight: 900,
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                color: props.headlineColor,
                letterSpacing: typo.letterSpacing ?? "-0.03em",
                lineHeight: typo.lineHeight ?? 1.0,
                textTransform: "uppercase",
                whiteSpace: "pre-wrap",
              }}
            >
              {words.map((w, i) => {
                const isLive = i === liveIdx;
                return (
                  <React.Fragment key={i}>
                    {i > 0 ? " " : ""}
                    <span
                      style={{
                        color: isLive ? accent : props.headlineColor,
                        filter: isLive ? liveGlow : undefined,
                      }}
                    >
                      {w}
                    </span>
                  </React.Fragment>
                );
              })}
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

