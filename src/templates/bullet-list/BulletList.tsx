import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, fadeIn, slideUp, scalePop, staggerDelay } from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { BulletListProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const BULLET_MARKERS: Record<string, (index: number) => string> = {
  dot: () => "\u2022",
  checkmark: () => "\u2713",
  number: (i) => `${i + 1}.`,
  dash: () => "\u2014",
  arrow: () => "\u25B6",
};

export const BulletList: React.FC<BulletListProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, scale } = useResponsiveConfig();
  const totalFrames = secToFrame(props.duration);

  const titleEnd = Math.round(totalFrames * 0.15);
  const itemsStart = Math.round(totalFrames * 0.1);
  const itemsDuration = Math.round(totalFrames * 0.5);
  const exitStart = Math.round(totalFrames * 0.85);

  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);

  // Title animation
  let titleOpacity = 1;
  let titleY = 0;
  if (props.title && props.entranceAnimation !== "none") {
    titleOpacity = interpolate(frame, [0, titleEnd], [0, 1], CLAMP);
    titleY = interpolate(frame, [0, titleEnd], [20, 0], CLAMP);
  }

  const getMarker = BULLET_MARKERS[props.bulletStyle] ?? BULLET_MARKERS.dot;

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
          maxWidth: Math.round(width * 0.85) + "px",
          width: "80%",
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
              marginBottom: "40px",
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
            }}
          >
            {props.title}
          </div>
        )}

        {/* Bullet items */}
        {props.items.map((item, i) => {
          const stagger = staggerDelay(i, props.items.length, itemsDuration);
          const range = {
            startFrame: itemsStart + stagger.startFrame,
            endFrame: itemsStart + stagger.endFrame,
          };

          let itemOpacity = 1;
          let itemY = 0;
          let itemScale = 1;

          if (props.entranceAnimation === "fade-in") {
            itemOpacity = fadeIn(frame, range).opacity;
          } else if (props.entranceAnimation === "slide-up") {
            const s = slideUp(frame, range, 30);
            itemOpacity = s.opacity;
            itemY = s.y;
          } else if (props.entranceAnimation === "scale-pop") {
            const p = scalePop(frame, range);
            itemOpacity = p.opacity;
            itemScale = p.scale;
          }

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "16px",
                padding: "12px 0",
                opacity: itemOpacity,
                transform: `translateY(${itemY}px) scale(${itemScale})`,
              }}
            >
              <span
                style={{
                  fontSize: Math.round(28 * scale) + "px",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  color: props.bulletColor,
                  fontWeight: "bold",
                  flexShrink: 0,
                  minWidth: props.bulletStyle === "number" ? "36px" : "20px",
                }}
              >
                {getMarker(i)}
              </span>
              <span
                style={{
                  fontSize: Math.round(30 * scale) + "px",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  color: props.textColor,
                  lineHeight: 1.4,
                }}
              >
                {item}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
