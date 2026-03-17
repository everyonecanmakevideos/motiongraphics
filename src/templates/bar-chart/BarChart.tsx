import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, slideUp } from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { BarChartProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const BarChart: React.FC<BarChartProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, scale } = useResponsiveConfig();
  const totalFrames = secToFrame(props.duration);
  const isVertical = props.orientation === "vertical";

  // Phase timing
  const titleEnd = Math.round(totalFrames * 0.15);
  const barsStart = Math.round(totalFrames * 0.1);
  const barsEnd = Math.round(totalFrames * 0.55);
  const exitStart = Math.round(totalFrames * 0.85);

  // Title animation
  const titleOpacity = props.title
    ? interpolate(frame, [0, titleEnd], [0, 1], CLAMP)
    : 0;
  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);

  // Find max value for scaling
  const maxValue = Math.max(...props.bars.map((b) => b.value), 1);

  // Chart area dimensions — adapt to composition size
  const chartWidth = Math.round(width * (isVertical ? 0.85 : 0.75));
  const chartHeight = Math.round(height * (isVertical ? 0.5 : 0.55));
  const barGap = isVertical
    ? Math.max(8, (chartWidth - props.bars.length * props.barWidth) / (props.bars.length + 1))
    : Math.max(6, (chartHeight - props.bars.length * props.barWidth) / (props.bars.length + 1));

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
              marginBottom: "40px",
              opacity: titleOpacity,
            }}
          >
            {props.title}
          </div>
        )}

        {/* Chart container */}
        <div
          style={{
            position: "relative",
            width: chartWidth + "px",
            height: chartHeight + "px",
            display: "flex",
            flexDirection: isVertical ? "row" : "column",
            alignItems: isVertical ? "flex-end" : "flex-start",
            justifyContent: "center",
            gap: barGap + "px",
          }}
        >
          {/* Grid lines */}
          {props.gridLines && isVertical && (
            <>
              {[0, 1, 2, 3, 4].map((idx) => (
                <div
                  key={"grid-" + idx}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: Math.round((chartHeight * idx) / 4) + "px",
                    height: "1px",
                    backgroundColor: props.gridColor,
                    opacity: 0.5,
                    pointerEvents: "none",
                  }}
                />
              ))}
            </>
          )}
          {props.gridLines && !isVertical && (
            <>
              {[0, 1, 2, 3, 4].map((idx) => (
                <div
                  key={"grid-" + idx}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: Math.round((chartWidth * idx) / 4) + "px",
                    width: "1px",
                    backgroundColor: props.gridColor,
                    opacity: 0.5,
                    pointerEvents: "none",
                  }}
                />
              ))}
            </>
          )}
          {props.bars.map((bar, i) => {
            // Stagger the bar animations
            const staggerDelay = Math.round(
              barsStart + ((barsEnd - barsStart) * i) / props.bars.length
            );
            const barAnimEnd = Math.min(staggerDelay + Math.round(totalFrames * 0.25), totalFrames);

            // Bar growth progress
            let progress = 0;
            if (props.entranceAnimation === "grow" || props.entranceAnimation === "none") {
              progress =
                props.entranceAnimation === "none"
                  ? 1
                  : interpolate(frame, [staggerDelay, barAnimEnd], [0, 1], CLAMP);
            } else if (props.entranceAnimation === "fade-in") {
              progress = 1;
            } else if (props.entranceAnimation === "slide-up") {
              progress = 1;
            }

            const barFraction = bar.value / maxValue;
            const barLength = barFraction * (isVertical ? chartHeight - 60 : chartWidth - 200) * progress;

            // Fade/slide for non-grow animations
            let barOpacity = 1;
            let barTranslate = 0;
            if (props.entranceAnimation === "fade-in") {
              const f = fadeIn(frame, { startFrame: staggerDelay, endFrame: barAnimEnd });
              barOpacity = f.opacity;
            } else if (props.entranceAnimation === "slide-up") {
              const s = slideUp(frame, { startFrame: staggerDelay, endFrame: barAnimEnd }, 40);
              barOpacity = s.opacity;
              barTranslate = s.y;
            }

            // Value display
            const displayValue = props.entranceAnimation === "grow"
              ? Math.round(bar.value * progress)
              : bar.value;

            if (isVertical) {
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    opacity: barOpacity,
                    transform: "translateY(" + barTranslate + "px)",
                  }}
                >
                  {/* Value above bar */}
                  {props.showValues && (
                    <div
                      style={{
                        fontSize: "20px",
                        fontFamily: "Arial, sans-serif",
                        fontWeight: "bold",
                        color: props.valueColor,
                        marginBottom: "6px",
                        opacity: progress > 0.3 ? 1 : 0,
                      }}
                    >
                      {displayValue}
                    </div>
                  )}
                  {/* Bar */}
                  <div
                    style={{
                      width: props.barWidth + "px",
                      height: barLength + "px",
                      backgroundColor: bar.color,
                      borderRadius: props.barRadius + "px " + props.barRadius + "px 0 0",
                    }}
                  />
                  {/* Label below bar */}
                  <div
                    style={{
                      fontSize: "16px",
                      fontFamily: "Arial, sans-serif",
                      color: props.labelColor,
                      marginTop: "8px",
                      textAlign: "center",
                      maxWidth: props.barWidth + 20 + "px",
                      wordWrap: "break-word",
                    }}
                  >
                    {bar.label}
                  </div>
                </div>
              );
            }

            // Horizontal
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  opacity: barOpacity,
                  transform: "translateY(" + barTranslate + "px)",
                }}
              >
                {/* Label left of bar */}
                <div
                  style={{
                    fontSize: "16px",
                    fontFamily: "Arial, sans-serif",
                    color: props.labelColor,
                    width: "120px",
                    textAlign: "right",
                  }}
                >
                  {bar.label}
                </div>
                {/* Bar */}
                <div
                  style={{
                    width: barLength + "px",
                    height: props.barWidth + "px",
                    backgroundColor: bar.color,
                    borderRadius: "0 " + props.barRadius + "px " + props.barRadius + "px 0",
                  }}
                />
                {/* Value right of bar */}
                {props.showValues && (
                  <div
                    style={{
                      fontSize: "20px",
                      fontFamily: "Arial, sans-serif",
                      fontWeight: "bold",
                      color: props.valueColor,
                      opacity: progress > 0.3 ? 1 : 0,
                    }}
                  >
                    {displayValue}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
