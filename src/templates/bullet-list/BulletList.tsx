import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, slideUp, scalePop, staggerDelay, microFloat } from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveEffects } from "../../primitives/useEffects";
import type { BulletListProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const BULLET_MARKERS: Record<string, (index: number) => string> = {
  dot: () => "\u2022",
  checkmark: () => "\u2713",
  number: (i) => `${i + 1}.`,
  dash: () => "\u2014",
  arrow: () => "\u25B6",
};

export const BulletList: React.FC<BulletListProps> = (props) => {
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
  const fx = resolveEffects(resolved.effects);

  const totalFrames = secToFrame(props.duration);

  const titleEnd = Math.round(totalFrames * 0.15 * motion.durationMultiplier);
  const itemsStart = Math.round(totalFrames * 0.1);
  const itemsDuration = Math.round(totalFrames * 0.5 * motion.durationMultiplier);
  const exitStart = Math.round(totalFrames * 0.85);
  const exitEnd = totalFrames;

  const exitOpacity = interpolate(frame, [exitStart, exitEnd], [1, 0], CLAMP);
  const exitBlur = fx.blurTransition
    ? interpolate(frame, [exitStart, exitEnd], [0, 8], CLAMP)
    : 0;

  const entranceEnd = itemsStart + itemsDuration;
  const isMainPhase = frame >= entranceEnd && frame < exitStart;
  const floatY = motion.microMotionEnabled && isMainPhase ? microFloat(frame).y : 0;

  // Title animation
  let titleOpacity = 1;
  let titleY = 0;
  if (props.title && props.entranceAnimation !== "none") {
    titleOpacity = interpolate(frame, [0, titleEnd], [0, 1], CLAMP);
    titleY = interpolate(frame, [0, titleEnd], [20, 0], CLAMP);
  }

  const getMarker = BULLET_MARKERS[props.bulletStyle] ?? BULLET_MARKERS.dot;

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
          flexDirection: "column",
          maxWidth: Math.round(width * 0.85) + "px",
          width: "80%",
          opacity: exitOpacity,
          boxShadow: fx.boxShadow,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        {/* Title */}
        {props.title && (
          <div
            style={{
              fontSize: Math.round(48 * scale) + "px",
              fontWeight: typo.fontWeight ?? "bold",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.titleColor,
              letterSpacing: typo.letterSpacing ?? undefined,
              marginBottom: "40px",
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
            }}
          >
            {props.title}
          </div>
        )}

        {/* Bullet items */}
        {props.items.map((item, i) => {
          const stagger = staggerDelay(i, props.items.length, itemsDuration);
          const range = {
            startFrame: itemsStart + stagger.startFrame,
            endFrame: itemsStart + stagger.endFrame,
          };

          let itemOpacity = 1;
          let itemY = 0;
          let itemScale = 1;

          if (props.entranceAnimation === "fade-in") {
            itemOpacity = fadeIn(frame, range).opacity;
          } else if (props.entranceAnimation === "slide-up") {
            const s = slideUp(frame, range, 30);
            itemOpacity = s.opacity;
            itemY = s.y;
          } else if (props.entranceAnimation === "scale-pop") {
            const p = scalePop(frame, range);
            itemOpacity = p.opacity;
            itemScale = p.scale;
          }

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "16px",
                padding: (props.spacing === "tight" ? 6 : props.spacing === "relaxed" ? 20 : 12) + "px 0",
                opacity: itemOpacity,
                transform: `translateY(${itemY}px) scale(${itemScale})`,
              }}
            >
              <span
                style={{
                  fontSize: Math.round(28 * scale) + "px",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: props.bulletColor,
                  fontWeight: typo.fontWeight ?? "bold",
                  flexShrink: 0,
                  minWidth: props.bulletStyle === "number" ? "36px" : "20px",
                }}
              >
                {getMarker(i)}
              </span>
              <span
                style={{
                  fontSize: Math.round(30 * scale) + "px",
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: props.textColor,
                  lineHeight: typo.lineHeight ?? 1.4,
                  letterSpacing: typo.letterSpacing ?? undefined,
                }}
              >
                {item}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
