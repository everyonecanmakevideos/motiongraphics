import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, slideUp, scalePop } from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { BeforeAfterProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const BeforeAfter: React.FC<BeforeAfterProps> = (props) => {
  const frame = useCurrentFrame();
  const { isPortrait, scale } = useResponsiveConfig();
  const totalFrames = secToFrame(props.duration);
  const exitStart = Math.round(totalFrames * 0.85);
  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);

  if (props.revealStyle === "split") {
    return renderSplit(props, frame, totalFrames, exitOpacity, isPortrait, scale);
  }
  return renderOverlay(props, frame, totalFrames, exitOpacity);
};

function renderStateContent(
  label: string,
  title: string,
  items: string[] | undefined,
  accentColor: string,
  textColor: string
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
            fontWeight: "bold",
            fontFamily: "Arial, Helvetica, sans-serif",
            color: textColor,
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          {label}
        </span>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: "44px",
          fontWeight: "bold",
          fontFamily: "Arial, Helvetica, sans-serif",
          color: textColor,
          lineHeight: 1.2,
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
            fontFamily: "Arial, Helvetica, sans-serif",
            color: textColor,
            opacity: 0.8,
            lineHeight: 1.5,
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
  exitOpacity: number
) {
  const entrEnd = Math.round(totalFrames * 0.2);
  const revealStart = Math.round(totalFrames * 0.4);
  const revealEnd = Math.round(totalFrames * 0.65);
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
          }}
        >
          {renderStateContent(props.afterLabel, props.afterTitle, props.afterItems, props.afterColor, props.textColor)}
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
            transform: `translateY(${beforeY}px) scale(${beforeScale})`,
          }}
        >
          <Background config={props.background} />
          {renderStateContent(props.beforeLabel, props.beforeTitle, props.beforeItems, props.beforeColor, props.textColor)}
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
          transform: `translateY(${beforeY}px) scale(${beforeScale})`,
        }}
      >
        {renderStateContent(props.beforeLabel, props.beforeTitle, props.beforeItems, props.beforeColor, props.textColor)}
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
        }}
      >
        {renderStateContent(props.afterLabel, props.afterTitle, props.afterItems, props.afterColor, props.textColor)}
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
  scale: number
) {
  const entrEnd = Math.round(totalFrames * 0.25);

  const leftOpacity = interpolate(frame, [0, entrEnd], [0, 1], CLAMP);
  const rightOpacity = interpolate(frame, [Math.round(totalFrames * 0.1), Math.round(totalFrames * 0.3)], [0, 1], CLAMP);
  const leftX = interpolate(frame, [0, entrEnd], [-60, 0], CLAMP);
  const rightX = interpolate(frame, [Math.round(totalFrames * 0.1), Math.round(totalFrames * 0.3)], [60, 0], CLAMP);

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
          {renderStateContent(props.beforeLabel, props.beforeTitle, props.beforeItems, props.beforeColor, props.textColor)}
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
          {renderStateContent(props.afterLabel, props.afterTitle, props.afterItems, props.afterColor, props.textColor)}
        </div>
      </div>
    </AbsoluteFill>
  );
}
