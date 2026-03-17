import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, slideUp, scalePop } from "../../primitives/animations";
import { Asset } from "../../assets/Asset";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { ProblemSolutionProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const ProblemSolution: React.FC<ProblemSolutionProps> = (props) => {
  const frame = useCurrentFrame();
  const { isPortrait, scale } = useResponsiveConfig();
  const totalFrames = secToFrame(props.duration);
  const exitStart = Math.round(totalFrames * 0.85);
  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);

  if (props.transitionStyle === "side-by-side") {
    return renderSideBySide(props, frame, totalFrames, exitOpacity, isPortrait, scale);
  }
  return renderSequential(props, frame, totalFrames, exitOpacity);
};

function renderSequential(
  props: ProblemSolutionProps,
  frame: number,
  totalFrames: number,
  exitOpacity: number
) {
  const problemEntrEnd = Math.round(totalFrames * 0.2);
  const transitionStart = Math.round(totalFrames * 0.4);
  const transitionEnd = Math.round(totalFrames * 0.55);
  const isSlideSwitch = props.transitionStyle === "slide-switch";

  // Problem animation
  let problemOpacity = 1;
  let problemY = 0;
  let problemX = 0;
  let problemScale = 1;

  if (props.entranceAnimation === "fade-in") {
    problemOpacity = fadeIn(frame, { startFrame: 0, endFrame: problemEntrEnd }).opacity;
  } else if (props.entranceAnimation === "slide-up") {
    const s = slideUp(frame, { startFrame: 0, endFrame: problemEntrEnd }, 40);
    problemOpacity = s.opacity;
    problemY = s.y;
  } else if (props.entranceAnimation === "scale-pop") {
    const p = scalePop(frame, { startFrame: 0, endFrame: problemEntrEnd }, 1.1);
    problemOpacity = p.opacity;
    problemScale = p.scale;
  }

  // Problem exit during transition
  if (frame >= transitionStart) {
    const fadeOutOpacity = interpolate(frame, [transitionStart, transitionEnd], [1, 0], CLAMP);
    problemOpacity *= fadeOutOpacity;
    if (isSlideSwitch) {
      problemX = interpolate(frame, [transitionStart, transitionEnd], [0, -200], CLAMP);
    }
  }

  // Solution entrance during transition
  let solutionOpacity = interpolate(frame, [transitionStart, transitionEnd], [0, 1], CLAMP);
  let solutionX = isSlideSwitch
    ? interpolate(frame, [transitionStart, transitionEnd], [200, 0], CLAMP)
    : 0;
  let solutionY = !isSlideSwitch
    ? interpolate(frame, [transitionStart, transitionEnd], [30, 0], CLAMP)
    : 0;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} />

      {/* Problem */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: problemOpacity * exitOpacity,
          transform: `translateX(${problemX}px) translateY(${problemY}px) scale(${problemScale})`,
        }}
      >
        {renderSection(props.problemLabel, props.problem, props.problemColor, props.problemIconId, props)}
      </div>

      {/* Solution */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: solutionOpacity * exitOpacity,
          transform: `translateX(${solutionX}px) translateY(${solutionY}px)`,
        }}
      >
        {renderSection(props.solutionLabel, props.solution, props.solutionColor, props.solutionIconId, props)}
      </div>
    </AbsoluteFill>
  );
}

function renderSideBySide(
  props: ProblemSolutionProps,
  frame: number,
  totalFrames: number,
  exitOpacity: number,
  isPortrait: boolean,
  scale: number
) {
  const entrEnd = Math.round(totalFrames * 0.25);

  let leftOpacity = 1;
  let rightOpacity = 1;
  let leftX = 0;
  let rightX = 0;

  if (props.entranceAnimation === "fade-in") {
    leftOpacity = fadeIn(frame, { startFrame: 0, endFrame: entrEnd }).opacity;
    rightOpacity = fadeIn(frame, { startFrame: Math.round(totalFrames * 0.08), endFrame: Math.round(totalFrames * 0.3) }).opacity;
  } else if (props.entranceAnimation === "slide-up" || props.entranceAnimation === "scale-pop") {
    leftX = interpolate(frame, [0, entrEnd], [-60, 0], CLAMP);
    leftOpacity = interpolate(frame, [0, entrEnd], [0, 1], CLAMP);
    rightX = interpolate(frame, [Math.round(totalFrames * 0.08), Math.round(totalFrames * 0.3)], [60, 0], CLAMP);
    rightOpacity = interpolate(frame, [Math.round(totalFrames * 0.08), Math.round(totalFrames * 0.3)], [0, 1], CLAMP);
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: isPortrait ? "column" : "row",
          opacity: exitOpacity,
        }}
      >
        {/* Problem side */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: Math.round(60 * scale) + "px " + Math.round(40 * scale) + "px",
            opacity: leftOpacity,
            transform: `translateX(${leftX}px)`,
            borderTop: `4px solid ${props.problemColor}`,
          }}
        >
          {renderSection(props.problemLabel, props.problem, props.problemColor, props.problemIconId, props)}
        </div>

        {/* Divider */}
        <div style={{ width: isPortrait ? "50%" : "2px", alignSelf: "center", height: isPortrait ? "2px" : "50%", backgroundColor: "#333" }} />

        {/* Solution side */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: Math.round(60 * scale) + "px " + Math.round(40 * scale) + "px",
            opacity: rightOpacity,
            transform: `translateX(${rightX}px)`,
            borderTop: `4px solid ${props.solutionColor}`,
          }}
        >
          {renderSection(props.solutionLabel, props.solution, props.solutionColor, props.solutionIconId, props)}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function renderSection(
  label: string,
  text: string,
  accentColor: string,
  iconId: string | undefined,
  props: ProblemSolutionProps
) {
  return (
    <>
      {/* Label badge */}
      <div
        style={{
          padding: "8px 24px",
          borderRadius: "20px",
          backgroundColor: accentColor + "30",
          border: `2px solid ${accentColor}`,
          marginBottom: "24px",
        }}
      >
        <span
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            fontFamily: "Arial, Helvetica, sans-serif",
            color: props.labelColor,
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          {label}
        </span>
      </div>

      {/* Icon */}
      {iconId && (
        <div style={{ marginBottom: "20px" }}>
          <Asset id={iconId} width={64} height={64} color={accentColor} />
        </div>
      )}

      {/* Text */}
      <div
        style={{
          fontSize: "32px",
          fontFamily: "Arial, Helvetica, sans-serif",
          color: props.textColor,
          textAlign: "center",
          lineHeight: 1.4,
          maxWidth: "600px",
        }}
      >
        {text}
      </div>
    </>
  );
}
