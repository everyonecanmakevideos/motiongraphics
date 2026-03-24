import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import {
  secToFrame,
  fadeIn,
  slideUp,
  scalePop,
  microFloat,
  adaptiveEntranceWindow,
} from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveEffects } from "../../primitives/useEffects";
import type { BeforeAfterProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const BeforeAfter: React.FC<BeforeAfterProps> = (props) => {
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
  const fx = resolveEffects(resolved.effects, props.accentColor ?? undefined);

  const totalFrames = secToFrame(props.duration);
  const entranceWindow = adaptiveEntranceWindow(props.duration, totalFrames, motion.durationMultiplier, {
    startPct: 0.0,
    minSec: 1.2,
    maxSec: 3.6,
    maxEndPct: 0.72,
  });
  const entranceEnd = entranceWindow.endFrame;
  const exitStart = Math.round(totalFrames * 0.85);
  const exitEnd = totalFrames;
  const exitOpacity = interpolate(frame, [exitStart, exitEnd], [1, 0], CLAMP);

  const isMainPhase = frame >= entranceEnd && frame < exitStart;
  const floatY = motion.microMotionEnabled && isMainPhase ? microFloat(frame).y : 0;

  const exitBlur = fx.blurTransition
    ? interpolate(frame, [exitStart, exitEnd], [0, 8], CLAMP)
    : 0;

  if (props.revealStyle === "split") {
    return renderSplit(props, frame, totalFrames, exitOpacity, isPortrait, scale, typo, fx, floatY, exitBlur);
  }
  return renderOverlay(props, frame, totalFrames, exitOpacity, typo, fx, floatY, exitBlur);
};

function renderStateContent(
  label: string,
  title: string,
  items: string[] | undefined,
  accentColor: string,
  textColor: string,
  typo?: ReturnType<typeof resolveTypography>,
) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        maxWidth: "800px",
      }}
    >
      {/* Label badge */}
      <div
        style={{
          padding: "8px 24px",
          borderRadius: "20px",
          backgroundColor: accentColor + "30",
          border: `2px solid ${accentColor}`,
          marginBottom: "28px",
        }}
      >
        <span
          style={{
            fontSize: "18px",
            fontWeight: typo?.fontWeight ?? "bold",
            fontFamily: typo?.fontFamily ?? "Arial, Helvetica, sans-serif",
            color: textColor,
            textTransform: "uppercase",
            letterSpacing: typo?.letterSpacing ?? "2px",
          }}
        >
          {label}
        </span>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: "44px",
          fontWeight: typo?.fontWeight ?? "bold",
          fontFamily: typo?.fontFamily ?? "Arial, Helvetica, sans-serif",
          color: textColor,
          lineHeight: typo?.lineHeight ?? 1.2,
          marginBottom: items && items.length > 0 ? "28px" : undefined,
        }}
      >
        {title}
      </div>

      {/* Items */}
      {items && items.map((item, i) => (
        <div
          key={i}
          style={{
            fontSize: "22px",
            fontFamily: typo?.fontFamily ?? "Arial, Helvetica, sans-serif",
            color: textColor,
            opacity: 0.8,
            lineHeight: typo?.lineHeight ?? 1.5,
            padding: "4px 0",
          }}
        >
          {"\u2022 "}{item}
        </div>
      ))}
    </div>
  );
}

function renderOverlay(
  props: BeforeAfterProps,
  frame: number,
  totalFrames: number,
  exitOpacity: number,
  typo: ReturnType<typeof resolveTypography>,
  fx: ReturnType<typeof resolveEffects>,
  floatY: number,
  exitBlur: number,
) {
  const entrWindow = adaptiveEntranceWindow(props.duration, totalFrames, 1, {
    startPct: 0.0,
    minSec: 1.0,
    maxSec: 2.8,
    maxEndPct: 0.5,
  });
  const entrEnd = entrWindow.endFrame;
  const revealStart = Math.round(totalFrames * 0.38);
  const revealEnd = Math.max(revealStart + Math.round(totalFrames * 0.18), Math.round(totalFrames * 0.62));
  const isWipe = props.revealStyle === "wipe";

  // Before entrance
  let beforeOpacity = 1;
  let beforeY = 0;
  let beforeScale = 1;

  if (props.entranceAnimation === "fade-in") {
    beforeOpacity = fadeIn(frame, { startFrame: 0, endFrame: entrEnd }).opacity;
  } else if (props.entranceAnimation === "slide-up") {
    const s = slideUp(frame, { startFrame: 0, endFrame: entrEnd }, 40);
    beforeOpacity = s.opacity;
    beforeY = s.y;
  } else if (props.entranceAnimation === "scale-pop") {
    const p = scalePop(frame, { startFrame: 0, endFrame: entrEnd }, 1.1);
    beforeOpacity = p.opacity;
    beforeScale = p.scale;
  }

  // Transition
  if (isWipe) {
    // Wipe: clipPath reveals after state
    const wipeProgress = interpolate(frame, [revealStart, revealEnd], [100, 0], CLAMP);

    return (
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Background config={props.background} />

        {/* After state (underneath) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: exitOpacity,
            boxShadow: fx.boxShadow,
            transform: `translateY(${floatY}px)`,
            filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
          }}
        >
          {renderStateContent(props.afterLabel, props.afterTitle, props.afterItems, props.afterColor, props.textColor, typo)}
        </div>

        {/* Before state (on top, clipped away) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            clipPath: `inset(0 0 0 0)`,
            WebkitClipPath: `inset(0 ${100 - wipeProgress}% 0 0)`,
            opacity: beforeOpacity * exitOpacity,
            transform: `translateY(${beforeY + floatY}px) scale(${beforeScale})`,
          }}
        >
          <Background config={props.background} />
          {renderStateContent(props.beforeLabel, props.beforeTitle, props.beforeItems, props.beforeColor, props.textColor, typo)}
        </div>

        {/* Wipe line */}
        {frame >= revealStart && frame <= revealEnd && (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${wipeProgress}%`,
              width: "3px",
              backgroundColor: props.accentColor,
              boxShadow: "0 0 20px rgba(255,255,255,0.5)",
              opacity: exitOpacity,
            }}
          />
        )}
      </AbsoluteFill>
    );
  }

  // Fade transition
  const beforeFadeOut = interpolate(frame, [revealStart, revealEnd], [1, 0], CLAMP);
  const afterFadeIn = interpolate(frame, [revealStart, revealEnd], [0, 1], CLAMP);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} />

      {/* Before state */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: beforeOpacity * beforeFadeOut * exitOpacity,
          transform: `translateY(${beforeY + floatY}px) scale(${beforeScale})`,
          boxShadow: fx.boxShadow,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        {renderStateContent(props.beforeLabel, props.beforeTitle, props.beforeItems, props.beforeColor, props.textColor, typo)}
      </div>

      {/* After state */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: afterFadeIn * exitOpacity,
          transform: `translateY(${floatY}px)`,
          boxShadow: fx.boxShadow,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        {renderStateContent(props.afterLabel, props.afterTitle, props.afterItems, props.afterColor, props.textColor, typo)}
      </div>
    </AbsoluteFill>
  );
}

function renderSplit(
  props: BeforeAfterProps,
  frame: number,
  totalFrames: number,
  exitOpacity: number,
  isPortrait: boolean,
  scale: number,
  typo: ReturnType<typeof resolveTypography>,
  fx: ReturnType<typeof resolveEffects>,
  floatY: number,
  exitBlur: number,
) {
  const entrWindow = adaptiveEntranceWindow(props.duration, totalFrames, 1, {
    startPct: 0.0,
    minSec: 1.2,
    maxSec: 3.0,
    maxEndPct: 0.55,
  });
  const entrEnd = entrWindow.endFrame;

  const leftOpacity = interpolate(frame, [0, entrEnd], [0, 1], CLAMP);
  const rightStart = Math.round(entrEnd * 0.35);
  const rightEnd = Math.round(entrEnd * 1.1);
  const rightOpacity = interpolate(frame, [rightStart, rightEnd], [0, 1], CLAMP);
  const leftX = interpolate(frame, [0, entrEnd], [-60, 0], CLAMP);
  const rightX = interpolate(frame, [rightStart, rightEnd], [60, 0], CLAMP);

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
          boxShadow: fx.boxShadow,
          transform: `translateY(${floatY}px)`,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        {/* Before side */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: Math.round(60 * scale) + "px " + Math.round(40 * scale) + "px",
            opacity: leftOpacity,
            transform: `translateX(${leftX}px)`,
            borderTop: `4px solid ${props.beforeColor}`,
          }}
        >
          {renderStateContent(props.beforeLabel, props.beforeTitle, props.beforeItems, props.beforeColor, props.textColor, typo)}
        </div>

        {/* Divider */}
        <div style={{ width: isPortrait ? "60%" : "2px", alignSelf: "center", height: isPortrait ? "2px" : "60%", backgroundColor: props.accentColor }} />

        {/* After side */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: Math.round(60 * scale) + "px " + Math.round(40 * scale) + "px",
            opacity: rightOpacity,
            transform: `translateX(${rightX}px)`,
            borderTop: `4px solid ${props.afterColor}`,
          }}
        >
          {renderStateContent(props.afterLabel, props.afterTitle, props.afterItems, props.afterColor, props.textColor, typo)}
        </div>
      </div>
    </AbsoluteFill>
  );
}
