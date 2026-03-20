import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import {
  phaseFrames,
  fadeIn,
  slideUp,
  scalePop,
  blurReveal,
  underlineDraw,
  highlightReveal,
  choreograph,
} from "../../primitives/animations";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveEffects } from "../../primitives/useEffects";
import { resolveSecondaryMotion } from "../../primitives/useSecondaryMotion";
import { DecorativeLayer } from "../../primitives/DecorativeLayer";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { SectionTitleProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const SectionTitle: React.FC<SectionTitleProps> = (props) => {
  const frame = useCurrentFrame();
  const { scale } = useResponsiveConfig();

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
    { id: "accent", startOffset: 0, duration: Math.round(entranceDur * 0.6) },
    { id: "title", startOffset: Math.round(entranceDur * 0.1), duration: Math.round(entranceDur * 0.9) },
    { id: "subtitle", startOffset: Math.round(entranceDur * 0.4), duration: Math.round(entranceDur * 0.7) },
  ]);

  const accentRange = seq.get("accent")!;
  const titleRange = seq.get("title")!;
  const subtitleRange = seq.get("subtitle")!;

  const exitOpacity = interpolate(frame, [phases.exit.startFrame, phases.exit.endFrame], [1, 0], CLAMP);
  const exitBlur = fx.blurTransition
    ? interpolate(frame, [phases.exit.startFrame, phases.exit.endFrame], [0, 8], CLAMP)
    : 0;

  // ── Secondary motion during main phase ─────────────────────────────────
  const secondaryM = resolveSecondaryMotion(frame, phases.main, props.secondaryMotion);

  // Title entrance animation
  let titleOpacity = 1;
  let titleY = 0;
  let titleScale = 1;
  let titleBlur = 0;

  if (props.entranceAnimation === "fade-in") {
    titleOpacity = fadeIn(frame, titleRange).opacity;
  } else if (props.entranceAnimation === "slide-up") {
    const s = slideUp(frame, titleRange, 50);
    titleOpacity = s.opacity;
    titleY = s.y;
  } else if (props.entranceAnimation === "scale-pop") {
    const p = scalePop(frame, titleRange, 1.15);
    titleOpacity = p.opacity;
    titleScale = p.scale;
  } else if (props.entranceAnimation === "blur-reveal") {
    const b = blurReveal(frame, titleRange);
    titleOpacity = b.opacity;
    titleScale = b.scale;
    titleBlur = b.blur;
  }

  // Subtitle animation
  let subtitleOpacity = 1;
  let subtitleY = 0;
  if (props.entranceAnimation !== "none" && props.subtitle) {
    subtitleOpacity = interpolate(frame, [subtitleRange.startFrame, subtitleRange.endFrame], [0, 1], CLAMP);
    subtitleY = interpolate(frame, [subtitleRange.startFrame, subtitleRange.endFrame], [20, 0], CLAMP);
  }

  // Accent animation
  const accentProgress = props.accentStyle !== "none"
    ? (props.accentStyle === "dot"
      ? highlightReveal(frame, accentRange)
      : underlineDraw(frame, accentRange))
    : 1;

  const isLeft = props.alignment === "left";
  const fontSizeMultiplier = props.fontSize === "medium" ? 0.75 : props.fontSize === "xlarge" ? 1.3 : 1;
  const baseFontSize = Math.round((props.title.length > 40 ? 52 : props.title.length > 20 ? 64 : 80) * scale * fontSizeMultiplier);

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
          alignItems: isLeft ? "flex-start" : "center",
          textAlign: isLeft ? "left" : "center",
          maxWidth: "80%",
          opacity: exitOpacity,
          paddingLeft: isLeft ? Math.round(120 * scale) + "px" : undefined,
          boxShadow: fx.boxShadow,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        {props.accentStyle === "line-top" && (
          <div
            style={{
              width: `${accentProgress}%`,
              height: "4px",
              backgroundColor: props.accentColor,
              marginBottom: "24px",
              maxWidth: "120px",
            }}
          />
        )}

        {props.accentStyle === "dot" && (
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: props.accentColor,
              marginBottom: "20px",
              transform: `scale(${accentProgress})`,
              opacity: accentProgress,
            }}
          />
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {props.accentStyle === "line-left" && (
            <div
              style={{
                width: "4px",
                height: `${accentProgress}%`,
                maxHeight: "80px",
                backgroundColor: props.accentColor,
                flexShrink: 0,
              }}
            />
          )}

          <div
            style={{
              fontSize: `${baseFontSize}px`,
              fontWeight: typo.fontWeight ?? "bold",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.titleColor,
              lineHeight: typo.lineHeight ?? 1.1,
              letterSpacing: typo.letterSpacing ?? undefined,
              opacity: titleOpacity,
              transform: `translateY(${titleY}px) scale(${titleScale})`,
              filter: titleBlur > 0 ? `blur(${titleBlur}px)` : undefined,
            }}
          >
            {props.title}
          </div>
        </div>

        {props.accentStyle === "line-bottom" && (
          <div
            style={{
              width: `${accentProgress}%`,
              height: "4px",
              backgroundColor: props.accentColor,
              marginTop: "20px",
              maxWidth: "200px",
            }}
          />
        )}

        {props.subtitle && (
          <div
            style={{
              fontSize: Math.round(28 * scale) + "px",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.subtitleColor,
              lineHeight: typo.lineHeight ?? 1.4,
              marginTop: "20px",
              opacity: subtitleOpacity,
              transform: `translateY(${subtitleY}px)`,
            }}
          >
            {props.subtitle}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
