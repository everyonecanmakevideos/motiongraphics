import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame } from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { PieChartProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const TAU = 2 * Math.PI;

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    "M", cx, cy,
    "L", start.x, start.y,
    "A", r, r, 0, largeArc, 0, end.x, end.y,
    "Z",
  ].join(" ");
}

function describeDonutArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
): string {
  const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    "M", outerStart.x, outerStart.y,
    "A", outerR, outerR, 0, largeArc, 0, outerEnd.x, outerEnd.y,
    "L", innerStart.x, innerStart.y,
    "A", innerR, innerR, 0, largeArc, 1, innerEnd.x, innerEnd.y,
    "Z",
  ].join(" ");
}

export const PieChart: React.FC<PieChartProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, isPortrait, scale } = useResponsiveConfig();
  const totalFrames = secToFrame(props.duration);

  // Dynamic pie size based on composition
  const SIZE = Math.round(Math.min(width, 1080) * 0.37);
  const CENTER = SIZE / 2;

  // Phase timing
  const titleEnd = Math.round(totalFrames * 0.15);
  const chartStart = Math.round(totalFrames * 0.08);
  const chartEnd = Math.round(totalFrames * 0.55);
  const labelsStart = Math.round(totalFrames * 0.4);
  const labelsEnd = Math.round(totalFrames * 0.6);
  const exitStart = Math.round(totalFrames * 0.85);

  const titleOpacity = props.title
    ? interpolate(frame, [0, titleEnd], [0, 1], CLAMP)
    : 0;
  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);
  const labelOpacity = interpolate(frame, [labelsStart, labelsEnd], [0, 1], CLAMP);

  // Chart animation progress
  let chartProgress = 1;
  let chartScale = 1;
  let chartOpacity = 1;
  if (props.entranceAnimation === "spin") {
    chartProgress = interpolate(frame, [chartStart, chartEnd], [0, 1], CLAMP);
  } else if (props.entranceAnimation === "fade-in") {
    chartOpacity = interpolate(frame, [chartStart, chartEnd], [0, 1], CLAMP);
  } else if (props.entranceAnimation === "scale-pop") {
    const mid = Math.round((chartStart + chartEnd) / 2);
    chartScale = frame < mid
      ? interpolate(frame, [chartStart, mid], [0, 1.1], CLAMP)
      : interpolate(frame, [mid, chartEnd], [1.1, 1], CLAMP);
    chartOpacity = interpolate(frame, [chartStart, mid], [0, 1], CLAMP);
  }

  // Calculate segment angles
  const total = props.segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const startAngle = -Math.PI / 2; // Start from top
  const outerR = SIZE / 2 - 10;
  const innerR = props.donut ? outerR * 0.55 : 0;

  let currentAngle = startAngle;
  const segmentData = props.segments.map((seg) => {
    const sweep = (seg.value / total) * TAU * chartProgress;
    const start = currentAngle;
    currentAngle += sweep;
    const midAngle = start + sweep / 2;
    return { ...seg, start, end: currentAngle, midAngle, pct: Math.round((seg.value / total) * 100) };
  });

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
        {/* Title */}
        {props.title && (
          <div
            style={{
              fontSize: Math.round(48 * scale) + "px",
              fontWeight: "bold",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: props.titleColor,
              marginBottom: "30px",
              opacity: titleOpacity,
            }}
          >
            {props.title}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: isPortrait ? "column" : "row", alignItems: "center", gap: Math.round((isPortrait ? 30 : 60) * scale) + "px" }}>
          {/* Pie/Donut SVG */}
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={"0 0 " + SIZE + " " + SIZE}
            style={{
              opacity: chartOpacity,
              transform: "scale(" + chartScale + ")",
            }}
          >
            {segmentData.map((seg, i) => {
              if (seg.end - seg.start < 0.001) return null;
              const d = props.donut
                ? describeDonutArc(CENTER, CENTER, outerR, innerR, seg.start, seg.end)
                : describeArc(CENTER, CENTER, outerR, seg.start, seg.end);
              return <path key={i} d={d} fill={seg.color} />;
            })}
          </svg>

          {/* Legend / Labels */}
          {props.showLabels && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                opacity: labelOpacity,
              }}
            >
              {props.segments.map((seg, i) => {
                const pct = Math.round((seg.value / total) * 100);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "4px",
                        backgroundColor: seg.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "22px",
                        fontFamily: "Arial, sans-serif",
                        color: props.labelColor,
                      }}
                    >
                      {seg.label}
                      {props.showPercentages && " (" + pct + "%)"}
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
