import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, slideUp, scalePop } from "../../primitives/animations";
import { Asset } from "../../assets/Asset";
import type { IconCalloutProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const IconCallout: React.FC<IconCalloutProps> = (props) => {
  const frame = useCurrentFrame();
  const totalFrames = secToFrame(props.duration);

  // Phase timing
  const iconEnd = Math.round(totalFrames * 0.2);
  const textStart = Math.round(totalFrames * 0.12);
  const textEnd = Math.round(totalFrames * 0.35);
  const descStart = Math.round(totalFrames * 0.22);
  const descEnd = Math.round(totalFrames * 0.42);
  const exitStart = Math.round(totalFrames * 0.85);

  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);

  // Icon animation
  let iconOpacity = 1;
  let iconScale = 1;
  let iconY = 0;
  if (props.entranceAnimation === "fade-in") {
    iconOpacity = fadeIn(frame, { startFrame: 0, endFrame: iconEnd }).opacity;
  } else if (props.entranceAnimation === "slide-up") {
    const s = slideUp(frame, { startFrame: 0, endFrame: iconEnd }, 40);
    iconOpacity = s.opacity;
    iconY = s.y;
  } else if (props.entranceAnimation === "scale-pop") {
    const p = scalePop(frame, { startFrame: 0, endFrame: iconEnd }, 1.2);
    iconOpacity = p.opacity;
    iconScale = p.scale;
  }

  // Text animation
  let textOpacity = 1;
  let textY = 0;
  if (props.entranceAnimation !== "none") {
    textOpacity = interpolate(frame, [textStart, textEnd], [0, 1], CLAMP);
    textY = interpolate(frame, [textStart, textEnd], [20, 0], CLAMP);
  }

  // Description animation
  let descOpacity = 1;
  let descY = 0;
  if (props.entranceAnimation !== "none") {
    descOpacity = interpolate(frame, [descStart, descEnd], [0, 1], CLAMP);
    descY = interpolate(frame, [descStart, descEnd], [15, 0], CLAMP);
  }

  const isHorizontal = props.layout === "icon-left" || props.layout === "icon-right";
  const isRight = props.layout === "icon-right";

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
          flexDirection: isHorizontal ? (isRight ? "row-reverse" : "row") : "column",
          alignItems: "center",
          gap: isHorizontal ? "50px" : "24px",
          maxWidth: "80%",
          opacity: exitOpacity,
        }}
      >
        {/* Icon */}
        <div
          style={{
            opacity: iconOpacity,
            transform: "translateY(" + iconY + "px) scale(" + iconScale + ")",
            flexShrink: 0,
          }}
        >
          <Asset
            id={props.iconId}
            width={props.iconSize}
            height={props.iconSize}
            color={props.iconColor}
          />
        </div>

        {/* Text content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: isHorizontal ? "flex-start" : "center",
            textAlign: isHorizontal ? "left" : "center",
          }}
        >
          <div
            style={{
              fontSize: "56px",
              fontWeight: "bold",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: props.headlineColor,
              lineHeight: 1.1,
              opacity: textOpacity,
              transform: "translateY(" + textY + "px)",
            }}
          >
            {props.headline}
          </div>

          {props.description && (
            <div
              style={{
                fontSize: "26px",
                fontFamily: "Arial, Helvetica, sans-serif",
                color: props.descriptionColor,
                lineHeight: 1.4,
                marginTop: "16px",
                maxWidth: "600px",
                opacity: descOpacity,
                transform: "translateY(" + descY + "px)",
              }}
            >
              {props.description}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
