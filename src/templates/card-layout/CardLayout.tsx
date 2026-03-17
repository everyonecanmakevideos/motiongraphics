import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, staggerDelay, fadeIn, slideUp, scalePop } from "../../primitives/animations";
import { Asset } from "../../assets/Asset";
import type { CardLayoutProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const CardLayout: React.FC<CardLayoutProps> = (props) => {
  const frame = useCurrentFrame();
  const totalFrames = secToFrame(props.duration);

  // Phase timing
  const titleEnd = Math.round(totalFrames * 0.12);
  const cardsStart = Math.round(totalFrames * 0.1);
  const cardsEnd = Math.round(totalFrames * 0.6);
  const exitStart = Math.round(totalFrames * 0.85);

  const titleOpacity = props.title
    ? interpolate(frame, [0, titleEnd], [0, 1], CLAMP)
    : 0;
  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);

  const entranceFrames = cardsEnd - cardsStart;
  const cardCount = props.cards.length;

  // Card dimensions
  const gap = 24;
  const cols = Math.min(props.columns, cardCount);
  const cardWidth = Math.round((1400 - gap * (cols - 1)) / cols);

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
          alignItems: "center",
          opacity: exitOpacity,
        }}
      >
        {/* Title */}
        {props.title && (
          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: props.titleColor,
              marginBottom: "40px",
              opacity: titleOpacity,
            }}
          >
            {props.title}
          </div>
        )}

        {/* Card grid */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: gap + "px",
            justifyContent: "center",
            maxWidth: "1440px",
          }}
        >
          {props.cards.map((card, i) => {
            const range = staggerDelay(i, cardCount, entranceFrames);
            const adjustedRange = {
              startFrame: range.startFrame + cardsStart,
              endFrame: range.endFrame + cardsStart,
            };

            let cardOpacity = 1;
            let cardY = 0;
            let cardScale = 1;

            if (props.entranceAnimation === "fade-in") {
              cardOpacity = fadeIn(frame, adjustedRange).opacity;
            } else if (props.entranceAnimation === "slide-up") {
              const s = slideUp(frame, adjustedRange, 40);
              cardOpacity = s.opacity;
              cardY = s.y;
            } else if (props.entranceAnimation === "scale-pop") {
              const p = scalePop(frame, adjustedRange, 1.08);
              cardOpacity = p.opacity;
              cardScale = p.scale;
            }

            const accent = card.accentColor ?? props.iconColor;

            return (
              <div
                key={i}
                style={{
                  width: cardWidth + "px",
                  backgroundColor: props.cardBackground,
                  borderRadius: "12px",
                  padding: "32px 28px",
                  borderTop: "3px solid " + accent,
                  opacity: cardOpacity,
                  transform: "translateY(" + cardY + "px) scale(" + cardScale + ")",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {/* Optional icon */}
                {card.iconId && (
                  <div style={{ marginBottom: "4px" }}>
                    <Asset
                      id={card.iconId}
                      width={40}
                      height={40}
                      color={accent}
                    />
                  </div>
                )}

                {/* Heading */}
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    color: props.headingColor,
                    lineHeight: 1.2,
                  }}
                >
                  {card.heading}
                </div>

                {/* Body */}
                {card.body && (
                  <div
                    style={{
                      fontSize: "18px",
                      fontFamily: "Arial, sans-serif",
                      color: props.bodyColor,
                      lineHeight: 1.4,
                    }}
                  >
                    {card.body}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
