import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import {
  phaseFrames,
  fadeIn,
  slideUp,
  slideLeft,
  slideRight,
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
import type { NewsAlertProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

function applyEntrance(
  frame: number,
  preset: string,
  range: { startFrame: number; endFrame: number },
): { opacity: number; x: number; y: number; scale: number; blur: number } {
  if (preset === "none") return { opacity: 1, x: 0, y: 0, scale: 1, blur: 0 };

  const dur = range.endFrame - range.startFrame;
  if (dur <= 0) return { opacity: 1, x: 0, y: 0, scale: 1, blur: 0 };

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
  if (preset === "slide-right") {
    const s = slideRight(frame, range, 70);
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

export const NewsAlert: React.FC<NewsAlertProps> = (props) => {
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

  const exitOpacity = interpolate(frame, [phases.exit.startFrame, phases.exit.endFrame], [1, 0], CLAMP);
  const entranceDur = phases.entrance.endFrame;

  const seq = choreograph(0, [
    { id: "banner", startOffset: 0, duration: Math.round(entranceDur * 0.65) },
    { id: "headline", startOffset: Math.round(entranceDur * 0.18), duration: Math.round(entranceDur * 0.9) },
    { id: "badge", startOffset: Math.round(entranceDur * 0.25), duration: Math.round(entranceDur * 0.75) },
  ]);

  const bannerRange = seq.get("banner")!;
  const headlineRange = seq.get("headline")!;
  const badgeRange = seq.get("badge")!;

  const bannerE = applyEntrance(frame, props.entranceAnimation, bannerRange);
  const headlineE = applyEntrance(frame, props.entranceAnimation, headlineRange);
  const badgeE = applyEntrance(frame, props.entranceAnimation, badgeRange);

  // Secondary motion gives the "broadcast energy" during main phase
  const secondaryM = resolveSecondaryMotion(frame, phases.main, props.secondaryMotion);

  // Typography tuned for the “broadcast banner” composition (wide, punchy headline)
  const isShort = props.headline.trim().length <= 16;
  const rawFontSize = isShort ? 96 : props.headline.length > 40 ? 56 : props.headline.length > 22 ? 72 : 84;
  const fontSize = Math.round(rawFontSize * scale);
  const fontWeightValue = isShort ? 900 : typo.fontWeight ?? 800;
  const letterSpacing = typo.letterSpacing ?? "-0.03em";

  const bannerHeight = Math.round(135 * scale);
  const bannerWidth = Math.round(width * 0.96);
  const bannerRadius = Math.round(22 * scale);

  // Animated highlight sweep (typical TV alert cue)
  const sweepT = interpolate(frame, [bannerRange.startFrame, bannerRange.endFrame], [0, 1], CLAMP);
  const sweepOpacity = interpolate(
    frame,
    [bannerRange.startFrame, bannerRange.startFrame + Math.max(1, Math.round(entranceDur * 0.15)), bannerRange.endFrame],
    [0, 0.85, 0],
    CLAMP,
  );

  // LIVE blink: toggles opacity during main animation
  const blink = frame % 12 < 6 ? 1 : 0.35;

  const headlineOpacity = headlineE.opacity * exitOpacity;
  const bannerOpacity = bannerE.opacity * exitOpacity;
  const badgeOpacity = badgeE.opacity * exitOpacity * blink;

  const accent = props.accentColor;
  const accentSoft = `${accent}33`;
  const accentGlow = fx.glowFilter !== "none" ? fx.glowFilter : `drop-shadow(0 0 18px ${accent}66)`;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} frame={frame} />

      <DecorativeLayer
        theme={props.decorativeTheme ?? "none"}
        accentColor={accent}
        frame={frame}
        totalFrames={phases.total}
      />

      {/* Centered broadcast banner composition */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translateX(${secondaryM.x + bannerE.x}px) translateY(${secondaryM.y + bannerE.y}px) scale(${secondaryM.scale * bannerE.scale}) rotate(${secondaryM.rotation}deg)`,
          opacity: bannerOpacity,
          width: bannerWidth,
          height: bannerHeight,
          filter: bannerE.blur > 0 ? `blur(${bannerE.blur}px)` : undefined,
        }}
      >
        {/* Banner base */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: bannerRadius,
            background: `linear-gradient(180deg, ${accent} 0%, ${accent}D0 60%, ${accent}B0 100%)`,
            boxShadow: fx.boxShadow,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Inner edge highlight */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              right: 0,
              height: Math.max(3, Math.round(10 * scale)),
              background: `linear-gradient(90deg, transparent, ${accentSoft}, transparent)`,
              opacity: 0.9,
            }}
          />

          {/* Glow sweep */}
          <div
            style={{
              position: "absolute",
              top: "-20%",
              bottom: "-20%",
              width: "42%",
              left: `${Math.round(-20 + sweepT * 140)}%`,
              transform: "skewX(-20deg)",
              background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)`,
              opacity: sweepOpacity,
              filter: accentGlow,
            }}
          />

          {/* LIVE badge */}
          {props.showLiveBadge && (
            <div
              style={{
                position: "absolute",
                right: Math.round(18 * scale),
                top: Math.round(18 * scale),
                padding: `${Math.round(8 * scale)}px ${Math.round(14 * scale)}px`,
                borderRadius: Math.round(9999 * scale),
                background: "#0B0B0F",
                border: `2px solid ${accent}`,
                color: "#FFFFFF",
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                fontWeight: 900,
                letterSpacing,
                fontSize: Math.round(18 * scale),
                opacity: badgeOpacity,
                transform: `translateX(${badgeE.x}px) translateY(${badgeE.y}px) scale(${badgeE.scale})`,
                filter: badgeE.blur > 0 ? `blur(${badgeE.blur}px)` : undefined,
                display: "flex",
                alignItems: "center",
                gap: Math.round(8 * scale),
              }}
            >
              <span
                style={{
                  width: Math.round(8 * scale),
                  height: Math.round(8 * scale),
                  borderRadius: 9999,
                  background: accent,
                  boxShadow: `0 0 ${Math.round(18 * scale)}px ${accent}`,
                }}
              />
              {props.badgeText}
            </div>
          )}

          {/* Headline */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: Math.round(34 * scale),
              paddingRight: Math.round(34 * scale),
            }}
          >
            <div
              style={{
                textAlign: "center",
                opacity: headlineOpacity,
                transform: `translateX(${headlineE.x}px) translateY(${headlineE.y}px) scale(${headlineE.scale})`,
                filter: headlineE.blur > 0 ? `blur(${headlineE.blur}px)` : undefined,
              }}
            >
              <span
                style={{
                  fontSize,
                  fontWeight: fontWeightValue,
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: props.headlineColor,
                  lineHeight: typo.lineHeight ?? 1.02,
                  letterSpacing,
                  textTransform: "uppercase",
                  whiteSpace: "pre-wrap",
                }}
              >
                {props.headline}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

