import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, slideUp, scalePop, staggerDelay } from "../../primitives/animations";
import { Asset } from "../../assets/Asset";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { FeatureHighlightProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const FeatureHighlight: React.FC<FeatureHighlightProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, isPortrait, scale } = useResponsiveConfig();
  const totalFrames = secToFrame(props.duration);

  const iconEnd = Math.round(totalFrames * 0.2);
  const titleStart = Math.round(totalFrames * 0.05);
  const titleEnd = Math.round(totalFrames * 0.25);
  const descStart = Math.round(totalFrames * 0.15);
  const descEnd = Math.round(totalFrames * 0.35);
  const bulletsStart = Math.round(totalFrames * 0.25);
  const bulletsDuration = Math.round(totalFrames * 0.35);
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

  // Title animation
  let titleOpacity = 1;
  let titleY = 0;
  if (props.entranceAnimation !== "none") {
    titleOpacity = interpolate(frame, [titleStart, titleEnd], [0, 1], CLAMP);
    titleY = interpolate(frame, [titleStart, titleEnd], [20, 0], CLAMP);
  }

  // Description animation
  let descOpacity = 1;
  let descY = 0;
  if (props.entranceAnimation !== "none" && props.description) {
    descOpacity = interpolate(frame, [descStart, descEnd], [0, 1], CLAMP);
    descY = interpolate(frame, [descStart, descEnd], [15, 0], CLAMP);
  }

  const isHorizontal = !isPortrait && (props.layout === "icon-left" || props.layout === "icon-right");
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
          alignItems: isHorizontal ? "flex-start" : "center",
          gap: isHorizontal ? Math.round(60 * scale) + "px" : "24px",
          maxWidth: "80%",
          opacity: exitOpacity,
        }}
      >
        {/* Icon */}
        <div
          style={{
            opacity: iconOpacity,
            transform: `translateY(${iconY}px) scale(${iconScale})`,
            flexShrink: 0,
          }}
        >
          <Asset
            id={props.iconId}
            width={120}
            height={120}
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
          {/* Title */}
          <div
            style={{
              fontSize: Math.round(44 * scale) + "px",
              fontWeight: "bold",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: props.titleColor,
              lineHeight: 1.1,
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
            }}
          >
            {props.title}
          </div>

          {/* Description */}
          {props.description && (
            <div
              style={{
                fontSize: "24px",
                fontFamily: "Arial, Helvetica, sans-serif",
                color: props.descriptionColor,
                lineHeight: 1.4,
                marginTop: "16px",
                maxWidth: Math.round(width * 0.55) + "px",
                opacity: descOpacity,
                transform: `translateY(${descY}px)`,
              }}
            >
              {props.description}
            </div>
          )}

          {/* Bullet points */}
          {props.bulletPoints && props.bulletPoints.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              {props.bulletPoints.map((point, i) => {
                const stagger = staggerDelay(i, props.bulletPoints!.length, bulletsDuration);
                const range = {
                  startFrame: bulletsStart + stagger.startFrame,
                  endFrame: bulletsStart + stagger.endFrame,
                };

                let bOpacity = 1;
                let bY = 0;
                if (props.entranceAnimation !== "none") {
                  bOpacity = fadeIn(frame, range).opacity;
                  bY = interpolate(frame, [range.startFrame, range.endFrame], [15, 0], CLAMP);
                }

                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "12px",
                      padding: "6px 0",
                      opacity: bOpacity,
                      transform: `translateY(${bY}px)`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        color: props.accentColor,
                        flexShrink: 0,
                      }}
                    >
                      {"\u25CF"}
                    </span>
                    <span
                      style={{
                        fontSize: "22px",
                        fontFamily: "Arial, Helvetica, sans-serif",
                        color: props.bulletColor,
                        lineHeight: 1.3,
                      }}
                    >
                      {point}
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
