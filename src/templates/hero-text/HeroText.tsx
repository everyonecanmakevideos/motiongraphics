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

function hash01(n: number): number {
  // Deterministic 0..1 pseudo-random from frame-like integer.
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

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
  const { width, isPortrait, scale } = useResponsiveConfig();

  // ── Resolve creative enhancement fields ────────────────────────────────
  const resolved = resolveStylePreset(
    props.stylePreset,
    props.typography,
    props.motionStyle,
    props.effects,
  );
  const typo = resolveTypography(resolved.typography);
  const fx = resolveEffects(resolved.effects, props.accentColor);
  const accentColor = props.accentColor ?? props.headlineColor;
  const isShortSlogan = props.headline.trim().length <= 14;

  // If the LLM didn't specify effects/polish, apply a small premium fallback
  // for single-element “slogan” videos (helps match benchmark-like outputs).
  let fxResolved = fx;
  if (isShortSlogan && fx.boxShadow === "none" && fx.glowFilter === "none") {
    fxResolved = {
      ...fx,
      boxShadow: "0 10px 50px rgba(0,0,0,0.65)",
      glowFilter: `drop-shadow(0 0 18px ${accentColor}66)`,
    };
  }

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
        : props.decoration === "pill-fill" || props.decoration === "pill-outline"
          ? highlightReveal(frame, decoRange)
          : 0;

  // ── Layout computation ─────────────────────────────────────────────────
  const isLeft = props.style === "left-aligned";
  const isSplit = props.style === "split";
  const textAlign = isLeft || isSplit ? "left" : "center";
  const containerLeft = isLeft ? "12%" : isSplit ? "8%" : "50%";
  const containerTransform = isLeft || isSplit ? "translateY(-50%)" : "translate(-50%, -50%)";
  const maxWidth = isSplit ? "55%" : "85%";

  // Principle: in 9:16, text must dominate unless explicitly constrained.
  const portraitBoost =
    isPortrait && props.style === "centered" && !props.subheadline && props.decoration === "none"
      ? 1.45
      : 1;

  const rawFontSize =
    (isShortSlogan ? 120 : props.headline.length > 40 ? 56 : props.headline.length > 20 ? 72 : 96) *
    portraitBoost;
  const fontSizeMultiplier = props.fontSize === "medium" ? 0.75 : props.fontSize === "xlarge" ? 1.3 : 1;
  const baseFontSize = Math.round(rawFontSize * scale * fontSizeMultiplier);
  const fontWeightValue =
    isShortSlogan
      ? 900
      : typo.fontWeight ?? (props.fontWeight === "normal" ? 400 : props.fontWeight === "black" ? 900 : 700);
  const subFontSize = Math.round(baseFontSize * 0.4);
  const headlineWidth = baseFontSize * 0.6 * props.headline.length;

  const headlineText =
    props.entranceAnimation === "typewriter"
      ? props.headline.slice(0, h.chars)
      : props.headline;

  const words = headlineText.split(/\s+/).filter(Boolean);
  const useSecondWordAccent = props.emphasisMode === "second-word-accent" && words.length >= 2;
  const firstWord = useSecondWordAccent ? words[0] : null;
  const secondWord = useSecondWordAccent ? words.slice(1).join(" ") : null;

  const glitchOn = props.textEffect === "glitch";
  const glitchGate = glitchOn ? (frame % 9 === 0 || frame % 11 === 0) : false;
  const glitchX = glitchOn ? Math.round((hash01(frame) - 0.5) * 18) : 0;
  const glitchY = glitchOn ? Math.round((hash01(frame + 99) - 0.5) * 10) : 0;
  const glitchSliceTop = glitchOn ? Math.round(30 + hash01(frame + 17) * 25) : 0;
  const glitchSliceHeight = glitchOn ? Math.round(16 + hash01(frame + 31) * 18) : 0;

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

      {/* Scanlines overlay (for glitch / broadcast / retro UI cues) */}
      {props.scanlines && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            opacity: interpolate(frame, [0, phases.entrance.endFrame], [0, 0.22], CLAMP) * exitOpacity,
            background:
              "repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 2px, transparent 6px)",
            mixBlendMode: "overlay",
          }}
        />
      )}

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
          // Avoid “card UI” for single-headline promos. Keep container shadow
          // only when there's supporting structure (subheadline/decoration/layout).
          boxShadow:
            props.subheadline || props.decoration !== "none" || props.style !== "centered"
              ? fxResolved.boxShadow
              : "none",
          filter:
            exitBlur > 0
              ? `blur(${exitBlur}px)`
              : fxResolved.glowFilter !== "none"
                ? fxResolved.glowFilter
                : undefined,
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

          {props.decoration === "pill-fill" && (
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
                width: Math.min(headlineWidth + 56, width * 0.9) + "px",
                height: baseFontSize + 36 + "px",
                backgroundColor: accentColor,
                opacity: 0.14,
                borderRadius: "9999px",
              }}
            />
          )}

          {props.decoration === "pill-outline" && (
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
                width: Math.min(headlineWidth + 56, width * 0.9) + "px",
                height: baseFontSize + 36 + "px",
                backgroundColor: "transparent",
                opacity: interpolate(frame, [decoRange.startFrame, decoRange.endFrame], [0, 1], CLAMP),
                borderRadius: "9999px",
                border: `3px solid ${accentColor}`,
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
            {glitchOn ? (
              <span style={{ position: "relative", display: "inline-block" }}>
                {/* Base text */}
                <span style={{ position: "relative", zIndex: 2 }}>
                  {useSecondWordAccent ? (
                    <>
                      <span style={{ color: props.headlineColor }}>{firstWord}</span>{" "}
                      <span style={{ color: accentColor }}>{secondWord}</span>
                    </>
                  ) : (
                    headlineText
                  )}
                </span>

                {/* RGB split layer */}
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    transform: `translate(${glitchX}px, ${glitchY}px)`,
                    color: "#00D4FF",
                    opacity: glitchGate ? 0.75 : 0.18,
                    mixBlendMode: "screen",
                    zIndex: 1,
                    textShadow: `0 0 18px ${accentColor}44`,
                    pointerEvents: "none",
                  }}
                >
                  {headlineText}
                </span>

                {/* Slice layer */}
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    transform: `translate(${-glitchX}px, ${-glitchY}px)`,
                    color: accentColor,
                    opacity: glitchGate ? 0.85 : 0,
                    zIndex: 3,
                    clipPath: `inset(${glitchSliceTop}px 0px ${Math.max(0, baseFontSize + 40 - (glitchSliceTop + glitchSliceHeight))}px 0px)`,
                    filter: `drop-shadow(0 0 18px ${accentColor}66)`,
                    pointerEvents: "none",
                  }}
                >
                  {headlineText}
                </span>
              </span>
            ) : useSecondWordAccent ? (
              <>
                <span style={{ color: props.headlineColor }}>{firstWord}</span>{" "}
                <span style={{ color: accentColor }}>{secondWord}</span>
              </>
            ) : (
              headlineText
            )}
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
