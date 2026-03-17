import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import {
  secToFrame,
  fadeIn,
  slideUp,
  scalePop,
  blurReveal,
  typewriter,
  fadeOut,
  highlightReveal,
  underlineDraw,
} from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
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
  // "none" leaves defaults

  return result;
}

export const HeroText: React.FC<HeroTextProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, scale } = useResponsiveConfig();
  const totalFrames = secToFrame(props.duration);

  // ── Phase timing ───────────────────────────────────────────────────────
  const entranceEnd = Math.round(totalFrames * 0.25);
  const subStart = Math.round(totalFrames * 0.15);
  const subEnd = Math.round(totalFrames * 0.4);
  const exitStart = Math.round(totalFrames * 0.82);
  const exitEnd = totalFrames;

  // ── Headline entrance ──────────────────────────────────────────────────
  const h = applyEntrance(frame, props.entranceAnimation, 0, entranceEnd, props.headline.length);

  // ── Subheadline entrance ───────────────────────────────────────────────
  const sub = props.subheadline
    ? applyEntrance(frame, props.subheadlineAnimation, subStart, subEnd, props.subheadline.length)
    : null;

  // ── Exit fade ──────────────────────────────────────────────────────────
  const exitOpacity = interpolate(frame, [exitStart, exitEnd], [1, 0], CLAMP);

  // ── Decoration ─────────────────────────────────────────────────────────
  const decoStart = entranceEnd;
  const decoEnd = Math.round(entranceEnd + totalFrames * 0.12);
  const decoRange = { startFrame: decoStart, endFrame: decoEnd };
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

  // Font sizing: scale down for longer headlines, adapt to aspect ratio
  const rawFontSize = props.headline.length > 40 ? 56 : props.headline.length > 20 ? 72 : 96;
  const baseFontSize = Math.round(rawFontSize * scale);
  const subFontSize = Math.round(baseFontSize * 0.4);

  // Estimated headline width for decoration
  const headlineWidth = baseFontSize * 0.6 * props.headline.length;

  const headlineText =
    props.entranceAnimation === "typewriter"
      ? props.headline.slice(0, h.chars)
      : props.headline;

  const subText = props.subheadline;

  const accentColor = props.accentColor ?? props.headlineColor;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} />

      {/* Content container */}
      <div
        style={{
          position: "absolute",
          left: containerLeft,
          top: "50%",
          transform: containerTransform,
          maxWidth,
          textAlign: textAlign as React.CSSProperties["textAlign"],
          opacity: exitOpacity,
        }}
      >
        {/* Headline */}
        <div
          style={{
            position: "relative",
            display: "inline-block",
            opacity: h.opacity,
            transform:
              "translateY(" + h.y + "px) scale(" + h.scale + ")",
            filter: h.blur > 0 ? "blur(" + h.blur + "px)" : "none",
          }}
        >
          {/* Highlight box decoration (behind text) */}
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
              fontWeight: "bold",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: props.headlineColor,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              whiteSpace: "pre-wrap",
              position: "relative",
              zIndex: 1,
            }}
          >
            {headlineText}
          </span>

          {/* Underline decoration */}
          {props.decoration === "underline" && (
            <div
              style={{
                position: "absolute",
                bottom: "-8px",
                left: textAlign === "center" ? "50%" : "0",
                transform:
                  textAlign === "center"
                    ? "translateX(-50%)"
                    : "none",
                width: (decoProgress / 100) * Math.min(headlineWidth, width * 0.75) + "px",
                height: "4px",
                backgroundColor: accentColor,
                borderRadius: "2px",
              }}
            />
          )}

          {/* Accent line decoration */}
          {props.decoration === "accent-line" && (
            <div
              style={{
                position: "absolute",
                top: "-16px",
                left: textAlign === "center" ? "50%" : "0",
                transform:
                  textAlign === "center"
                    ? "translateX(-50%)"
                    : "none",
                width: "60px",
                height: "4px",
                backgroundColor: accentColor,
                borderRadius: "2px",
                opacity: interpolate(frame, [decoStart, decoEnd], [0, 1], CLAMP),
              }}
            />
          )}
        </div>

        {/* Subheadline */}
        {sub && subText && (
          <div
            style={{
              marginTop: Math.round(baseFontSize * 0.35) + "px",
              opacity: sub.opacity,
              transform:
                "translateY(" + sub.y + "px) scale(" + sub.scale + ")",
              filter: sub.blur > 0 ? "blur(" + sub.blur + "px)" : "none",
            }}
          >
            <span
              style={{
                fontSize: subFontSize + "px",
                fontWeight: "normal",
                fontFamily: "Arial, Helvetica, sans-serif",
                color: props.subheadlineColor,
                lineHeight: 1.4,
                letterSpacing: "0.01em",
              }}
            >
              {subText}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
