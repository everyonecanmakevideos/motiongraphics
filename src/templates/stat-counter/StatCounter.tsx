import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, countUp, fadeIn, scalePop } from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { StatCounterProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const StatCounter: React.FC<StatCounterProps> = (props) => {
  const frame = useCurrentFrame();
  const { scale } = useResponsiveConfig();
  const totalFrames = secToFrame(props.duration);

  // Phase timing
  const entranceEnd = Math.round(totalFrames * 0.6);
  const labelStart = Math.round(totalFrames * 0.15);
  const labelEnd = Math.round(totalFrames * 0.35);
  const exitStart = Math.round(totalFrames * 0.85);

  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);

  // Value size multiplier
  const valueSizeMultiplier = props.valueSize === "medium" ? 0.7 : props.valueSize === "xlarge" ? 1.4 : 1;

  // Number display
  let displayValue = props.value;
  let numberOpacity = 1;
  let numberScale = 1;

  if (props.entranceAnimation === "count-up") {
    displayValue = countUp(frame, { startFrame: 0, endFrame: entranceEnd }, 0, props.value);
    numberOpacity = interpolate(frame, [0, Math.round(totalFrames * 0.08)], [0, 1], CLAMP);
  } else if (props.entranceAnimation === "fade-in") {
    const f = fadeIn(frame, { startFrame: 0, endFrame: Math.round(totalFrames * 0.25) });
    numberOpacity = f.opacity;
  } else if (props.entranceAnimation === "scale-pop") {
    const p = scalePop(frame, { startFrame: 0, endFrame: Math.round(totalFrames * 0.3) }, 1.15);
    numberOpacity = p.opacity;
    numberScale = p.scale;
  }

  // Label animation
  const labelOpacity = interpolate(frame, [labelStart, labelEnd], [0, 1], CLAMP);
  const labelY = interpolate(frame, [labelStart, labelEnd], [20, 0], CLAMP);

  // Format number with commas
  const formatted = Math.abs(displayValue).toLocaleString("en-US");
  const sign = props.value < 0 && displayValue !== 0 ? "-" : "";
  const numberText = props.prefix + sign + formatted + props.suffix;

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
          opacity: exitOpacity,
        }}
      >
        {/* Big number */}
        <div
          style={{
            fontSize: Math.round(140 * scale * valueSizeMultiplier) + "px",
            fontWeight: "bold",
            fontFamily: "Arial, Helvetica, sans-serif",
            color: props.valueColor,
            lineHeight: 1,
            opacity: numberOpacity,
            transform: "scale(" + numberScale + ")",
            letterSpacing: "-0.02em",
          }}
        >
          {numberText}
        </div>

        {/* Accent line */}
        {props.accentColor && (
          <div
            style={{
              width: "80px",
              height: "4px",
              backgroundColor: props.accentColor,
              marginTop: "16px",
              borderRadius: "2px",
            }}
          />
        )}

        {/* Label */}
        {props.label && (
          <div
            style={{
              fontSize: Math.round(36 * scale) + "px",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: props.labelColor,
              marginTop: "20px",
              opacity: labelOpacity,
              transform: "translateY(" + labelY + "px)",
            }}
          >
            {props.label}
          </div>
        )}

        {/* Sublabel */}
        {props.sublabel && (
          <div
            style={{
              fontSize: Math.round(22 * scale) + "px",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: props.labelColor,
              marginTop: "10px",
              opacity: labelOpacity * 0.7,
              transform: "translateY(" + labelY + "px)",
            }}
          >
            {props.sublabel}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
