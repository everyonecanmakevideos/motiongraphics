import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import {
  secToFrame,
  fadeIn,
  scalePop,
  microFloat,
  adaptiveEntranceWindow,
} from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveEffects } from "../../primitives/useEffects";
import type { ComparisonLayoutProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const ComparisonLayout: React.FC<ComparisonLayoutProps> = (props) => {
  const frame = useCurrentFrame();
  const { isPortrait, height, scale } = useResponsiveConfig();

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

  // Phase timing
  const sidesWindow = adaptiveEntranceWindow(props.duration, totalFrames, motion.durationMultiplier, {
    startPct: 0.0,
    minSec: 1.2,
    maxSec: 3.0,
    maxEndPct: 0.62,
  });
  const sidesEnd = sidesWindow.endFrame;
  const vsStart = Math.round(sidesWindow.startFrame + (sidesWindow.endFrame - sidesWindow.startFrame) * 0.35);
  const vsEnd = Math.round(sidesWindow.startFrame + (sidesWindow.endFrame - sidesWindow.startFrame) * 0.85);
  const itemsWindow = adaptiveEntranceWindow(props.duration, totalFrames, motion.durationMultiplier, {
    startPct: 0.16,
    minSec: 1.6,
    maxSec: 3.8,
    maxEndPct: 0.72,
  });
  const itemsStart = itemsWindow.startFrame;
  const itemsEnd = itemsWindow.endFrame;
  const exitStart = Math.round(totalFrames * 0.85);
  const exitEnd = totalFrames;

  const exitOpacity = interpolate(frame, [exitStart, exitEnd], [1, 0], CLAMP);
  const exitBlur = fx.blurTransition
    ? interpolate(frame, [exitStart, exitEnd], [0, 8], CLAMP)
    : 0;

  const isMainPhase = frame >= itemsEnd && frame < exitStart;
  const floatY = motion.microMotionEnabled && isMainPhase ? microFloat(frame).y : 0;

  // Left side entrance
  let leftOpacity = 1;
  let leftX = 0;
  let leftScale = 1;
  if (props.entranceAnimation === "slide-in") {
    leftOpacity = interpolate(frame, [0, sidesEnd], [0, 1], CLAMP);
    leftX = interpolate(frame, [0, sidesEnd], [-80, 0], CLAMP);
  } else if (props.entranceAnimation === "fade-in") {
    leftOpacity = fadeIn(frame, { startFrame: 0, endFrame: sidesEnd }).opacity;
  } else if (props.entranceAnimation === "scale-pop") {
    const p = scalePop(frame, { startFrame: 0, endFrame: sidesEnd }, 1.1);
    leftOpacity = p.opacity;
    leftScale = p.scale;
  }

  // Right side entrance
  let rightOpacity = 1;
  let rightX = 0;
  let rightScale = 1;
  if (props.entranceAnimation === "slide-in") {
    rightOpacity = interpolate(frame, [0, sidesEnd], [0, 1], CLAMP);
    rightX = interpolate(frame, [0, sidesEnd], [80, 0], CLAMP);
  } else if (props.entranceAnimation === "fade-in") {
    rightOpacity = fadeIn(frame, { startFrame: 0, endFrame: sidesEnd }).opacity;
  } else if (props.entranceAnimation === "scale-pop") {
    const p = scalePop(frame, { startFrame: 0, endFrame: sidesEnd }, 1.1);
    rightOpacity = p.opacity;
    rightScale = p.scale;
  }

  // VS badge
  const vsOpacity = interpolate(frame, [vsStart, vsEnd], [0, 1], CLAMP);
  const vsScale = interpolate(frame, [vsStart, vsEnd], [0.5, 1], CLAMP);

  const maxItems = Math.max(props.leftItems.length, props.rightItems.length);
  const estimatedRows = maxItems;
  const estimatedItemHeight = Math.round((isPortrait ? 56 : 46) * scale);
  const headingSpace = Math.round(84 * scale);
  const columnContentHeight = headingSpace + estimatedRows * estimatedItemHeight;
  const totalEstimatedHeight = isPortrait
    ? columnContentHeight * 2 + Math.round(120 * scale)
    : columnContentHeight + Math.round(40 * scale);
  const fitScale = totalEstimatedHeight > Math.round(height * 0.9)
    ? Math.max(0.78, Math.round(((height * 0.9) / totalEstimatedHeight) * 1000) / 1000)
    : 1;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translateY(${floatY}px) scale(${fitScale})`,
          display: "flex",
          flexDirection: isPortrait ? "column" : "row",
          alignItems: isPortrait ? "center" : "flex-start",
          gap: Math.round((isPortrait ? 30 : 60) * scale) + "px",
          opacity: exitOpacity,
          width: isPortrait ? "92%" : "85%",
          boxShadow: fx.boxShadow,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        {/* Left side */}
        <div
          style={{
            flex: 1,
            opacity: leftOpacity,
            transform: "translateX(" + leftX + "px) scale(" + leftScale + ")",
          }}
        >
          <div
            style={{
              fontSize: Math.round(48 * scale) + "px",
              fontWeight: typo.fontWeight ?? "bold",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.leftColor,
              letterSpacing: typo.letterSpacing ?? undefined,
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            {props.leftTitle}
          </div>
          {props.leftItems.map((item, i) => {
            const itemDelay = Math.round(itemsStart + ((itemsEnd - itemsStart) * i) / maxItems);
            const itemEnd = Math.min(itemDelay + Math.round(totalFrames * 0.12), totalFrames);
            const itemOpacity = interpolate(frame, [itemDelay, itemEnd], [0, 1], CLAMP);
            const itemY = interpolate(frame, [itemDelay, itemEnd], [15, 0], CLAMP);
            return (
              <div
                key={i}
                style={{
                  fontSize: "24px",
                  fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                  color: props.textColor,
                  padding: "10px 16px",
                  marginBottom: "8px",
                  backgroundColor: props.leftColor + "1A",
                  borderRadius: "8px",
                  borderLeft: "3px solid " + props.leftColor,
                  opacity: itemOpacity,
                  transform: "translateY(" + itemY + "px)",
                }}
              >
                {item}
              </div>
            );
          })}
        </div>

        {/* VS badge with divider */}
        <div
          style={{
            display: "flex",
            flexDirection: isPortrait ? "row" : "column",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
            gap: "12px",
            opacity: vsOpacity,
            transform: "scale(" + vsScale + ")",
          }}
        >
          <div
            style={{
              width: isPortrait ? "40px" : "3px",
              height: isPortrait ? "3px" : "40px",
              backgroundColor: props.dividerColor,
              borderRadius: "2px",
            }}
          />
          <div
            style={{
              fontSize: Math.round(40 * scale) + "px",
              fontWeight: typo.fontWeight ?? "bold",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.vsColor,
              padding: "12px 20px",
              border: "3px solid " + props.vsColor,
              borderRadius: "50%",
              width: "80px",
              height: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {props.vsText}
          </div>
          <div
            style={{
              width: isPortrait ? "40px" : "3px",
              height: isPortrait ? "3px" : "40px",
              backgroundColor: props.dividerColor,
              borderRadius: "2px",
            }}
          />
        </div>

        {/* Right side */}
        <div
          style={{
            flex: 1,
            opacity: rightOpacity,
            transform: "translateX(" + rightX + "px) scale(" + rightScale + ")",
          }}
        >
          <div
            style={{
              fontSize: Math.round(48 * scale) + "px",
              fontWeight: typo.fontWeight ?? "bold",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.rightColor,
              letterSpacing: typo.letterSpacing ?? undefined,
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            {props.rightTitle}
          </div>
          {props.rightItems.map((item, i) => {
            const itemDelay = Math.round(itemsStart + ((itemsEnd - itemsStart) * i) / maxItems);
            const itemEnd = Math.min(itemDelay + Math.round(totalFrames * 0.12), totalFrames);
            const itemOpacity = interpolate(frame, [itemDelay, itemEnd], [0, 1], CLAMP);
            const itemY = interpolate(frame, [itemDelay, itemEnd], [15, 0], CLAMP);
            return (
              <div
                key={i}
                style={{
                  fontSize: "24px",
                  fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                  color: props.textColor,
                  padding: "10px 16px",
                  marginBottom: "8px",
                  backgroundColor: props.rightColor + "1A",
                  borderRadius: "8px",
                  borderLeft: "3px solid " + props.rightColor,
                  opacity: itemOpacity,
                  transform: "translateY(" + itemY + "px)",
                }}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
