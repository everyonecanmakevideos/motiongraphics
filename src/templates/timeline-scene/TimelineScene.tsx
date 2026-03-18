import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, slideUp, microFloat } from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveEffects } from "../../primitives/useEffects";
import type { TimelineSceneProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const TimelineScene: React.FC<TimelineSceneProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, isPortrait, scale } = useResponsiveConfig();

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
  const count = props.milestones.length;

  // Phase timing
  const titleEnd = Math.round(totalFrames * 0.12 * motion.durationMultiplier);
  const timelineStart = Math.round(totalFrames * 0.1);
  const timelineEnd = Math.round(totalFrames * 0.7 * motion.durationMultiplier);
  const exitStart = Math.round(totalFrames * 0.85);
  const exitEnd = totalFrames;

  const titleOpacity = props.title
    ? interpolate(frame, [0, titleEnd], [0, 1], CLAMP)
    : 0;
  const exitOpacity = interpolate(frame, [exitStart, exitEnd], [1, 0], CLAMP);
  const exitBlur = fx.blurTransition
    ? interpolate(frame, [exitStart, exitEnd], [0, 8], CLAMP)
    : 0;

  const isMainPhase = frame >= timelineEnd && frame < exitStart;
  const floatY = motion.microMotionEnabled && isMainPhase ? microFloat(frame).y : 0;

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
          transform: `translate(-50%, -50%) translateY(${floatY}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: exitOpacity,
          boxShadow: fx.boxShadow,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        {/* Title */}
        {props.title && (
          <div
            style={{
              fontSize: Math.round(48 * scale) + "px",
              fontWeight: typo.fontWeight ?? "bold",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              letterSpacing: typo.letterSpacing ?? undefined,
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
                {/* Marker */}
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: props.markerStyle === "diamond" ? "2px" : "50%",
                    backgroundColor: props.markerStyle === "ring" ? "transparent" : props.dotColor,
                    border: "3px solid " + (props.markerStyle === "ring" ? props.dotColor : props.lineColor),
                    transform: props.markerStyle === "diamond" ? "rotate(45deg)" : undefined,
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
                      fontWeight: typo.fontWeight ?? "bold",
                      fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                      color: props.textColor,
                      letterSpacing: typo.letterSpacing ?? undefined,
                      marginBottom: "4px",
                    }}
                  >
                    {ms.label}
                  </div>
                  {ms.description && (
                    <div
                      style={{
                        fontSize: "15px",
                        fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                        color: props.descriptionColor,
                        lineHeight: typo.lineHeight ?? 1.3,
                        letterSpacing: typo.letterSpacing ?? undefined,
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
