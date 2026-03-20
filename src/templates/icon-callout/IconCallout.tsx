import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, slideUp, scalePop, microFloat } from "../../primitives/animations";
import { Asset } from "../../assets/Asset";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveEffects } from "../../primitives/useEffects";
import type { IconCalloutProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const IconCallout: React.FC<IconCalloutProps> = (props) => {
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

  // Phase timing
  const iconEnd = Math.round(totalFrames * 0.2 * motion.durationMultiplier);
  const textStart = Math.round(totalFrames * 0.12);
  const textEnd = Math.round(totalFrames * 0.35 * motion.durationMultiplier);
  const descStart = Math.round(totalFrames * 0.22);
  const descEnd = Math.round(totalFrames * 0.42 * motion.durationMultiplier);
  const exitStart = Math.round(totalFrames * 0.85);
  const exitEnd = totalFrames;

  const exitOpacity = interpolate(frame, [exitStart, exitEnd], [1, 0], CLAMP);
  const exitBlur = fx.blurTransition
    ? interpolate(frame, [exitStart, exitEnd], [0, 8], CLAMP)
    : 0;

  const entranceEnd = descEnd;
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

  // Text animation
  let textOpacity = 1;
  let textY = 0;
  if (props.entranceAnimation !== "none") {
    textOpacity = interpolate(frame, [textStart, textEnd], [0, 1], CLAMP);
    textY = interpolate(frame, [textStart, textEnd], [20, 0], CLAMP);
  }

  // Description animation
  let descOpacity = 1;
  let descY = 0;
  if (props.entranceAnimation !== "none") {
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
          alignItems: "center",
          gap: isHorizontal ? "50px" : "24px",
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
            transform: "translateY(" + iconY + "px) scale(" + iconScale + ")",
            flexShrink: 0,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {props.accentColor && (
            <div
              style={{
                position: "absolute",
                width: props.iconSize * 1.5,
                height: props.iconSize * 1.5,
                borderRadius: "50%",
                backgroundColor: props.accentColor + "26",
              }}
            />
          )}
          <Asset
            id={props.iconId}
            width={props.iconSize}
            height={props.iconSize}
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
          <div
            style={{
              fontSize: Math.round(56 * scale) + "px",
              fontWeight: typo.fontWeight ?? "bold",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.headlineColor,
              lineHeight: typo.lineHeight ?? 1.1,
              letterSpacing: typo.letterSpacing ?? undefined,
              opacity: textOpacity,
              transform: "translateY(" + textY + "px)",
            }}
          >
            {props.headline}
          </div>

          {props.description && (
            <div
              style={{
                fontSize: Math.round(26 * scale) + "px",
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                color: props.descriptionColor,
                lineHeight: typo.lineHeight ?? 1.4,
                letterSpacing: typo.letterSpacing ?? undefined,
                marginTop: "16px",
                maxWidth: Math.round(width * 0.55) + "px",
                opacity: descOpacity,
                transform: "translateY(" + descY + "px)",
              }}
            >
              {props.description}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
