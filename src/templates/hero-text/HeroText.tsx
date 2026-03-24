import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import {
  phaseFrames,
  fadeIn,
  slideUp,
  scalePop,
  blurReveal,
  typewriter,
  fadeOut,
  highlightReveal,
  underlineDraw,
  choreograph,
} from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveEffects } from "../../primitives/useEffects";
import { resolveSecondaryMotion } from "../../primitives/useSecondaryMotion";
import { DecorativeLayer } from "../../primitives/DecorativeLayer";
import type { HeroTextProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

function applyEntrance(
  frame: number,
  preset: string,
  startFrame: number,
  endFrame: number,
  textLength: number
): { opacity: number; scale: number; y: number; x: number; blur: number; chars: number } {
  const range = { startFrame, endFrame };
  const result = { opacity: 1, scale: 1, y: 0, x: 0, blur: 0, chars: textLength };

  if (preset === "fade-in") {
    const f = fadeIn(frame, range);
    result.opacity = f.opacity;
  } else if (preset === "slide-up") {
    const s = slideUp(frame, range, 50);
    result.opacity = s.opacity;
    result.y = s.y;
  } else if (preset === "scale-pop") {
    const p = scalePop(frame, range, 1.15);
    result.opacity = p.opacity;
    result.scale = p.scale;
  } else if (preset === "blur-reveal") {
    const b = blurReveal(frame, range, 12);
    result.opacity = b.opacity;
    result.scale = b.scale;
    result.blur = b.blur;
  } else if (preset === "typewriter") {
    result.chars = typewriter(frame, range, textLength);
    result.opacity = 1;
  }

  return result;
}

export const HeroText: React.FC<HeroTextProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, scale } = useResponsiveConfig();

  // ── Resolve creative enhancement fields ────────────────────────────────
  const resolved = resolveStylePreset(
    props.stylePreset,
    props.typography,
    props.motionStyle,
    props.effects,
  );
  const typo = resolveTypography(resolved.typography);
  const fx = resolveEffects(resolved.effects, props.accentColor);

  // ── Adaptive phase timing ──────────────────────────────────────────────
  const phases = phaseFrames(props.duration, props.pacingProfile);

  // ── Choreographed entrance sequencing ──────────────────────────────────
  const entranceDur = phases.entrance.endFrame;
  const seq = choreograph(0, [
    { id: "decoration", startOffset: 0, duration: Math.round(entranceDur * 0.5) },
    { id: "headline", startOffset: Math.round(entranceDur * 0.1), duration: Math.round(entranceDur * 0.9) },
    { id: "subtitle", startOffset: Math.round(entranceDur * 0.4), duration: Math.round(entranceDur * 0.7) },
  ]);

  const headlineRange = seq.get("headline")!;
  const subtitleRange = seq.get("subtitle")!;
  const decoRange = seq.get("decoration")!;

  // ── Headline entrance ──────────────────────────────────────────────────
  const h = applyEntrance(frame, props.entranceAnimation, headlineRange.startFrame, headlineRange.endFrame, props.headline.length);

  // ── Subheadline entrance ───────────────────────────────────────────────
  const sub = props.subheadline
    ? applyEntrance(frame, props.subheadlineAnimation, subtitleRange.startFrame, subtitleRange.endFrame, props.subheadline.length)
    : null;

  // ── Exit fade ──────────────────────────────────────────────────────────
  const exitOpacity = interpolate(frame, [phases.exit.startFrame, phases.exit.endFrame], [1, 0], CLAMP);
  const exitBlur = fx.blurTransition
    ? interpolate(frame, [phases.exit.startFrame, phases.exit.endFrame], [0, 8], CLAMP)
    : 0;

  // ── Secondary motion during main phase ─────────────────────────────────
  const secondaryM = resolveSecondaryMotion(frame, phases.main, props.secondaryMotion);

  // ── Decoration animation ───────────────────────────────────────────────
  const decoProgress =
    props.decoration === "underline"
      ? underlineDraw(frame, decoRange)
      : props.decoration === "highlight-box"
        ? highlightReveal(frame, decoRange)
        : 0;

  // ── Layout computation ─────────────────────────────────────────────────
  const isLeft = props.style === "left-aligned";
  const isSplit = props.style === "split";
  const textAlign = isLeft || isSplit ? "left" : "center";
  const containerLeft = isLeft ? "12%" : isSplit ? "8%" : "50%";
  const containerTransform = isLeft || isSplit ? "translateY(-50%)" : "translate(-50%, -50%)";
  const maxWidth = isSplit ? "55%" : "85%";

  const rawFontSize = props.headline.length > 40 ? 56 : props.headline.length > 20 ? 72 : 96;
  const fontSizeMultiplier = props.fontSize === "medium" ? 0.75 : props.fontSize === "xlarge" ? 1.3 : 1;
  const baseFontSize = Math.round(rawFontSize * scale * fontSizeMultiplier);
  const fontWeightValue = typo.fontWeight ?? (props.fontWeight === "normal" ? 400 : props.fontWeight === "black" ? 900 : 700);
  const subFontSize = Math.round(baseFontSize * 0.4);
  const headlineWidth = baseFontSize * 0.6 * props.headline.length;

  const headlineText =
    props.entranceAnimation === "typewriter"
      ? props.headline.slice(0, h.chars)
      : props.headline;

  const accentColor = props.accentColor ?? props.headlineColor;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} frame={frame} />

      {/* Decorative depth layer */}
      <DecorativeLayer
        theme={props.decorativeTheme ?? "none"}
        accentColor={accentColor}
        frame={frame}
        totalFrames={phases.total}
      />

      {/* Content container */}
      <div
        style={{
          position: "absolute",
          left: containerLeft,
          top: "50%",
          transform: `${containerTransform} translateY(${secondaryM.y}px) translateX(${secondaryM.x}px) scale(${secondaryM.scale}) rotate(${secondaryM.rotation}deg)`,
          maxWidth,
          textAlign: textAlign as React.CSSProperties["textAlign"],
          opacity: exitOpacity,
          boxShadow: fx.boxShadow,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : (fx.glowFilter !== "none" ? fx.glowFilter : undefined),
        }}
      >
        {/* Headline */}
        <div
          style={{
            position: "relative",
            display: "inline-block",
            opacity: h.opacity,
            transform: "translateY(" + h.y + "px) scale(" + h.scale + ")",
            filter: h.blur > 0 ? "blur(" + h.blur + "px)" : "none",
          }}
        >
          {props.decoration === "highlight-box" && (
            <div
              style={{
                position: "absolute",
                left: textAlign === "center" ? "50%" : "0",
                top: "50%",
                transform:
                  textAlign === "center"
                    ? "translate(-50%, -50%) scaleX(" + decoProgress + ")"
                    : "translateY(-50%) scaleX(" + decoProgress + ")",
                transformOrigin: "0% 50%",
                width: Math.min(headlineWidth + 32, width * 0.85) + "px",
                height: baseFontSize + 24 + "px",
                backgroundColor: accentColor,
                opacity: 0.2,
                borderRadius: "8px",
              }}
            />
          )}

          <span
            style={{
              fontSize: baseFontSize + "px",
              fontWeight: fontWeightValue,
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.headlineColor,
              lineHeight: typo.lineHeight ?? 1.1,
              letterSpacing: typo.letterSpacing ?? "-0.02em",
              whiteSpace: "pre-wrap",
              position: "relative",
              zIndex: 1,
            }}
          >
            {headlineText}
          </span>

          {props.decoration === "underline" && (
            <div
              style={{
                position: "absolute",
                bottom: "-8px",
                left: textAlign === "center" ? "50%" : "0",
                transform: textAlign === "center" ? "translateX(-50%)" : "none",
                width: (decoProgress / 100) * Math.min(headlineWidth, width * 0.75) + "px",
                height: "4px",
                backgroundColor: accentColor,
                borderRadius: "2px",
              }}
            />
          )}

          {props.decoration === "accent-line" && (
            <div
              style={{
                position: "absolute",
                top: "-16px",
                left: textAlign === "center" ? "50%" : "0",
                transform: textAlign === "center" ? "translateX(-50%)" : "none",
                width: "60px",
                height: "4px",
                backgroundColor: accentColor,
                borderRadius: "2px",
                opacity: interpolate(frame, [decoRange.startFrame, decoRange.endFrame], [0, 1], CLAMP),
              }}
            />
          )}
        </div>

        {/* Subheadline */}
        {sub && props.subheadline && (
          <div
            style={{
              marginTop: Math.round(baseFontSize * 0.35) + "px",
              opacity: sub.opacity,
              transform: "translateY(" + sub.y + "px) scale(" + sub.scale + ")",
              filter: sub.blur > 0 ? "blur(" + sub.blur + "px)" : "none",
            }}
          >
            <span
              style={{
                fontSize: subFontSize + "px",
                fontWeight: typo.fontWeight ?? 400,
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                color: props.subheadlineColor,
                lineHeight: typo.lineHeight ?? 1.4,
                letterSpacing: typo.letterSpacing ?? "0.01em",
              }}
            >
              {props.subheadline}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
