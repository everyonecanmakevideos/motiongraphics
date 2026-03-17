import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, slideUp, scalePop, blurReveal, underlineDraw, highlightReveal } from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { SectionTitleProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const SectionTitle: React.FC<SectionTitleProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, scale } = useResponsiveConfig();
  const totalFrames = secToFrame(props.duration);

  const entrEnd = Math.round(totalFrames * 0.25);
  const subtitleStart = Math.round(totalFrames * 0.12);
  const subtitleEnd = Math.round(totalFrames * 0.35);
  const accentStart = Math.round(totalFrames * 0.08);
  const accentEnd = Math.round(totalFrames * 0.3);
  const exitStart = Math.round(totalFrames * 0.82);

  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);

  // Title entrance animation
  let titleOpacity = 1;
  let titleY = 0;
  let titleScale = 1;
  let titleBlur = 0;

  if (props.entranceAnimation === "fade-in") {
    titleOpacity = fadeIn(frame, { startFrame: 0, endFrame: entrEnd }).opacity;
  } else if (props.entranceAnimation === "slide-up") {
    const s = slideUp(frame, { startFrame: 0, endFrame: entrEnd }, 50);
    titleOpacity = s.opacity;
    titleY = s.y;
  } else if (props.entranceAnimation === "scale-pop") {
    const p = scalePop(frame, { startFrame: 0, endFrame: entrEnd }, 1.15);
    titleOpacity = p.opacity;
    titleScale = p.scale;
  } else if (props.entranceAnimation === "blur-reveal") {
    const b = blurReveal(frame, { startFrame: 0, endFrame: entrEnd });
    titleOpacity = b.opacity;
    titleScale = b.scale;
    titleBlur = b.blur;
  }

  // Subtitle animation
  let subtitleOpacity = 1;
  let subtitleY = 0;
  if (props.entranceAnimation !== "none" && props.subtitle) {
    subtitleOpacity = interpolate(frame, [subtitleStart, subtitleEnd], [0, 1], CLAMP);
    subtitleY = interpolate(frame, [subtitleStart, subtitleEnd], [20, 0], CLAMP);
  }

  // Accent animation
  const accentProgress = props.accentStyle !== "none"
    ? (props.accentStyle === "dot"
      ? highlightReveal(frame, { startFrame: accentStart, endFrame: accentEnd })
      : underlineDraw(frame, { startFrame: accentStart, endFrame: accentEnd }))
    : 1;

  const isLeft = props.alignment === "left";

  const fontSizeMultiplier = props.fontSize === "medium" ? 0.75 : props.fontSize === "xlarge" ? 1.3 : 1;
  const baseFontSize = Math.round((props.title.length > 40 ? 52 : props.title.length > 20 ? 64 : 80) * scale * fontSizeMultiplier);

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
          alignItems: isLeft ? "flex-start" : "center",
          textAlign: isLeft ? "left" : "center",
          maxWidth: "80%",
          opacity: exitOpacity,
          paddingLeft: isLeft ? Math.round(120 * scale) + "px" : undefined,
        }}
      >
        {/* Accent: line-top */}
        {props.accentStyle === "line-top" && (
          <div
            style={{
              width: `${accentProgress}%`,
              height: "4px",
              backgroundColor: props.accentColor,
              marginBottom: "24px",
              maxWidth: "120px",
            }}
          />
        )}

        {/* Accent: dot */}
        {props.accentStyle === "dot" && (
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: props.accentColor,
              marginBottom: "20px",
              transform: `scale(${accentProgress})`,
              opacity: accentProgress,
            }}
          />
        )}

        {/* Title row with optional line-left */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {props.accentStyle === "line-left" && (
            <div
              style={{
                width: "4px",
                height: `${accentProgress}%`,
                maxHeight: "80px",
                backgroundColor: props.accentColor,
                flexShrink: 0,
              }}
            />
          )}

          <div
            style={{
              fontSize: `${baseFontSize}px`,
              fontWeight: "bold",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: props.titleColor,
              lineHeight: 1.1,
              opacity: titleOpacity,
              transform: `translateY(${titleY}px) scale(${titleScale})`,
              filter: titleBlur > 0 ? `blur(${titleBlur}px)` : undefined,
            }}
          >
            {props.title}
          </div>
        </div>

        {/* Accent: line-bottom */}
        {props.accentStyle === "line-bottom" && (
          <div
            style={{
              width: `${accentProgress}%`,
              height: "4px",
              backgroundColor: props.accentColor,
              marginTop: "20px",
              maxWidth: "200px",
            }}
          />
        )}

        {/* Subtitle */}
        {props.subtitle && (
          <div
            style={{
              fontSize: Math.round(28 * scale) + "px",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: props.subtitleColor,
              lineHeight: 1.4,
              marginTop: "20px",
              opacity: subtitleOpacity,
              transform: `translateY(${subtitleY}px)`,
            }}
          >
            {props.subtitle}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
