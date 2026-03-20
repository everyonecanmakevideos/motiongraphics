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
  choreograph,
} from "../../primitives/animations";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveEffects } from "../../primitives/useEffects";
import { resolveSecondaryMotion } from "../../primitives/useSecondaryMotion";
import { DecorativeLayer } from "../../primitives/DecorativeLayer";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { QuoteHighlightProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const QuoteHighlight: React.FC<QuoteHighlightProps> = (props) => {
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
  const fx = resolveEffects(resolved.effects, props.accentColor ?? undefined);

  // ── Adaptive phase timing ──────────────────────────────────────────────
  const phases = phaseFrames(props.duration, props.pacingProfile);

  // ── Choreographed entrance ─────────────────────────────────────────────
  const entranceDur = phases.entrance.endFrame;
  const seq = choreograph(0, [
    { id: "mark", startOffset: 0, duration: Math.round(entranceDur * 0.4) },
    { id: "quote", startOffset: Math.round(entranceDur * 0.1), duration: Math.round(entranceDur * 0.9) },
    { id: "attribution", startOffset: Math.round(entranceDur * 0.5), duration: Math.round(entranceDur * 0.6) },
  ]);

  const markRange = seq.get("mark")!;
  const quoteRange = seq.get("quote")!;
  const attrRange = seq.get("attribution")!;

  const exitOpacity = interpolate(frame, [phases.exit.startFrame, phases.exit.endFrame], [1, 0], CLAMP);
  const exitBlur = fx.blurTransition
    ? interpolate(frame, [phases.exit.startFrame, phases.exit.endFrame], [0, 8], CLAMP)
    : 0;

  // ── Secondary motion during main phase ─────────────────────────────────
  const secondaryM = resolveSecondaryMotion(frame, phases.main, props.secondaryMotion);

  // Quote mark animation
  const markOpacity = fadeIn(frame, markRange).opacity;

  // Quote text animation
  let quoteOpacity = 1;
  let quoteY = 0;
  let quoteScale = 1;
  let quoteBlur = 0;
  let visibleChars = props.quote.length;

  if (props.entranceAnimation === "fade-in") {
    quoteOpacity = fadeIn(frame, quoteRange).opacity;
  } else if (props.entranceAnimation === "slide-up") {
    const s = slideUp(frame, quoteRange, 40);
    quoteOpacity = s.opacity;
    quoteY = s.y;
  } else if (props.entranceAnimation === "scale-pop") {
    const p = scalePop(frame, quoteRange, 1.1);
    quoteOpacity = p.opacity;
    quoteScale = p.scale;
  } else if (props.entranceAnimation === "blur-reveal") {
    const b = blurReveal(frame, quoteRange);
    quoteOpacity = b.opacity;
    quoteScale = b.scale;
    quoteBlur = b.blur;
  } else if (props.entranceAnimation === "typewriter") {
    visibleChars = typewriter(frame, { startFrame: quoteRange.startFrame, endFrame: Math.round(phases.total * 0.6) }, props.quote.length);
    quoteOpacity = 1;
  }

  // Attribution animation
  let attrOpacity = 1;
  let attrY = 0;
  if (props.entranceAnimation !== "none") {
    attrOpacity = interpolate(frame, [attrRange.startFrame, attrRange.endFrame], [0, 1], CLAMP);
    attrY = interpolate(frame, [attrRange.startFrame, attrRange.endFrame], [15, 0], CLAMP);
  }

  const quoteFontFamily = typo.fontFamily ??
    (props.quoteStyle === "sans"
      ? "Arial, Helvetica, sans-serif"
      : "Georgia, 'Times New Roman', serif");
  const quoteFontStyle = props.quoteStyle === "italic" ? "italic" : undefined;
  const quoteFontSize = Math.round((props.quote.length > 200 ? 32 : props.quote.length > 100 ? 40 : 48) * scale);

  const displayedQuote = props.entranceAnimation === "typewriter"
    ? props.quote.slice(0, visibleChars)
    : props.quote;

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
          transform: `translate(-50%, -50%) translateY(${secondaryM.y}px) translateX(${secondaryM.x}px) scale(${secondaryM.scale}) rotate(${secondaryM.rotation}deg)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: Math.round(width * 0.85) + "px",
          width: "80%",
          opacity: exitOpacity,
          boxShadow: fx.boxShadow,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        {props.quoteMarkStyle === "large" && (
          <div
            style={{
              fontSize: Math.round(180 * scale) + "px",
              fontFamily: "Georgia, serif",
              color: props.accentColor,
              opacity: markOpacity * 0.3,
              lineHeight: 0.6,
              marginBottom: "-20px",
              userSelect: "none",
            }}
          >
            {"\u201C"}
          </div>
        )}

        {props.quoteMarkStyle === "bar" && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              width: "4px",
              height: "80%",
              backgroundColor: props.accentColor,
              opacity: markOpacity,
            }}
          />
        )}

        <div
          style={{
            fontSize: `${quoteFontSize}px`,
            fontFamily: quoteFontFamily,
            color: props.quoteColor,
            lineHeight: typo.lineHeight ?? 1.5,
            letterSpacing: typo.letterSpacing ?? undefined,
            fontStyle: quoteFontStyle,
            opacity: quoteOpacity,
            transform: `translateY(${quoteY}px) scale(${quoteScale})`,
            filter: quoteBlur > 0 ? `blur(${quoteBlur}px)` : undefined,
            paddingLeft: props.quoteMarkStyle === "bar" ? "40px" : undefined,
            textAlign: props.quoteMarkStyle === "bar" ? "left" : "center",
          }}
        >
          {props.quoteMarkStyle === "small" && (
            <span style={{ color: props.accentColor, opacity: markOpacity }}>{"\u201C"}</span>
          )}
          {displayedQuote}
          {props.quoteMarkStyle === "small" && visibleChars >= props.quote.length && (
            <span style={{ color: props.accentColor, opacity: markOpacity }}>{"\u201D"}</span>
          )}
        </div>

        {props.quoteMarkStyle === "large" && (
          <div
            style={{
              fontSize: Math.round(180 * scale) + "px",
              fontFamily: "Georgia, serif",
              color: props.accentColor,
              opacity: markOpacity * 0.3,
              lineHeight: 0.6,
              marginTop: "-10px",
              userSelect: "none",
            }}
          >
            {"\u201D"}
          </div>
        )}

        {props.attribution && (
          <div
            style={{
              marginTop: "32px",
              opacity: attrOpacity,
              transform: `translateY(${attrY}px)`,
            }}
          >
            <div
              style={{
                fontSize: Math.round(24 * scale) + "px",
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                color: props.attributionColor,
              }}
            >
              {"\u2014 "}{props.attribution}
            </div>
            {props.attributionTitle && (
              <div
                style={{
                  fontSize: Math.round(18 * scale) + "px",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: props.attributionColor,
                  opacity: 0.7,
                  marginTop: "6px",
                }}
              >
                {props.attributionTitle}
              </div>
            )}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
