import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import { secToFrame, staggerDelay, fadeIn, slideUp, scalePop, microFloat } from "../../primitives/animations";
import { Asset } from "../../assets/Asset";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveEffects } from "../../primitives/useEffects";
import type { CardLayoutProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const CardLayout: React.FC<CardLayoutProps> = (props) => {
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

  // Phase timing
  const titleEnd = Math.round(totalFrames * 0.12 * motion.durationMultiplier);
  const cardsStart = Math.round(totalFrames * 0.1);
  const cardsEnd = Math.round(totalFrames * 0.6 * motion.durationMultiplier);
  const exitStart = Math.round(totalFrames * 0.85);
  const exitEnd = totalFrames;

  const titleOpacity = props.title
    ? interpolate(frame, [0, titleEnd], [0, 1], CLAMP)
    : 0;
  const exitOpacity = interpolate(frame, [exitStart, exitEnd], [1, 0], CLAMP);
  const exitBlur = fx.blurTransition
    ? interpolate(frame, [exitStart, exitEnd], [0, 8], CLAMP)
    : 0;

  const isMainPhase = frame >= cardsEnd && frame < exitStart;
  const floatY = motion.microMotionEnabled && isMainPhase ? microFloat(frame).y : 0;

  const entranceFrames = cardsEnd - cardsStart;
  const cardCount = props.cards.length;

  // Card dimensions — adapt columns for portrait
  const gap = Math.round(24 * scale);
  const cols = isPortrait ? Math.min(props.columns, 1) : Math.min(props.columns, cardCount);
  const containerWidth = Math.round(width * 0.85);
  const cardWidth = Math.round((containerWidth - gap * (cols - 1)) / cols);

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
              fontWeight: typo.fontWeight ?? "bold",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.titleColor,
              letterSpacing: typo.letterSpacing ?? undefined,
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
            maxWidth: containerWidth + "px",
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
            const paddingMap = { compact: "20px 16px", normal: "32px 28px", spacious: "44px 36px" };

            return (
              <div
                key={i}
                style={{
                  width: cardWidth + "px",
                  backgroundColor: props.cardBackground,
                  borderRadius: props.cardBorderRadius + "px",
                  padding: paddingMap[props.cardPadding],
                  borderTop: "3px solid " + (props.cardBorderColor ?? accent),
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
                    fontWeight: typo.fontWeight ?? "bold",
                    fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                    color: props.headingColor,
                    lineHeight: typo.lineHeight ?? 1.2,
                    letterSpacing: typo.letterSpacing ?? undefined,
                  }}
                >
                  {card.heading}
                </div>

                {/* Body */}
                {card.body && (
                  <div
                    style={{
                      fontSize: "18px",
                      fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                      color: props.bodyColor,
                      lineHeight: typo.lineHeight ?? 1.4,
                      letterSpacing: typo.letterSpacing ?? undefined,
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
