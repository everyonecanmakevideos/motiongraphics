import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, scalePop, countUp } from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
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
  const totalFrames = secToFrame(props.duration);

  const valueEnd = Math.round(totalFrames * 0.35);
  const labelStart = Math.round(totalFrames * 0.1);
  const labelEnd = Math.round(totalFrames * 0.3);
  const trendStart = Math.round(totalFrames * 0.3);
  const trendEnd = Math.round(totalFrames * 0.45);
  const contextStart = Math.round(totalFrames * 0.2);
  const contextEnd = Math.round(totalFrames * 0.4);
  const exitStart = Math.round(totalFrames * 0.85);

  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);

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
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          opacity: exitOpacity,
        }}
      >
        {/* Value row with trend */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "20px" }}>
          <div
            style={{
              fontSize: Math.round(130 * scale * valueSizeMultiplier) + "px",
              fontWeight: "bold",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: props.valueColor,
              lineHeight: 1,
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
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontWeight: "bold",
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
            fontFamily: "Arial, Helvetica, sans-serif",
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
              fontFamily: "Arial, Helvetica, sans-serif",
              color: props.contextColor,
              marginTop: "16px",
              maxWidth: Math.round(width * 0.55) + "px",
              lineHeight: 1.4,
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
