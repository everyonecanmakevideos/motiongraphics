import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, scalePop, microFloat } from "../../primitives/animations";
import { Asset } from "../../assets/Asset";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveEffects } from "../../primitives/useEffects";
import type { SplitScreenProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const SplitScreen: React.FC<SplitScreenProps> = (props) => {
  const frame = useCurrentFrame();
  const { isPortrait, scale } = useResponsiveConfig();

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

  const entrEnd = Math.round(totalFrames * 0.25 * motion.durationMultiplier);
  const dividerStart = Math.round(totalFrames * 0.15);
  const dividerEnd = Math.round(totalFrames * 0.3 * motion.durationMultiplier);
  const exitStart = Math.round(totalFrames * 0.85);
  const exitEnd = totalFrames;

  const exitOpacity = interpolate(frame, [exitStart, exitEnd], [1, 0], CLAMP);
  const exitBlur = fx.blurTransition
    ? interpolate(frame, [exitStart, exitEnd], [0, 8], CLAMP)
    : 0;

  const isMainPhase = frame >= dividerEnd && frame < exitStart;
  const floatY = motion.microMotionEnabled && isMainPhase ? microFloat(frame).y : 0;

  // Panel animations
  const getPanelAnimation = (side: "left" | "right") => {
    let opacity = 1;
    let x = 0;
    let scale = 1;

    if (props.entranceAnimation === "fade-in") {
      opacity = fadeIn(frame, { startFrame: 0, endFrame: entrEnd }).opacity;
    } else if (props.entranceAnimation === "slide-in") {
      const offset = side === "left" ? -80 : 80;
      x = interpolate(frame, [0, entrEnd], [offset, 0], CLAMP);
      opacity = interpolate(frame, [0, entrEnd], [0, 1], CLAMP);
    } else if (props.entranceAnimation === "scale-pop") {
      const p = scalePop(frame, { startFrame: 0, endFrame: entrEnd }, 1.1);
      opacity = p.opacity;
      scale = p.scale;
    }

    return { opacity, x, scale };
  };

  const leftAnim = getPanelAnimation("left");
  const rightAnim = getPanelAnimation("right");

  // Divider animation
  const dividerOpacity = props.dividerStyle === "line"
    ? interpolate(frame, [dividerStart, dividerEnd], [0, 1], CLAMP)
    : 0;

  // Balance flex values
  const leftFlex = props.balance === "left-heavy" ? 3 : props.balance === "right-heavy" ? 2 : 1;
  const rightFlex = props.balance === "left-heavy" ? 2 : props.balance === "right-heavy" ? 3 : 1;

  const renderPanel = (
    side: { title: string; body?: string; iconId?: string },
    accentColor: string,
    anim: { opacity: number; x: number; scale: number },
    flex: number
  ) => (
    <div
      style={{
        flex,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: Math.round(60 * scale) + "px " + Math.round(50 * scale) + "px",
        opacity: anim.opacity,
        transform: `translateX(${anim.x}px) scale(${anim.scale})`,
      }}
    >
      {/* Accent bar at top */}
      <div
        style={{
          width: "60px",
          height: "4px",
          backgroundColor: accentColor,
          marginBottom: "32px",
        }}
      />

      {/* Icon */}
      {side.iconId && (
        <div style={{ marginBottom: "24px" }}>
          <Asset
            id={side.iconId}
            width={80}
            height={80}
            color={props.iconColor}
          />
        </div>
      )}

      {/* Title */}
      <div
        style={{
          fontSize: Math.round(40 * scale) + "px",
          fontWeight: typo.fontWeight ?? "bold",
          fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
          color: props.titleColor,
          textAlign: "center",
          lineHeight: typo.lineHeight ?? 1.2,
          letterSpacing: typo.letterSpacing ?? undefined,
          marginBottom: "16px",
        }}
      >
        {side.title}
      </div>

      {/* Body */}
      {side.body && (
        <div
          style={{
            fontSize: Math.round(22 * scale) + "px",
            fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
            color: props.bodyColor,
            textAlign: "center",
            lineHeight: typo.lineHeight ?? 1.5,
            letterSpacing: typo.letterSpacing ?? undefined,
            maxWidth: Math.round(400 * scale) + "px",
          }}
        >
          {side.body}
        </div>
      )}
    </div>
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: isPortrait ? "column" : "row",
          opacity: exitOpacity,
          transform: `translateY(${floatY}px)`,
          boxShadow: fx.boxShadow,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        {/* Left panel */}
        {renderPanel(props.left, props.leftAccentColor, leftAnim, leftFlex)}

        {/* Divider */}
        {props.dividerStyle === "line" && (
          <div
            style={{
              width: isPortrait ? "60%" : "2px",
              alignSelf: "center",
              height: isPortrait ? "2px" : "60%",
              backgroundColor: props.dividerColor,
              opacity: dividerOpacity,
              flexShrink: 0,
            }}
          />
        )}
        {props.dividerStyle === "gap" && (
          <div style={{ width: isPortrait ? undefined : "40px", height: isPortrait ? "40px" : undefined, flexShrink: 0 }} />
        )}

        {/* Right panel */}
        {renderPanel(props.right, props.rightAccentColor, rightAnim, rightFlex)}
      </div>
    </AbsoluteFill>
  );
};
