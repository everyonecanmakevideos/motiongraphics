import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, slideUp, staggerDelay, microFloat } from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveEffects } from "../../primitives/useEffects";
import { Asset } from "../../assets/Asset";
import type { ProcessStepsProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const ProcessSteps: React.FC<ProcessStepsProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, isPortrait, scale } = useResponsiveConfig();

  // `useResponsiveConfig` uses `shortSide/1080` as its scale basis.
  // In your preview composition, shortSide is commonly ~540, so `scale` is ~0.5.
  // This template was originally authored with hardcoded pixel sizes that match that
  // ~540 short-side canvas. To keep the same intended visual scale while making
  // the layout responsive, we calibrate with `localScale`.
  const localScale = scale * 2;

  const markerSize = Math.round(props.nodeSizePx * localScale);
  const markerPillWidth = Math.round(props.nodeSizePx * 1.5 * localScale);
  const stepMinWidth = Math.round(120 * localScale);
  const titleMarginBottom = Math.round(props.titleGapPx * localScale);
  const stepMarkerMarginBottom = Math.round(16 * localScale);
  const numberFontSize = Math.round(markerSize * 0.42);
  const stepLabelFontSize = Math.round(props.labelFontSizePx * localScale);
  const descriptionFontSize = Math.round(props.descriptionFontSizePx * localScale);
  const connectorArrowFontSize = Math.round(16 * localScale);
  const connectorLineThickness = Math.max(1, Math.round(2 * localScale));
  const iconSize = Math.max(14, Math.round(markerSize * 0.48));

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

  const fontWeightMap: Record<string, number> = {
    regular: 400,
    medium: 500,
    bold: 700,
    black: 900,
  };

  const baseTypoWeight = typeof typo.fontWeight === "number" ? typo.fontWeight : 700;
  const titleWeightResolved = props.titleFontWeight ? fontWeightMap[props.titleFontWeight] : baseTypoWeight;
  const defaultLabelWeight = baseTypoWeight >= 900 ? 600 : baseTypoWeight >= 700 ? 500 : 400;
  const labelWeightResolved = props.labelFontWeight ? fontWeightMap[props.labelFontWeight] : defaultLabelWeight;
  const subtitleWeightResolved = props.subtitleFontWeight ? fontWeightMap[props.subtitleFontWeight] : labelWeightResolved;
  const descriptionWeightResolved = props.descriptionFontWeight
    ? fontWeightMap[props.descriptionFontWeight]
    : labelWeightResolved >= 500
      ? 400
      : labelWeightResolved;

  const totalFrames = secToFrame(props.duration);

  const titleEnd = Math.round(totalFrames * 0.12 * motion.durationMultiplier);
  const stepsStart = Math.round(totalFrames * 0.1);
  // Keep nodes "revealing" longer so the sequence doesn't feel like a blink.
  // And keep them filled for the rest of the composition.
  const stepsDuration = Math.round(totalFrames * 0.8);
  const exitStart = Math.round(totalFrames * 0.95);
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
  const stepRanges = props.steps.map((_, i) => {
    const stagger = staggerDelay(i, stepCount, stepsDuration);
    return {
      startFrame: stepsStart + stagger.startFrame,
      endFrame: stepsStart + stagger.endFrame,
    };
  });

  // If `currentStep` is not provided, auto-highlight based on time so onboarding
  // prompts still get a "current step" visual progression.
  const activeIndexAuto = frame >= stepsStart && frame < stepsStart + stepsDuration
    ? (() => {
        let idx = 0;
        for (let i = 0; i < stepRanges.length; i++) {
          if (frame >= stepRanges[i].startFrame) idx = i;
        }
        return idx;
      })()
    : null;

  const activeIndexFromProp =
    typeof props.currentStep === "number"
      ? Math.min(stepCount - 1, Math.max(0, props.currentStep - 1))
      : null;

  const activeIndex = activeIndexFromProp ?? activeIndexAuto;

  const resolvedActiveStepColor = props.activeStepColor ?? props.stepColor;
  const resolvedActiveNumberColor = props.activeNumberColor ?? props.numberColor;
  const resolvedActiveTextColor = props.activeTextColor ?? props.textColor;
  const resolvedActiveDescriptionColor = props.activeDescriptionColor ?? props.descriptionColor;
  const resolvedActiveGlowColor = props.activeGlowColor ?? resolvedActiveStepColor;
  const resolvedActiveGlowStrength = props.activeGlowStrength ?? 28;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateY(${floatY}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: exitOpacity,
          width: "100%",
          // Avoid rendering a "card" shadow around a content-sized wrapper.
          // The template should feel like it occupies the whole composition.
          boxShadow: "none",
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        {/* Heading overlay: absolute so it doesn't push the timeline off-center. */}
        {(props.title || props.subtitle) && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: `${Math.round(18 * localScale)}px`,
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              pointerEvents: "none",
            }}
          >
            {/* Title */}
            {props.title && (
              <div
                style={{
                  fontSize: Math.round(44 * localScale) + "px",
                  fontWeight: titleWeightResolved,
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: props.titleColor,
                  marginBottom: `${titleMarginBottom}px`,
                  opacity: titleOpacity,
                  transform: `translateY(${titleY}px)`,
                }}
              >
                {props.title}
              </div>
            )}

            {/* Subtitle (premium hierarchy) */}
            {props.subtitle && (
              <div
                style={{
                  fontSize: Math.round(props.subtitleFontSizePx * localScale) + "px",
                  fontWeight: subtitleWeightResolved,
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: props.subtitleColor,
                  marginBottom: Math.round(props.subtitleGapPx * localScale) + "px",
                  opacity: titleOpacity,
                }}
              >
                {props.subtitle}
              </div>
            )}
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
            maxWidth: Math.round(width) + "px",
            paddingLeft: `${Math.round(width * 0.07)}px`,
            paddingRight: `${Math.round(width * 0.07)}px`,
            boxSizing: "border-box",
          }}
        >
          {props.steps.map((step, i) => {
            const range = stepRanges[i];

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

            const isProgressive = props.entranceAnimation === "progressive";
            const nodeOpacity = Math.max(0.25, stepOpacity);
            const nodeIsFilled = isProgressive ? frame >= range.endFrame : nodeOpacity >= 0.999;

            const glowActive = isProgressive
              ? frame >= range.startFrame && frame < range.endFrame
              : activeIndex !== null && i === activeIndex;

            const activeGlowProgress = glowActive
              ? interpolate(frame, [range.startFrame, range.endFrame], [0, 1], CLAMP)
              : 0;
            const glowPx = glowActive ? resolvedActiveGlowStrength * activeGlowProgress : 0;
            const pulseWindowFrames = Math.max(8, Math.round(totalFrames * 0.08));
            const pulseProgressFrames = frame - range.endFrame;
            const pulseActive = pulseProgressFrames >= 0 && pulseProgressFrames <= pulseWindowFrames;
            // One zoom-in/out pulse only when the node becomes "reached" (range.endFrame).
            const activePulse = pulseActive
              ? 1 + 0.06 * Math.sin((pulseProgressFrames / pulseWindowFrames) * Math.PI)
              : 1;

            // Connector between steps (not after last)
            const nextRange = i < stepCount - 1 ? stepRanges[i + 1] : null;

            const connectorOpacity =
              i < stepCount - 1 && nextRange && isProgressive
                ? fadeIn(frame, nextRange).opacity
                : i < stepCount - 1
                  ? activeIndex !== null && i < activeIndex
                    ? 1
                    : 0
                  : 0;

            const connectorIsActive =
              i < stepCount - 1 && nextRange && isProgressive
                ? frame >= nextRange.startFrame && frame < nextRange.endFrame
                : activeIndex !== null && i === activeIndex;

            const connectorCompleted =
              i < stepCount - 1 && nextRange && isProgressive
                ? frame >= nextRange.endFrame
                : activeIndex !== null && i < activeIndex;

            const connectorThicknessPx =
              props.connectorStyle === "dashed"
                ? connectorLineThickness
                : Math.max(connectorLineThickness, Math.round(6 * localScale));

            return (
              <React.Fragment key={i}>
                {/* Step */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    opacity: 1,
                    transform: `translateY(${stepY}px) scale(${activePulse})`,
                    flex: 0,
                    minWidth: `${stepMinWidth}px`,
                  }}
                >
                  {/* Step marker (number OR icon) */}
                  <div
                    style={{
                      width: props.markerStyle === "pill" ? `${markerPillWidth}px` : `${markerSize}px`,
                      height: `${markerSize}px`,
                      borderRadius: props.markerStyle === "circle" ? "50%" : props.markerStyle === "square" ? "6px" : "16px",
                      backgroundColor: nodeIsFilled ? resolvedActiveStepColor : "transparent",
                      border: `${Math.max(2, Math.round(2 * localScale))}px solid ${
                        nodeIsFilled ? resolvedActiveStepColor : props.stepColor
                      }`,
                      opacity: nodeOpacity,
                      boxShadow: glowActive
                        ? `0 0 ${glowPx}px ${resolvedActiveGlowColor}, 0 0 ${glowPx / 2}px ${resolvedActiveGlowColor}`
                        : undefined,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: `${stepMarkerMarginBottom}px`,
                    }}
                  >
                    {step.iconId ? (
                      <div style={{ opacity: stepOpacity }}>
                        <Asset
                          id={step.iconId}
                          width={iconSize}
                          height={iconSize}
                          color={nodeIsFilled ? resolvedActiveNumberColor : props.numberColor}
                        />
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: `${numberFontSize}px`,
                          fontWeight: labelWeightResolved,
                          fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                          color: nodeIsFilled ? resolvedActiveNumberColor : props.numberColor,
                          textShadow: glowActive ? `0 0 ${glowPx / 1.5}px ${resolvedActiveGlowColor}` : undefined,
                        }}
                      >
                        {i + 1}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <div
                    style={{
                      fontSize: `${stepLabelFontSize}px`,
                      fontWeight: labelWeightResolved,
                      fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                      color: nodeIsFilled ? resolvedActiveTextColor : props.textColor,
                      opacity: nodeOpacity,
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
                        fontSize: `${descriptionFontSize}px`,
                        fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                        color: nodeIsFilled ? resolvedActiveDescriptionColor : props.descriptionColor,
                        fontWeight: descriptionWeightResolved,
                        textAlign: "center",
                        maxWidth: "140px",
                        marginTop: `${Math.round(8 * localScale)}px`,
                        opacity: nodeOpacity,
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
                      height: isPortrait ? undefined : `${markerSize}px`,
                      width: isPortrait ? `${markerSize}px` : undefined,
                      flex: 1,
                      minWidth: isPortrait ? undefined : "40px",
                      minHeight: isPortrait ? "30px" : undefined,
                      opacity: Math.max(0.25, connectorOpacity),
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        height: isPortrait ? undefined : `${connectorThicknessPx}px`,
                        width: isPortrait ? `${connectorThicknessPx}px` : undefined,
                        flex: 1,
                        backgroundColor: connectorCompleted ? resolvedActiveGlowColor : props.stepColor,
                        opacity: 0.15 + 0.85 * connectorOpacity,
                        borderStyle: props.connectorStyle === "dashed" ? "dashed" : "solid",
                        borderWidth: props.connectorStyle === "dashed" ? "1px 0 0 0" : undefined,
                        borderColor: props.connectorStyle === "dashed"
                          ? (connectorCompleted ? resolvedActiveGlowColor : props.stepColor)
                          : undefined,
                      }}
                    />
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
