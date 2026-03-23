import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, slideUp, microFloat } from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveEffects } from "../../primitives/useEffects";
import { Asset } from "../../assets/Asset";
import type { TimelineSceneProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const TimelineScene: React.FC<TimelineSceneProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, isPortrait, scale } = useResponsiveConfig();

  const fontWeightMap: Record<string, number> = {
    regular: 400,
    medium: 500,
    bold: 700,
    black: 900,
  };

  const titleWeight = props.titleFontWeight ? fontWeightMap[props.titleFontWeight] : undefined;

  const subtitleWeight = props.subtitleFontWeight
    ? fontWeightMap[props.subtitleFontWeight]
    : undefined;

  const labelWeight = props.labelFontWeight
    ? fontWeightMap[props.labelFontWeight]
    : undefined;

  const descriptionWeight = props.descriptionFontWeight
    ? fontWeightMap[props.descriptionFontWeight]
    : undefined;

  const nodeSize = Math.round(props.nodeSizePx * scale);
  const timelineHeight = Math.round(200 * scale);
  const lineThickness = Math.max(2, Math.round(3 * scale));
  const lineY = Math.round(20 * scale);
  const nodeTop = Math.round(lineY - nodeSize / 2);

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

  const baseTypoWeight = typeof typo.fontWeight === "number" ? typo.fontWeight : 700;
  const titleWeightResolved = titleWeight ?? baseTypoWeight;
  const labelWeightResolved =
    labelWeight ?? (baseTypoWeight >= 900 ? 600 : baseTypoWeight >= 700 ? 500 : 400);
  const subtitleWeightResolved = subtitleWeight ?? labelWeightResolved;
  const descriptionWeightResolved =
    descriptionWeight ?? (labelWeightResolved >= 500 ? 400 : labelWeightResolved);

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
              fontWeight: titleWeightResolved,
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              letterSpacing: typo.letterSpacing ?? undefined,
              color: props.titleColor,
              marginBottom: Math.round(props.titleGapPx * scale) + "px",
              opacity: titleOpacity,
            }}
          >
            {props.title}
          </div>
        )}

        {/* Subtitle */}
        {props.subtitle && (
          <div
            style={{
              fontSize: Math.round(props.subtitleFontSizePx * scale) + "px",
              fontWeight: subtitleWeightResolved,
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.subtitleColor,
              marginBottom: Math.round(props.subtitleGapPx * scale) + "px",
              opacity: titleOpacity,
            }}
          >
            {props.subtitle}
          </div>
        )}

        {/* Timeline container */}
        <div
          style={{
            position: "relative",
            width: timelineWidth + "px",
            height: timelineHeight + "px",
          }}
        >
          {/* Horizontal line */}
          <div
            style={{
              position: "absolute",
              top: lineY + "px",
              left: "0",
              width: lineProgress + "%",
              height: lineThickness + "px",
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
                {/* Marker (icon-in-circle style when milestone.iconId is provided) */}
                <div
                  style={{
                    width: nodeSize + "px",
                    height: nodeSize + "px",
                    borderRadius: "9999px",
                    position: "absolute",
                    top: nodeTop + "px",
                    zIndex: 2,
                    backgroundColor:
                      ms.iconId && dotOpacity > 0 ? props.dotColor : "transparent",
                    border: `${Math.max(2, Math.round(2 * scale))}px solid ${
                      ms.iconId
                        ? dotOpacity > 0
                          ? props.dotColor
                          : props.dotColor + "40"
                        : props.markerStyle === "ring"
                          ? props.dotColor
                          : props.lineColor
                    }`,
                    opacity: ms.iconId ? 1 : dotOpacity,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {ms.iconId ? (
                    <div style={{ opacity: dotOpacity }}>
                      <Asset
                        id={ms.iconId}
                        width={Math.max(14, Math.round((nodeSize * 0.48) as number))}
                        height={Math.max(14, Math.round((nodeSize * 0.48) as number))}
                        color={props.textColor}
                      />
                    </div>
                  ) : (
                    // Fallback to the original dot/ring/diamond marker when iconId is missing.
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: props.markerStyle === "diamond" ? "2px" : "50%",
                        backgroundColor:
                          props.markerStyle === "ring" ? "transparent" : props.dotColor,
                        border:
                          "3px solid " +
                          (props.markerStyle === "ring" ? props.dotColor : props.lineColor),
                        transform: props.markerStyle === "diamond" ? "rotate(45deg)" : undefined,
                        opacity: dotOpacity,
                      }}
                    />
                  )}
                </div>

                {/* Label + description */}
                <div
                  style={{
                    position: "absolute",
                    top: nodeTop + nodeSize + Math.round(10 * scale) + "px",
                    textAlign: "center",
                    width: Math.round(180 * scale) + "px",
                    opacity: textOpacity,
                    transform: "translateY(" + textY + "px)",
                  }}
                >
                  <div
                    style={{
                      fontSize: Math.round(props.labelFontSizePx * scale) + "px",
                      fontWeight: labelWeightResolved,
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
                        fontSize: Math.round(props.descriptionFontSizePx * scale) + "px",
                        fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                        color: props.descriptionColor,
                        lineHeight: typo.lineHeight ?? 1.3,
                        letterSpacing: typo.letterSpacing ?? undefined,
                        fontWeight: descriptionWeightResolved,
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
