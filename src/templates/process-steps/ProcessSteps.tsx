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
          width: "85%",
          boxShadow: fx.boxShadow,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        {/* Title */}
        {props.title && (
          <div
            style={{
              fontSize: Math.round(44 * scale) + "px",
              fontWeight: typo.fontWeight ?? "bold",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.titleColor,
              marginBottom: "60px",
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
            }}
          >
            {props.title}
          </div>
        )}

        {/* Steps row */}
        <div
          style={{
            display: "flex",
            flexDirection: isPortrait ? "column" : "row",
            alignItems: isPortrait ? "center" : "flex-start",
            justifyContent: "center",
            width: "100%",
            maxWidth: Math.round(width * 0.85) + "px",
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
                    alignItems: "center",
                    opacity: stepOpacity,
                    transform: `translateY(${stepY}px)`,
                    flex: 0,
                    minWidth: "120px",
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
                        fontSize: "22px",
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
                      fontSize: "20px",
                      fontWeight: typo.fontWeight ?? "bold",
                      fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                      color: props.textColor,
                      textAlign: "center",
                      maxWidth: "150px",
                      lineHeight: typo.lineHeight ?? 1.3,
                    }}
                  >
                    {step.label}
                  </div>

                  {/* Description */}
                  {step.description && (
                    <div
                      style={{
                        fontSize: "15px",
                        fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                        color: props.descriptionColor,
                        textAlign: "center",
                        maxWidth: "140px",
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
                      alignItems: isPortrait ? "center" : "center",
                      flexDirection: isPortrait ? "column" : "row",
                      height: isPortrait ? undefined : `${CIRCLE_SIZE}px`,
                      width: isPortrait ? `${CIRCLE_SIZE}px` : undefined,
                      flex: 1,
                      minWidth: isPortrait ? undefined : "40px",
                      minHeight: isPortrait ? "30px" : undefined,
                      opacity: connectorOpacity,
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        height: isPortrait ? undefined : "2px",
                        width: isPortrait ? "2px" : undefined,
                        flex: 1,
                        backgroundColor: props.stepColor,
                        opacity: 0.5,
                        borderStyle: props.connectorStyle === "dashed" ? "dashed" : "solid",
                        borderWidth: props.connectorStyle === "dashed" ? "1px 0 0 0" : undefined,
                        borderColor: props.connectorStyle === "dashed" ? props.stepColor : undefined,
                      }}
                    />
                    {props.connectorStyle === "arrow" && (
                      <span
                        style={{
                          fontSize: "16px",
                          color: props.stepColor,
                          opacity: 0.7,
                          marginLeft: "-4px",
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
      </div>
    </AbsoluteFill>
  );
};
