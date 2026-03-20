import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import {
  secToFrame,
  fadeIn,
  fadeOut,
  slideUp,
  clipReveal,
  clipExit,
  microFloat,
} from "../../primitives/animations";
import type { ClipDirection } from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveEffects } from "../../primitives/useEffects";
import type { MaskedTextRevealProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const MASK_MAP: Record<string, ClipDirection> = {
  "wipe-left": "left",
  "wipe-right": "right",
  "circle-expand": "circle",
  "diagonal-slice": "diagonal",
  "vertical-split": "center-h",
  "horizontal-split": "center-v",
};

const FONT_SIZE_MAP: Record<string, number> = {
  medium: 56,
  large: 80,
  xlarge: 110,
};

export const MaskedTextReveal: React.FC<MaskedTextRevealProps> = (props) => {
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
  const motion = resolveMotionStyle(resolved.motionStyle);
  const fx = resolveEffects(resolved.effects, props.accentColor ?? undefined);

  const totalFrames = secToFrame(props.duration);

  // ── Phase timing ───────────────────────────────────────────────────────
  const revealStart = Math.round(totalFrames * 0.05);
  const revealEnd = Math.round(totalFrames * 0.35 * motion.durationMultiplier);
  const subStart = Math.round(totalFrames * 0.35);
  const subEnd = Math.round(totalFrames * 0.47);
  const tagStart = Math.round(totalFrames * 0.45);
  const tagEnd = Math.round(totalFrames * 0.55);
  const exitStart = Math.round(totalFrames * 0.82);
  const exitEnd = totalFrames;

  // ── Mask reveal ────────────────────────────────────────────────────────
  const clipDir = MASK_MAP[props.maskShape] || "left";
  const reveal = clipReveal(frame, { startFrame: revealStart, endFrame: revealEnd }, clipDir);

  // ── Accent line along mask edge ────────────────────────────────────────
  const accentProgress = interpolate(frame, [revealStart, revealEnd], [0, 1], CLAMP);
  const accentOpacity = interpolate(
    frame,
    [revealStart, revealEnd, revealEnd + 10],
    [0.8, 0.8, 0],
    CLAMP
  );

  // ── Subheadline entrance ───────────────────────────────────────────────
  const sub = props.subheadline
    ? slideUp(frame, { startFrame: subStart, endFrame: subEnd }, 30)
    : null;

  // ── Tagline entrance ───────────────────────────────────────────────────
  const tag = props.tagline
    ? fadeIn(frame, { startFrame: tagStart, endFrame: tagEnd })
    : null;

  // ── Exit ───────────────────────────────────────────────────────────────
  let exitStyle: React.CSSProperties = {};
  if (props.exitStyle === "reverse-mask") {
    const exit = clipExit(frame, { startFrame: exitStart, endFrame: exitEnd }, clipDir);
    exitStyle = { clipPath: exit.clipPath, WebkitClipPath: exit.clipPath };
  } else {
    const exit = fadeOut(frame, { startFrame: exitStart, endFrame: exitEnd });
    exitStyle = { opacity: exit.opacity };
  }

  // ── MicroFloat & exit blur ─────────────────────────────────────────────
  const entranceEnd = revealEnd;
  const isMainPhase = frame >= entranceEnd && frame < exitStart;
  const floatY = motion.microMotionEnabled && isMainPhase ? microFloat(frame).y : 0;

  const exitBlur = fx.blurTransition
    ? interpolate(frame, [exitStart, exitEnd], [0, 8], CLAMP)
    : 0;

  // ── Font sizing ────────────────────────────────────────────────────────
  const baseFontSize = Math.round((FONT_SIZE_MAP[props.fontSize] || 80) * scale);
  const subFontSize = Math.round(baseFontSize * 0.35);
  const tagFontSize = Math.round(baseFontSize * 0.22);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} />

      {/* Main content container with exit animation */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateY(${floatY}px)`,
          boxShadow: fx.boxShadow,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
          ...exitStyle,
        }}
      >
        {/* Headline with mask reveal */}
        <div
          style={{
            clipPath: reveal.clipPath,
            WebkitClipPath: reveal.clipPath,
            maxWidth: "85%",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: baseFontSize + "px",
              fontWeight: typo.fontWeight ?? "bold",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.headlineColor,
              lineHeight: typo.lineHeight ?? 1.1,
              letterSpacing: typo.letterSpacing ?? "-0.02em",
            }}
          >
            {props.headline}
          </span>
        </div>

        {/* Accent line that follows the mask edge */}
        {(props.maskShape === "wipe-left" || props.maskShape === "wipe-right") && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              left: props.maskShape === "wipe-left"
                ? accentProgress * width * 0.85 + "px"
                : (1 - accentProgress) * width * 0.85 + width * 0.075 + "px",
              width: "3px",
              height: baseFontSize * 1.8 + "px",
              backgroundColor: props.accentColor,
              opacity: accentOpacity,
              boxShadow: `0 0 20px ${props.accentColor}60`,
            }}
          />
        )}

        {/* Subheadline */}
        {sub && props.subheadline && (
          <div
            style={{
              marginTop: Math.round(baseFontSize * 0.3) + "px",
              opacity: sub.opacity,
              transform: `translateY(${sub.y}px)`,
              maxWidth: "70%",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: subFontSize + "px",
                fontWeight: typo.fontWeight ?? "normal",
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                color: props.subheadlineColor,
                lineHeight: typo.lineHeight ?? 1.4,
              }}
            >
              {props.subheadline}
            </span>
          </div>
        )}

        {/* Tagline */}
        {tag && props.tagline && (
          <div
            style={{
              marginTop: Math.round(baseFontSize * 0.2) + "px",
              opacity: tag.opacity,
              maxWidth: "60%",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: tagFontSize + "px",
                fontWeight: typo.fontWeight ?? "normal",
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                color: props.accentColor,
                letterSpacing: typo.letterSpacing ?? "0.15em",
                textTransform: "uppercase",
              }}
            >
              {props.tagline}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
