import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, scalePop, countUp, microFloat } from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveEffects } from "../../primitives/useEffects";
import type { DataCalloutProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const TREND_ARROWS: Record<string, string> = {
  up: "\u25B2",
  down: "\u25BC",
  neutral: "\u25C6",
};

export const DataCallout: React.FC<DataCalloutProps> = (props) => {
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

  const valueEnd = Math.round(totalFrames * 0.35 * motion.durationMultiplier);
  const labelStart = Math.round(totalFrames * 0.1);
  const labelEnd = Math.round(totalFrames * 0.3 * motion.durationMultiplier);
  const trendStart = Math.round(totalFrames * 0.3);
  const trendEnd = Math.round(totalFrames * 0.45 * motion.durationMultiplier);
  const contextStart = Math.round(totalFrames * 0.2);
  const contextEnd = Math.round(totalFrames * 0.4 * motion.durationMultiplier);
  const exitStart = Math.round(totalFrames * 0.85);
  const exitEnd = totalFrames;

  const exitOpacity = interpolate(frame, [exitStart, exitEnd], [1, 0], CLAMP);
  const exitBlur = fx.blurTransition
    ? interpolate(frame, [exitStart, exitEnd], [0, 8], CLAMP)
    : 0;

  const isMainPhase = frame >= valueEnd && frame < exitStart;
  const floatY = motion.microMotionEnabled && isMainPhase ? microFloat(frame).y : 0;

  // Value size multiplier
  const valueSizeMultiplier = props.valueSize === "medium" ? 0.7 : props.valueSize === "xlarge" ? 1.4 : 1;

  // Value animation
  let displayValue = props.value;
  let valueOpacity = 1;
  let valueScale = 1;

  if (props.entranceAnimation === "count-up") {
    displayValue = countUp(frame, { startFrame: 0, endFrame: valueEnd }, 0, props.value);
    valueOpacity = fadeIn(frame, { startFrame: 0, endFrame: Math.round(totalFrames * 0.08) }).opacity;
  } else if (props.entranceAnimation === "fade-in") {
    valueOpacity = fadeIn(frame, { startFrame: 0, endFrame: valueEnd }).opacity;
  } else if (props.entranceAnimation === "scale-pop") {
    const p = scalePop(frame, { startFrame: 0, endFrame: valueEnd }, 1.15);
    valueOpacity = p.opacity;
    valueScale = p.scale;
  }

  // Label animation
  const labelOpacity = props.entranceAnimation !== "none"
    ? interpolate(frame, [labelStart, labelEnd], [0, 1], CLAMP)
    : 1;
  const labelY = props.entranceAnimation !== "none"
    ? interpolate(frame, [labelStart, labelEnd], [15, 0], CLAMP)
    : 0;

  // Trend animation
  const trendOpacity = props.trend !== "none"
    ? interpolate(frame, [trendStart, trendEnd], [0, 1], CLAMP)
    : 0;

  // Context animation
  const contextOpacity = props.context
    ? interpolate(frame, [contextStart, contextEnd], [0, 1], CLAMP)
    : 0;
  const contextY = props.context
    ? interpolate(frame, [contextStart, contextEnd], [10, 0], CLAMP)
    : 0;

  const trendColor = props.trend === "up"
    ? props.trendUpColor
    : props.trend === "down"
    ? props.trendDownColor
    : props.labelColor;

  const formattedValue = displayValue.toLocaleString();

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
          alignItems: "center",
          textAlign: "center",
          opacity: exitOpacity,
          boxShadow: fx.boxShadow,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        {/* Value row with trend */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "20px" }}>
          <div
            style={{
              fontSize: Math.round(130 * scale * valueSizeMultiplier) + "px",
              fontWeight: typo.fontWeight ?? "bold",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.valueColor,
              lineHeight: typo.lineHeight ?? 1,
              letterSpacing: typo.letterSpacing ?? undefined,
              opacity: valueOpacity,
              transform: `scale(${valueScale})`,
            }}
          >
            {props.prefix}{formattedValue}{props.suffix}
          </div>

          {/* Trend indicator */}
          {props.trend !== "none" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                opacity: trendOpacity,
                padding: "8px 16px",
                borderRadius: "20px",
                backgroundColor: trendColor + "20",
              }}
            >
              <span style={{ fontSize: "20px", color: trendColor }}>
                {TREND_ARROWS[props.trend] ?? ""}
              </span>
              {props.trendValue && (
                <span
                  style={{
                    fontSize: Math.round(22 * scale) + "px",
                    fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                    fontWeight: typo.fontWeight ?? "bold",
                    color: trendColor,
                  }}
                >
                  {props.trendValue}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Label */}
        <div
          style={{
            fontSize: Math.round(36 * scale) + "px",
            fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
            color: props.labelColor,
            marginTop: "16px",
            opacity: labelOpacity,
            transform: `translateY(${labelY}px)`,
          }}
        >
          {props.label}
        </div>

        {/* Context */}
        {props.context && (
          <div
            style={{
              fontSize: Math.round(22 * scale) + "px",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.contextColor,
              marginTop: "16px",
              maxWidth: Math.round(width * 0.55) + "px",
              lineHeight: typo.lineHeight ?? 1.4,
              letterSpacing: typo.letterSpacing ?? undefined,
              opacity: contextOpacity,
              transform: `translateY(${contextY}px)`,
            }}
          >
            {props.context}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
