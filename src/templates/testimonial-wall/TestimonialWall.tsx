import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Asset } from "../../assets/Asset";
import { Background } from "../../primitives/Background";
import {
  adaptiveEntranceWindow,
  fadeIn,
  microFloat,
  scalePop,
  secToFrame,
  slideUp,
  staggerDelay,
} from "../../primitives/animations";
import { resolveEffects } from "../../primitives/useEffects";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { TestimonialWallProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

function alpha(hex: string, opacity: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "U";
}

type Variant = {
  frameBg: string;
  frameBorder: string;
  frameShadow: string;
  halo: string;
  titleAlign: "left" | "center";
  titleMaxPct: number;
  titleScale: number;
  featureBg: string;
  featureBorder: string;
  featureShadow: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  quoteMarkColor: string;
  titleTransform?: "uppercase" | "none";
};

type EntryState = {
  opacity: number;
  y: number;
  scale: number;
};

function getVariant(props: TestimonialWallProps): Variant {
  if (props.visualStyle === "editorial-light") {
    return {
      frameBg: alpha("#FFFFFF", 0.9),
      frameBorder: alpha("#D7DEE9", 0.96),
      frameShadow: `0 30px 80px ${alpha("#0F172A", 0.12)}`,
      halo: `radial-gradient(circle at 18% 14%, ${alpha(props.accentColor, 0.12)} 0%, transparent 36%)`,
      titleAlign: "left",
      titleMaxPct: 0.88,
      titleScale: 1.04,
      featureBg: alpha("#FFFFFF", 0.98),
      featureBorder: alpha(props.accentColor, 0.22),
      featureShadow: `0 22px 48px ${alpha("#0F172A", 0.08)}`,
      cardBg: alpha("#F8FAFC", 0.96),
      cardBorder: alpha("#D7DEE9", 0.96),
      cardShadow: `0 14px 30px ${alpha("#0F172A", 0.08)}`,
      quoteMarkColor: alpha(props.accentColor, 0.18),
      titleTransform: "none",
    };
  }

  if (props.visualStyle === "warm-brand") {
    return {
      frameBg: `linear-gradient(180deg, ${alpha("#2A1022", 0.82)} 0%, ${alpha("#180B18", 0.92)} 100%)`,
      frameBorder: alpha(props.secondaryAccentColor, 0.24),
      frameShadow: `0 34px 88px ${alpha("#120410", 0.36)}`,
      halo: `radial-gradient(circle at 82% 18%, ${alpha(props.secondaryAccentColor, 0.16)} 0%, transparent 32%), radial-gradient(circle at 12% 88%, ${alpha(props.accentColor, 0.14)} 0%, transparent 36%)`,
      titleAlign: "left",
      titleMaxPct: 0.8,
      titleScale: 1.08,
      featureBg: `linear-gradient(180deg, ${alpha(props.secondaryAccentColor, 0.14)} 0%, ${alpha(props.cardBackground, 0.98)} 100%)`,
      featureBorder: alpha(props.secondaryAccentColor, 0.3),
      featureShadow: `0 24px 54px ${alpha(props.secondaryAccentColor, 0.18)}`,
      cardBg: alpha(props.mutedCardBackground, 0.92),
      cardBorder: alpha(props.secondaryAccentColor, 0.18),
      cardShadow: `0 16px 36px ${alpha("#120410", 0.26)}`,
      quoteMarkColor: alpha(props.secondaryAccentColor, 0.2),
      titleTransform: "uppercase",
    };
  }

  return {
    frameBg: alpha("#060B18", 0.68),
    frameBorder: alpha(props.accentColor, 0.16),
    frameShadow: `0 30px 80px ${alpha("#020617", 0.36)}`,
    halo: `radial-gradient(circle at 50% 18%, ${alpha(props.accentColor, 0.12)} 0%, transparent 36%)`,
    titleAlign: "center",
    titleMaxPct: 0.84,
    titleScale: 1.02,
    featureBg: `linear-gradient(180deg, ${alpha(props.accentColor, 0.18)} 0%, ${alpha(props.cardBackground, 0.96)} 100%)`,
    featureBorder: alpha(props.accentColor, 0.26),
    featureShadow: `0 22px 52px ${alpha(props.accentColor, 0.18)}`,
    cardBg: alpha(props.mutedCardBackground, 0.92),
    cardBorder: alpha(props.cardBorderColor, 0.9),
    cardShadow: `0 14px 34px ${alpha("#020617", 0.22)}`,
    quoteMarkColor: alpha(props.accentColor, 0.18),
    titleTransform: "none",
  };
}

export const TestimonialWall: React.FC<TestimonialWallProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, scale, isPortrait } = useResponsiveConfig();

  const resolved = resolveStylePreset(
    props.stylePreset,
    props.typography,
    props.motionStyle,
    props.effects,
  );
  const typo = resolveTypography(resolved.typography);
  const motion = resolveMotionStyle(resolved.motionStyle);
  const fx = resolveEffects(resolved.effects, props.accentColor);
  const variant = getVariant(props);

  const totalFrames = secToFrame(props.duration);
  const titleEnd = Math.round(totalFrames * 0.14 * motion.durationMultiplier);
  const titleStartSecondary = Math.round(titleEnd * 0.32);
  const cardsWindow = adaptiveEntranceWindow(props.duration, totalFrames, motion.durationMultiplier, {
    startPct: 0.08,
    minSec: 1.8,
    maxSec: 4.2,
    maxEndPct: 0.78,
  });
  const exitStart = Math.round(totalFrames * 0.88);
  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);
  const exitBlur = fx.blurTransition ? interpolate(frame, [exitStart, totalFrames], [0, 8], CLAMP) : 0;
  const floatY =
    motion.microMotionEnabled && frame > cardsWindow.endFrame && frame < exitStart
      ? microFloat(frame, Math.max(1, scale * 2.1)).y
      : 0;

  const featuredIndex = Math.max(0, Math.min(props.featuredIndex, props.testimonials.length - 1));
  const ordered = [
    props.testimonials[featuredIndex],
    ...props.testimonials.filter((_, index) => index !== featuredIndex),
  ];
  const featured = ordered[0];
  const supporting = ordered.slice(1);
  const eyebrowText =
    props.visualStyle === "editorial-light"
      ? "Selected Client Notes"
      : props.visualStyle === "warm-brand"
        ? "Praise from the people shaping the work"
        : "Verified customer voices";

  const frameWidth = Math.round(width * (isPortrait ? 0.92 : 0.9));
  const framePaddingX = Math.round((isPortrait ? 26 : 40) * scale);
  const framePaddingY = Math.round((isPortrait ? 26 : 34) * scale);
  const featureWidth = isPortrait ? frameWidth - framePaddingX * 2 : Math.round((frameWidth - framePaddingX * 2) * 0.6);
  const supportGap = Math.round(18 * scale);
  const supportCols = isPortrait ? 1 : 2;
  const supportWidth = isPortrait
    ? frameWidth - framePaddingX * 2
    : Math.round(((frameWidth - framePaddingX * 2) - supportGap * (supportCols - 1) - featureWidth - supportGap) / supportCols);
  const supportRows = isPortrait ? supporting.length : Math.ceil(supporting.length / supportCols);
  const supportCardHeight = Math.round((isPortrait ? 164 : 158) * scale);
  const wallHeightEstimate =
    Math.round((props.title ? 138 : 72) * scale) +
    Math.max(Math.round(290 * scale), supportRows * supportCardHeight + Math.max(0, supportRows - 1) * supportGap) +
    framePaddingY * 2;
  const fitScale = wallHeightEstimate > Math.round(height * 0.92)
    ? Math.max(0.82, Math.round(((height * 0.92) / wallHeightEstimate) * 1000) / 1000)
    : 1;

  const entryState = (index: number): EntryState => {
    const range = staggerDelay(index, Math.max(1, ordered.length + 2), Math.max(1, cardsWindow.endFrame - cardsWindow.startFrame));
    const adjusted = {
      startFrame: cardsWindow.startFrame + range.startFrame,
      endFrame: cardsWindow.startFrame + range.endFrame,
    };
    if (props.entranceAnimation === "scale-pop") {
      const state = scalePop(frame, adjusted, index === 0 ? 1.06 : 1.03);
      return { opacity: state.opacity, y: 0, scale: state.scale };
    }
    if (props.entranceAnimation === "slide-up") {
      const state = slideUp(frame, adjusted, index === 0 ? 36 : 24);
      return { opacity: state.opacity, y: state.y, scale: 1 };
    }
    const state = fadeIn(frame, adjusted);
    return { opacity: state.opacity, y: 0, scale: 1 };
  };

  const featuredState = entryState(0);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: variant.halo,
          opacity: exitOpacity,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translateY(${floatY}px) scale(${fitScale})`,
          width: `${frameWidth}px`,
          padding: `${framePaddingY}px ${framePaddingX}px`,
          borderRadius: `${Math.round(36 * scale)}px`,
          background: variant.frameBg,
          border: `1px solid ${variant.frameBorder}`,
          boxShadow: variant.frameShadow,
          opacity: exitOpacity,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
          backdropFilter: "blur(10px)",
        }}
      >
        {props.title ? (
          <div
            style={{
              maxWidth: `${Math.round(frameWidth * variant.titleMaxPct)}px`,
              margin: variant.titleAlign === "center" ? "0 auto" : undefined,
              textAlign: variant.titleAlign,
              marginBottom: `${Math.round(32 * scale)}px`,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: `${Math.round(10 * scale)}px`,
                marginBottom: `${Math.round(12 * scale)}px`,
                fontSize: `${Math.round((isPortrait ? 12 : 13) * scale)}px`,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: props.visualStyle === "editorial-light" ? props.accentColor : props.secondaryAccentColor,
                fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                opacity: fadeIn(frame, { startFrame: 0, endFrame: Math.round(titleEnd * 0.9) }).opacity,
              }}
            >
              <span
                style={{
                  width: `${Math.round(28 * scale)}px`,
                  height: `${Math.round(2 * scale)}px`,
                  borderRadius: `${Math.round(999 * scale)}px`,
                  background: props.visualStyle === "editorial-light" ? props.accentColor : props.secondaryAccentColor,
                  display: "inline-block",
                }}
              />
              {eyebrowText}
            </div>
            <div
              style={{
                fontSize: `${Math.round((isPortrait ? 44 : 58) * scale * variant.titleScale)}px`,
                fontWeight: 800,
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                color: props.titleColor,
                lineHeight: 1.02,
                letterSpacing: variant.titleTransform === "uppercase" ? "-0.02em" : "-0.03em",
                textTransform: variant.titleTransform,
                opacity: fadeIn(frame, { startFrame: 0, endFrame: titleEnd }).opacity,
              }}
            >
              {props.title}
            </div>
            {props.subtitle ? (
              <div
                style={{
                  marginTop: `${Math.round(12 * scale)}px`,
                  fontSize: `${Math.round((isPortrait ? 18 : 22) * scale)}px`,
                  color: props.subtitleColor,
                  fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                  lineHeight: 1.42,
                  maxWidth: `${Math.round(frameWidth * (variant.titleAlign === "center" ? 0.68 : 0.6))}px`,
                  opacity: fadeIn(frame, { startFrame: titleStartSecondary, endFrame: Math.round(titleEnd * 1.3) }).opacity,
                }}
              >
                {props.subtitle}
              </div>
            ) : null}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            flexDirection: isPortrait ? "column" : "row",
            gap: `${supportGap}px`,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              width: `${featureWidth}px`,
              minHeight: `${Math.round(304 * scale)}px`,
              padding: `${Math.round(30 * scale)}px`,
              borderRadius: `${Math.round(28 * scale)}px`,
              background: variant.featureBg,
              border: `1px solid ${variant.featureBorder}`,
              boxShadow: variant.featureShadow,
              position: "relative",
              overflow: "hidden",
              opacity: featuredState.opacity,
              transform: `translateY(${featuredState.y}px) scale(${featuredState.scale})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                right: `${Math.round(20 * scale)}px`,
                top: `${Math.round(12 * scale)}px`,
                fontSize: `${Math.round(110 * scale)}px`,
                fontWeight: 700,
                color: variant.quoteMarkColor,
                lineHeight: 1,
                fontFamily: "Georgia, serif",
                userSelect: "none",
              }}
            >
              {'"'}
            </div>

            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                height: "100%",
                justifyContent: "space-between",
                gap: `${Math.round(20 * scale)}px`,
              }}
            >
              <div
                style={{
                  fontSize: `${Math.round((isPortrait ? 30 : 35) * scale)}px`,
                  fontWeight: 700,
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: props.quoteColor,
                  lineHeight: 1.2,
                  maxWidth: "88%",
                }}
              >
                {featured.quote}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: `${Math.round(14 * scale)}px` }}>
                <div style={{ display: "flex", alignItems: "center", gap: `${Math.round(14 * scale)}px` }}>
                  <div
                    style={{
                      width: `${Math.round(54 * scale)}px`,
                      height: `${Math.round(54 * scale)}px`,
                      borderRadius: "50%",
                      background: alpha(featured.accentColor ?? props.accentColor, 0.2),
                      border: `1px solid ${alpha(featured.accentColor ?? props.accentColor, 0.34)}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: props.quoteColor,
                      fontWeight: 800,
                      fontSize: `${Math.round(20 * scale)}px`,
                      fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                    }}
                  >
                    {initials(featured.name)}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: `${Math.round(21 * scale)}px`,
                        fontWeight: 700,
                        color: props.metaTextColor,
                        fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                      }}
                    >
                      {featured.name}
                    </div>
                    <div
                      style={{
                        marginTop: `${Math.round(4 * scale)}px`,
                        fontSize: `${Math.round(16 * scale)}px`,
                        color: props.mutedTextColor,
                        fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                      }}
                    >
                      {[featured.role, featured.company].filter(Boolean).join(" • ")}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: `${Math.round(6 * scale)}px` }}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <Asset
                      key={`${featured.name}-star-${index}`}
                      id="star-icon"
                      width={Math.round(16 * scale)}
                      height={Math.round(16 * scale)}
                      color={index < featured.rating ? featured.accentColor ?? props.secondaryAccentColor : alpha(props.cardBorderColor, 0.8)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: isPortrait ? "1fr" : "1fr 1fr",
              gap: `${supportGap}px`,
              alignContent: "start",
            }}
          >
            {supporting.map((item, index) => {
              const state = entryState(index + 1);
              const isLeadSupport = !isPortrait && supporting.length >= 3 && index === 0;
              return (
                <div
                  key={`${item.name}-${index}`}
                  style={{
                    gridColumn: isLeadSupport ? "1 / span 2" : undefined,
                    minHeight: `${supportCardHeight}px`,
                    padding: `${Math.round((isLeadSupport ? 22 : 20) * scale)}px`,
                    borderRadius: `${Math.round(22 * scale)}px`,
                    background: variant.cardBg,
                    border: `1px solid ${variant.cardBorder}`,
                    boxShadow: variant.cardShadow,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: `${Math.round(12 * scale)}px`,
                    opacity: state.opacity,
                    transform: `translateY(${state.y}px) scale(${state.scale})`,
                  }}
                >
                  <div
                    style={{
                      fontSize: `${Math.round((isLeadSupport ? 21 : isPortrait ? 18 : 20) * scale)}px`,
                      fontWeight: 600,
                      color: props.quoteColor,
                      lineHeight: 1.36,
                      fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                      maxWidth: isLeadSupport ? "78%" : "100%",
                    }}
                  >
                    {item.quote}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: `${Math.round(10 * scale)}px` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: `${Math.round(12 * scale)}px` }}>
                      <div
                        style={{
                          width: `${Math.round(40 * scale)}px`,
                          height: `${Math.round(40 * scale)}px`,
                          borderRadius: "50%",
                          background: alpha(item.accentColor ?? props.accentColor, 0.16),
                          border: `1px solid ${alpha(item.accentColor ?? props.accentColor, 0.28)}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: props.metaTextColor,
                          fontWeight: 800,
                          fontSize: `${Math.round(15 * scale)}px`,
                          fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                        }}
                      >
                        {initials(item.name)}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: `${Math.round(16 * scale)}px`,
                            fontWeight: 700,
                            color: props.metaTextColor,
                            fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                          }}
                        >
                          {item.name}
                        </div>
                        <div
                          style={{
                            marginTop: `${Math.round(3 * scale)}px`,
                            fontSize: `${Math.round(14 * scale)}px`,
                            color: props.mutedTextColor,
                            fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                          }}
                        >
                          {[item.role, item.company].filter(Boolean).join(" • ")}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: `${Math.round(4 * scale)}px` }}>
                      {Array.from({ length: Math.min(item.rating, 5) }, (_, starIndex) => (
                        <Asset
                          key={`${item.name}-mini-star-${starIndex}`}
                          id="star-icon"
                          width={Math.round(12 * scale)}
                          height={Math.round(12 * scale)}
                          color={item.accentColor ?? props.secondaryAccentColor}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
