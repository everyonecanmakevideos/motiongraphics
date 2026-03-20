import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, slideUp, staggerDelay, microFloat } from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveEffects } from "../../primitives/useEffects";
import type { ProcessStepsProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const CIRCLE_SIZE = 52;

export const ProcessSteps: React.FC<ProcessStepsProps> = (props) => {
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

  const titleEnd = Math.round(totalFrames * 0.12 * motion.durationMultiplier);
  const stepsStart = Math.round(totalFrames * 0.1);
  const stepsDuration = Math.round(totalFrames * 0.55);
  const exitStart = Math.round(totalFrames * 0.85);
  const exitEnd = totalFrames;

  const exitOpacity = interpolate(frame, [exitStart, exitEnd], [1, 0], CLAMP);

  const entranceEnd = Math.round(totalFrames * 0.25 * motion.durationMultiplier);
  const isMainPhase = frame >= entranceEnd && frame < exitStart;
  const floatY = motion.microMotionEnabled && isMainPhase ? microFloat(frame).y : 0;

  const exitBlur = fx.blurTransition
    ? interpolate(frame, [exitStart, exitEnd], [0, 8], CLAMP)
    : 0;

  // Title animation
  let titleOpacity = 1;
  let titleY = 0;
  if (props.title && props.entranceAnimation !== "none") {
    titleOpacity = interpolate(frame, [0, titleEnd], [0, 1], CLAMP);
    titleY = interpolate(frame, [0, titleEnd], [20, 0], CLAMP);
  }

  const stepCount = props.steps.length;

  const layoutMode = props.layoutMode ?? "cards";

  // Progress-tracker specific timing:
  const trackerPlayableFrames = totalFrames * 0.7; // leave some time for intro/outro
  const trackerPerStep = trackerPlayableFrames / Math.max(1, stepCount);

  const trackerProgress =
    layoutMode === "tracker"
      ? Math.min(
          1,
          Math.max(0, (frame - stepsStart) / Math.max(1, trackerPlayableFrames)),
        )
      : 0;

  const currentActiveIndex =
    layoutMode === "tracker"
      ? Math.min(
          stepCount - 1,
          Math.floor(Math.max(0, frame - stepsStart) / Math.max(1, trackerPerStep)),
        )
      : 0;

  const contentTop = layoutMode === "tracker" ? "44%" : "48%";

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: contentTop,
          transform: `translate(-50%, -50%) translateY(${floatY}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: exitOpacity,
          width: "92%",
          maxWidth: Math.round(width * 0.92),
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        {/* Title */}
        {props.title && (
          <div
            style={{
              fontSize: Math.round(60 * scale) + "px",
              fontWeight: 800,
              fontFamily: typo.fontFamily ?? "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
              color: props.titleColor,
              marginBottom: isPortrait ? "48px" : layoutMode === "tracker" ? "92px" : "72px",
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
              textAlign: "center",
              letterSpacing: "-0.02em",
            }}
          >
            {props.title}
          </div>
        )}

        {/* LAYOUT: PROGRESS TRACKER */}
        {layoutMode === "tracker" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              justifyContent: "center",
              width: "100%",
              maxWidth: Math.round(width * 0.7),
              margin: "0 auto",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: 110,
                display: "flex",
                alignItems: "center",
              }}
            >
              {/* Base line */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: 4,
                  borderRadius: 999,
                  backgroundColor: props.connectorColor,
                  opacity: 0.25,
                }}
              />

              {/* Active / completed line */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  width: `${trackerProgress * 100}%`,
                  height: 4,
                  borderRadius: 999,
                  backgroundColor: props.stepColor,
                  opacity: 0.9,
                  transition: "width 120ms linear",
                }}
              />

              {/* Steps as nodes along line */}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "grid",
                  width: "100%",
                  gridTemplateColumns: `repeat(${stepCount}, 1fr)`,
                  columnGap: Math.round(32 * scale),
                  justifyItems: "center",
                }}
              >
                {props.steps.map((step, i) => {
                  const isCompleted = i < currentActiveIndex;
                  const isActive = i === currentActiveIndex;
                  const isUpcoming = !isCompleted && !isActive;

                  const nodeScale = isActive
                    ? interpolate(frame % 30, [0, 15, 30], [1, 1.06, 1], CLAMP)
                    : 1;

                  const nodeBg = isCompleted || isActive ? props.stepColor : "#E5E7EB";
                  const nodeBorder =
                    isUpcoming && !isActive && !isCompleted ? "#CBD5E1" : props.stepColor;

                  const labelColor = isUpcoming ? props.descriptionColor : props.textColor;
                  const nodeSize = Math.round((CIRCLE_SIZE + 12) * scale);

                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: nodeSize,
                          height: nodeSize,
                          borderRadius: "999px",
                          backgroundColor: nodeBg,
                          border: `2px solid ${nodeBorder}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transform: `scale(${nodeScale})`,
                          boxShadow: isActive ? fx.boxShadow : "none",
                        }}
                      >
                        <span
                          style={{
                            fontSize: Math.round(22 * scale),
                            fontWeight: 800,
                            fontFamily: typo.fontFamily ?? "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
                            color: props.numberColor,
                          }}
                        >
                          {i + 1}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 14,
                          fontSize: Math.round(20 * scale),
                          fontWeight: isActive ? 700 : isCompleted ? 600 : 500,
                          fontFamily: typo.fontFamily ?? "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
                          color: labelColor,
                          opacity: isUpcoming ? 0.75 : 1,
                          textAlign: "center",
                          maxWidth: 180,
                        }}
                      >
                        {step.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* LAYOUT: CARD-BASED PROCESS FLOW (existing behavior) */}
        {layoutMode === "cards" && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: isPortrait ? "wrap" : "nowrap",
            alignItems: "stretch",
            justifyContent: "center",
            width: "100%",
            maxWidth: Math.round(width * 0.9) + "px",
            gap: Math.round(40 * scale),
          }}
        >
          {props.steps.map((step, i) => {
            const stagger = staggerDelay(i, stepCount, stepsDuration);
            const range = {
              startFrame: stepsStart + stagger.startFrame,
              endFrame: stepsStart + stagger.endFrame,
            };

            let stepOpacity = 1;
            let stepY = 0;

            if (props.entranceAnimation === "progressive") {
              stepOpacity = fadeIn(frame, range).opacity;
            } else if (props.entranceAnimation === "fade-in") {
              stepOpacity = fadeIn(frame, range).opacity;
            } else if (props.entranceAnimation === "slide-up") {
              const s = slideUp(frame, range, 30);
              stepOpacity = s.opacity;
              stepY = s.y;
            }

            // Connector between steps (not after last)
            const connectorOpacity = i < stepCount - 1
              ? (props.entranceAnimation === "progressive"
                ? interpolate(frame, [range.startFrame, range.endFrame], [0, 1], CLAMP)
                : stepOpacity)
              : 0;

            return (
              <React.Fragment key={i}>
                {/* Step */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    opacity: stepOpacity,
                    transform: `translateY(${stepY}px)`,
                    flex: 1,
                    minWidth: isPortrait ? "220px" : "260px",
                    maxWidth: isPortrait ? "280px" : "320px",
                    padding: Math.round(32 * scale),
                    borderRadius: Math.round(24 * scale),
                    backgroundColor: props.cardBackground,
                    boxShadow: fx.boxShadow,
                    border: `1px solid ${props.cardBorderColor}`,
                  }}
                >
                  {/* Number marker */}
                  <div
                    style={{
                      width: props.markerStyle === "pill" ? `${CIRCLE_SIZE * 1.5}px` : `${CIRCLE_SIZE}px`,
                      height: `${CIRCLE_SIZE}px`,
                      borderRadius: props.markerStyle === "circle" ? "50%" : props.markerStyle === "square" ? "6px" : "16px",
                      backgroundColor: props.stepColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: Math.round(20 * scale),
                        fontWeight: typo.fontWeight ?? "bold",
                        fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                        color: props.numberColor,
                      }}
                    >
                      {i + 1}
                    </span>
                  </div>

                  {/* Label */}
                  <div
                    style={{
                      fontSize: Math.round(24 * scale),
                      fontWeight: typo.fontWeight ?? 600,
                      fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                      color: props.textColor,
                      textAlign: "left",
                      maxWidth: "100%",
                      lineHeight: typo.lineHeight ?? 1.3,
                    }}
                  >
                    {step.label}
                  </div>

                  {/* Description */}
                  {step.description && (
                    <div
                      style={{
                        fontSize: Math.round(14 * scale),
                        fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                        color: props.descriptionColor,
                        textAlign: "left",
                        maxWidth: "100%",
                        marginTop: "8px",
                        lineHeight: typo.lineHeight ?? 1.3,
                      }}
                    >
                      {step.description}
                    </div>
                  )}
                </div>

                {/* Connector */}
                {i < stepCount - 1 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexDirection: "row",
                      height: "100%",
                      alignSelf: "stretch",
                      width: "auto",
                      flex: 1,
                      minWidth: "56px",
                      opacity: connectorOpacity,
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        height: "2px",
                        width: "100%",
                        flex: 1,
                        backgroundColor: props.connectorColor,
                        opacity: 0.5,
                        borderStyle: props.connectorStyle === "dashed" ? "dashed" : "solid",
                        borderWidth: props.connectorStyle === "dashed" ? "1px 0 0 0" : undefined,
                        borderColor: props.connectorStyle === "dashed" ? props.connectorColor : undefined,
                      }}
                    />
                    {props.connectorStyle === "arrow" && (
                      <span
                        style={{
                          fontSize: Math.round(20 * scale),
                          color: props.connectorColor,
                          opacity: 0.9,
                          marginLeft: "-2px",
                        }}
                      >
                        {"\u25B6"}
                      </span>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
