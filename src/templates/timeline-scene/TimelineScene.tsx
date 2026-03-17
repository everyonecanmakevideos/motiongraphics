import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, slideUp } from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { TimelineSceneProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const TimelineScene: React.FC<TimelineSceneProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, isPortrait, scale } = useResponsiveConfig();
  const totalFrames = secToFrame(props.duration);
  const count = props.milestones.length;

  // Phase timing
  const titleEnd = Math.round(totalFrames * 0.12);
  const timelineStart = Math.round(totalFrames * 0.1);
  const timelineEnd = Math.round(totalFrames * 0.7);
  const exitStart = Math.round(totalFrames * 0.85);

  const titleOpacity = props.title
    ? interpolate(frame, [0, titleEnd], [0, 1], CLAMP)
    : 0;
  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);

  // Timeline line progress (for progressive animation)
  const lineProgress =
    props.entranceAnimation === "progressive"
      ? interpolate(frame, [timelineStart, timelineEnd], [0, 100], CLAMP)
      : 100;

  // Spacing — adapt to actual width
  const timelineWidth = Math.round(width * 0.85);
  const segmentWidth = timelineWidth / (count - 1 || 1);

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
              marginBottom: "60px",
              opacity: titleOpacity,
            }}
          >
            {props.title}
          </div>
        )}

        {/* Timeline container */}
        <div
          style={{
            position: "relative",
            width: timelineWidth + "px",
            height: "200px",
          }}
        >
          {/* Horizontal line */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "0",
              width: lineProgress + "%",
              height: "3px",
              backgroundColor: props.lineColor,
              borderRadius: "2px",
            }}
          />

          {/* Milestones */}
          {props.milestones.map((ms, i) => {
            const xPos = count > 1 ? i * segmentWidth : timelineWidth / 2;
            const milestoneProgress = (xPos / timelineWidth) * 100;

            // Determine visibility based on animation
            let dotOpacity = 1;
            let textOpacity = 1;
            let textY = 0;

            if (props.entranceAnimation === "progressive") {
              dotOpacity = lineProgress >= milestoneProgress ? 1 : 0;
              const dotAppearFrame = Math.round(
                timelineStart + ((timelineEnd - timelineStart) * i) / count
              );
              const dotEnd = Math.min(dotAppearFrame + Math.round(totalFrames * 0.08), totalFrames);
              dotOpacity = interpolate(frame, [dotAppearFrame, dotEnd], [0, 1], CLAMP);
              textOpacity = dotOpacity;
              textY = interpolate(frame, [dotAppearFrame, dotEnd], [10, 0], CLAMP);
            } else if (props.entranceAnimation === "fade-in") {
              const delay = Math.round(timelineStart + ((timelineEnd - timelineStart) * i) / count);
              const end = Math.min(delay + Math.round(totalFrames * 0.12), totalFrames);
              dotOpacity = fadeIn(frame, { startFrame: delay, endFrame: end }).opacity;
              textOpacity = dotOpacity;
            } else if (props.entranceAnimation === "slide-up") {
              const delay = Math.round(timelineStart + ((timelineEnd - timelineStart) * i) / count);
              const end = Math.min(delay + Math.round(totalFrames * 0.12), totalFrames);
              const s = slideUp(frame, { startFrame: delay, endFrame: end }, 30);
              dotOpacity = s.opacity;
              textOpacity = s.opacity;
              textY = s.y;
            }

            const isEven = i % 2 === 0;

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: xPos + "px",
                  top: "0px",
                  transform: "translateX(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: props.dotColor,
                    border: "3px solid " + props.lineColor,
                    position: "absolute",
                    top: "12px",
                    opacity: dotOpacity,
                    zIndex: 2,
                  }}
                />

                {/* Label + description */}
                <div
                  style={{
                    position: "absolute",
                    top: isEven ? "44px" : undefined,
                    bottom: isEven ? undefined : "170px",
                    textAlign: "center",
                    width: "180px",
                    opacity: textOpacity,
                    transform: "translateY(" + textY + "px)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      fontFamily: "Arial, sans-serif",
                      color: props.textColor,
                      marginBottom: "4px",
                    }}
                  >
                    {ms.label}
                  </div>
                  {ms.description && (
                    <div
                      style={{
                        fontSize: "15px",
                        fontFamily: "Arial, sans-serif",
                        color: props.descriptionColor,
                        lineHeight: 1.3,
                      }}
                    >
                      {ms.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
