import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import {
  secToFrame,
  fadeIn,
  slideUp,
  scalePop,
  staggerDelay,
  microFloat,
  adaptiveEntranceWindow,
} from "../../primitives/animations";
import { Asset } from "../../assets/Asset";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveEffects } from "../../primitives/useEffects";
import type { FeatureHighlightProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const FeatureHighlight: React.FC<FeatureHighlightProps> = (props) => {
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
  const motion = resolveMotionStyle(resolved.motionStyle);
  const fx = resolveEffects(resolved.effects, props.accentColor ?? undefined);

  const totalFrames = secToFrame(props.duration);

  const primaryWindow = adaptiveEntranceWindow(props.duration, totalFrames, motion.durationMultiplier, {
    startPct: 0.04,
    minSec: 1.5,
    maxSec: 3.5,
    maxEndPct: 0.68,
  });
  const iconEnd = Math.round(primaryWindow.startFrame + (primaryWindow.endFrame - primaryWindow.startFrame) * 0.38);
  const titleStart = Math.round(primaryWindow.startFrame + (primaryWindow.endFrame - primaryWindow.startFrame) * 0.06);
  const titleEnd = Math.round(primaryWindow.startFrame + (primaryWindow.endFrame - primaryWindow.startFrame) * 0.5);
  const descStart = Math.round(primaryWindow.startFrame + (primaryWindow.endFrame - primaryWindow.startFrame) * 0.28);
  const descEnd = Math.round(primaryWindow.startFrame + (primaryWindow.endFrame - primaryWindow.startFrame) * 0.7);
  const bulletsStart = Math.round(primaryWindow.startFrame + (primaryWindow.endFrame - primaryWindow.startFrame) * 0.42);
  const bulletsDuration = Math.max(1, Math.round((primaryWindow.endFrame - primaryWindow.startFrame) * 0.58));
  const exitStart = Math.round(totalFrames * 0.85);
  const exitEnd = totalFrames;

  const exitOpacity = interpolate(frame, [exitStart, exitEnd], [1, 0], CLAMP);
  const exitBlur = fx.blurTransition
    ? interpolate(frame, [exitStart, exitEnd], [0, 8], CLAMP)
    : 0;

  const entranceEnd = bulletsStart + bulletsDuration;
  const isMainPhase = frame >= entranceEnd && frame < exitStart;
  const floatY = motion.microMotionEnabled && isMainPhase ? microFloat(frame).y : 0;

  // Icon animation
  let iconOpacity = 1;
  let iconScale = 1;
  let iconY = 0;
  if (props.entranceAnimation === "fade-in") {
    iconOpacity = fadeIn(frame, { startFrame: 0, endFrame: iconEnd }).opacity;
  } else if (props.entranceAnimation === "slide-up") {
    const s = slideUp(frame, { startFrame: 0, endFrame: iconEnd }, 40);
    iconOpacity = s.opacity;
    iconY = s.y;
  } else if (props.entranceAnimation === "scale-pop") {
    const p = scalePop(frame, { startFrame: 0, endFrame: iconEnd }, 1.2);
    iconOpacity = p.opacity;
    iconScale = p.scale;
  }

  // Title animation
  let titleOpacity = 1;
  let titleY = 0;
  if (props.entranceAnimation !== "none") {
    titleOpacity = interpolate(frame, [titleStart, titleEnd], [0, 1], CLAMP);
    titleY = interpolate(frame, [titleStart, titleEnd], [20, 0], CLAMP);
  }

  // Description animation
  let descOpacity = 1;
  let descY = 0;
  if (props.entranceAnimation !== "none" && props.description) {
    descOpacity = interpolate(frame, [descStart, descEnd], [0, 1], CLAMP);
    descY = interpolate(frame, [descStart, descEnd], [15, 0], CLAMP);
  }

  const isHorizontal = !isPortrait && (props.layout === "icon-left" || props.layout === "icon-right");
  const isRight = props.layout === "icon-right";

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translateY(${floatY}px)`,
          display: "flex",
          flexDirection: isHorizontal ? (isRight ? "row-reverse" : "row") : "column",
          alignItems: isHorizontal ? "flex-start" : "center",
          gap: isHorizontal ? Math.round(60 * scale) + "px" : "24px",
          maxWidth: "80%",
          opacity: exitOpacity,
          boxShadow: fx.boxShadow,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        {/* Icon */}
        <div
          style={{
            opacity: iconOpacity,
            transform: `translateY(${iconY}px) scale(${iconScale})`,
            flexShrink: 0,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {props.iconBackground && (
            <div
              style={{
                position: "absolute",
                width: 180,
                height: 180,
                borderRadius: "50%",
                backgroundColor: props.iconBackground + "26",
              }}
            />
          )}
          <Asset
            id={props.iconId}
            width={120}
            height={120}
            color={props.iconColor}
          />
        </div>

        {/* Text content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: isHorizontal ? "flex-start" : "center",
            textAlign: isHorizontal ? "left" : "center",
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: Math.round(44 * scale) + "px",
              fontWeight: typo.fontWeight ?? "bold",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.titleColor,
              lineHeight: typo.lineHeight ?? 1.1,
              letterSpacing: typo.letterSpacing ?? undefined,
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
            }}
          >
            {props.title}
          </div>

          {/* Description */}
          {props.description && (
            <div
              style={{
                fontSize: "24px",
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                color: props.descriptionColor,
                lineHeight: typo.lineHeight ?? 1.4,
                letterSpacing: typo.letterSpacing ?? undefined,
                marginTop: "16px",
                maxWidth: Math.round(width * 0.55) + "px",
                opacity: descOpacity,
                transform: `translateY(${descY}px)`,
              }}
            >
              {props.description}
            </div>
          )}

          {/* Bullet points */}
          {props.bulletPoints && props.bulletPoints.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              {props.bulletPoints.map((point, i) => {
                const stagger = staggerDelay(i, props.bulletPoints!.length, bulletsDuration);
                const range = {
                  startFrame: bulletsStart + stagger.startFrame,
                  endFrame: bulletsStart + stagger.endFrame,
                };

                let bOpacity = 1;
                let bY = 0;
                if (props.entranceAnimation !== "none") {
                  bOpacity = fadeIn(frame, range).opacity;
                  bY = interpolate(frame, [range.startFrame, range.endFrame], [15, 0], CLAMP);
                }

                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "12px",
                      padding: "6px 0",
                      opacity: bOpacity,
                      transform: `translateY(${bY}px)`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        color: props.accentColor,
                        flexShrink: 0,
                      }}
                    >
                      {"\u25CF"}
                    </span>
                    <span
                      style={{
                        fontSize: "22px",
                        fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                        color: props.bulletColor,
                        lineHeight: typo.lineHeight ?? 1.3,
                        letterSpacing: typo.letterSpacing ?? undefined,
                      }}
                    >
                      {point}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
