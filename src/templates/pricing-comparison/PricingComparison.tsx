import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Asset } from "../../assets/Asset";
import { Background } from "../../primitives/Background";
import { DecorativeLayer } from "../../primitives/DecorativeLayer";
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
import type { PricingComparisonProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

function alpha(hex: string, opacity: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

type VisualStyle = PricingComparisonProps["visualStyle"];

type VariantConfig = {
  titleAlign: "center" | "left";
  titleMaxWidthPct: number;
  accentHalo: string;
  overlay: string;
  contentInset: number;
  contentRadius: number;
  contentBorder: string;
  contentShadow: string;
  cardRadius: number;
  mutedCardBackground: string;
  highlightedCardBackground: string;
  highlightLift: number;
  highlightedScale: number;
  mutedShadow: string;
  highlightShadow: string;
  noteBackground: string;
  noteBorder: string;
  titleLetterSpacing?: string;
  subtitleMaxWidthPct: number;
  titleSizeBoost: number;
  buttonMutedBackground: string;
  buttonMutedBorder: string;
  badgeMutedBackground: string;
  badgeMutedBorder: string;
  topRule?: string;
};

function getVariantConfig(style: VisualStyle, accent: string, props: PricingComparisonProps): VariantConfig {
  if (style === "investor-clean") {
    return {
      titleAlign: "left",
      titleMaxWidthPct: 0.92,
      subtitleMaxWidthPct: 0.72,
      accentHalo: `radial-gradient(circle at 18% 18%, ${alpha(accent, 0.12)} 0%, transparent 38%)`,
      overlay: `linear-gradient(180deg, ${alpha("#FFFFFF", 0.72)} 0%, ${alpha("#F4F1EA", 0.82)} 100%)`,
      contentInset: 0.055,
      contentRadius: 30,
      contentBorder: alpha("#D6D2C9", 0.9),
      contentShadow: `0 32px 80px ${alpha("#0B1020", 0.12)}`,
      cardRadius: 22,
      mutedCardBackground: alpha(props.mutedCardBackground, 0.96),
      highlightedCardBackground: `linear-gradient(180deg, ${alpha(accent, 0.12)} 0%, ${alpha(props.cardBackground, 0.98)} 100%)`,
      highlightLift: -8,
      highlightedScale: 1.015,
      mutedShadow: `0 16px 32px ${alpha("#0B1020", 0.08)}`,
      highlightShadow: `0 24px 44px ${alpha(accent, 0.14)}`,
      noteBackground: alpha("#FFFFFF", 0.84),
      noteBorder: alpha("#D6D2C9", 0.9),
      titleLetterSpacing: "-0.03em",
      titleSizeBoost: 1.02,
      buttonMutedBackground: alpha("#EEF2F7", 0.94),
      buttonMutedBorder: alpha("#D5DDE9", 0.96),
      badgeMutedBackground: alpha("#EEF2F7", 0.94),
      badgeMutedBorder: alpha("#D5DDE9", 0.96),
      topRule: `linear-gradient(90deg, ${accent} 0%, ${alpha(accent, 0)} 78%)`,
    };
  }

  if (style === "creative-studio") {
    return {
      titleAlign: "left",
      titleMaxWidthPct: 0.82,
      subtitleMaxWidthPct: 0.65,
      accentHalo: `radial-gradient(circle at 82% 12%, ${alpha(accent, 0.2)} 0%, transparent 34%)`,
      overlay: `linear-gradient(135deg, ${alpha("#1B0C20", 0.48)} 0%, transparent 38%), linear-gradient(315deg, ${alpha("#120D2E", 0.52)} 0%, transparent 40%)`,
      contentInset: 0.045,
      contentRadius: 34,
      contentBorder: alpha(accent, 0.26),
      contentShadow: `0 34px 84px ${alpha("#05010C", 0.4)}`,
      cardRadius: 26,
      mutedCardBackground: `linear-gradient(180deg, ${alpha(props.mutedCardBackground, 0.9)} 0%, ${alpha("#120C1F", 0.96)} 100%)`,
      highlightedCardBackground: `linear-gradient(180deg, ${alpha(accent, 0.3)} 0%, ${alpha(props.cardBackground, 0.98)} 78%)`,
      highlightLift: -16,
      highlightedScale: 1.04,
      mutedShadow: `0 18px 42px ${alpha("#04010A", 0.34)}`,
      highlightShadow: `0 28px 64px ${alpha(accent, 0.28)}`,
      noteBackground: alpha("#160E25", 0.86),
      noteBorder: alpha(accent, 0.32),
      titleLetterSpacing: "-0.035em",
      titleSizeBoost: 1.06,
      buttonMutedBackground: alpha("#140F1E", 0.9),
      buttonMutedBorder: alpha(accent, 0.22),
      badgeMutedBackground: alpha("#24152E", 0.84),
      badgeMutedBorder: alpha(accent, 0.28),
      topRule: `linear-gradient(90deg, ${accent} 0%, ${alpha("#F97316", 0.66)} 55%, ${alpha("#000000", 0)} 100%)`,
    };
  }

  return {
    titleAlign: "center",
    titleMaxWidthPct: 0.86,
    subtitleMaxWidthPct: 0.76,
    accentHalo: `radial-gradient(circle at 50% 18%, ${alpha(accent, 0.12)} 0%, transparent 36%)`,
    overlay: `linear-gradient(180deg, ${alpha("#020617", 0.02)} 0%, ${alpha("#020617", 0.08)} 100%)`,
    contentInset: 0.04,
    contentRadius: 36,
    contentBorder: alpha(accent, 0.14),
    contentShadow: `0 28px 72px ${alpha("#020617", 0.28)}`,
    cardRadius: 28,
    mutedCardBackground: `linear-gradient(180deg, ${alpha(props.mutedCardBackground, 0.88)} 0%, ${alpha("#060912", 0.96)} 100%)`,
    highlightedCardBackground: `linear-gradient(180deg, ${alpha(accent, 0.14)} 0%, ${alpha(props.cardBackground, 0.94)} 68%)`,
    highlightLift: -12,
    highlightedScale: 1.03,
    mutedShadow: `0 14px 34px rgba(0, 0, 0, 0.14)`,
    highlightShadow: `0 24px 60px ${alpha(accent, 0.16)}`,
    noteBackground: alpha("#FFFFFF", 0.05),
    noteBorder: alpha("#FFFFFF", 0.08),
    titleSizeBoost: 1,
    buttonMutedBackground: alpha("#FFFFFF", 0.04),
    buttonMutedBorder: alpha("#FFFFFF", 0.08),
    badgeMutedBackground: alpha("#FFFFFF", 0.06),
    badgeMutedBorder: alpha("#FFFFFF", 0.08),
    topRule: `linear-gradient(90deg, ${alpha(accent, 0)} 0%, ${accent} 50%, ${alpha(accent, 0)} 100%)`,
  };
}

export const PricingComparison: React.FC<PricingComparisonProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, scale, isPortrait, isSquare } = useResponsiveConfig();

  const effectiveStylePreset =
    props.stylePreset ??
    (props.visualStyle === "investor-clean"
      ? "editorial"
      : props.visualStyle === "creative-studio"
        ? "warm-organic"
        : "modern-clean");

  const resolved = resolveStylePreset(
    effectiveStylePreset,
    props.typography,
    props.motionStyle,
    props.effects,
  );
  const typo = resolveTypography(resolved.typography);
  const motion = resolveMotionStyle(resolved.motionStyle);
  const highlightIndex = Math.max(0, Math.min(props.highlightedPlan, props.plans.length - 1));
  const accentSeed = props.plans[highlightIndex]?.accentColor ?? "#60A5FA";
  const fx = resolveEffects(resolved.effects, accentSeed);
  const variant = getVariantConfig(props.visualStyle, accentSeed, props);

  const totalFrames = secToFrame(props.duration);
  const titleEnd = Math.round(totalFrames * 0.14 * motion.durationMultiplier);
  const subtitleEnd = Math.round(totalFrames * 0.2 * motion.durationMultiplier);
  const cardsWindow = adaptiveEntranceWindow(props.duration, totalFrames, motion.durationMultiplier, {
    startPct: 0.08,
    minSec: 1.8,
    maxSec: 4.2,
    maxEndPct: 0.76,
  });
  const cardsStart = cardsWindow.startFrame;
  const cardsDuration = Math.max(1, cardsWindow.endFrame - cardsWindow.startFrame);
  const exitStart = Math.round(totalFrames * 0.88);
  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);
  const exitBlur = fx.blurTransition
    ? interpolate(frame, [exitStart, totalFrames], [0, 8], CLAMP)
    : 0;
  const floatY =
    motion.microMotionEnabled && frame > cardsWindow.endFrame && frame < exitStart
      ? microFloat(frame, Math.max(1, scale * 2.4)).y
      : 0;

  const isStacked = isPortrait;
  const cardGap = Math.round((isPortrait ? 18 : 22) * scale);
  const contentWidth = Math.round(width * (isPortrait ? 0.82 : 0.9));
  const cardWidth = isStacked
    ? Math.round(contentWidth)
    : Math.round((contentWidth - cardGap * 2) / 3);
  const estimatedCardHeight = Math.round((isPortrait ? 265 : 350) * scale);
  const headerSpace = props.title ? Math.round((props.subtitle ? 130 : 96) * scale) : 24;
  const noteSpace = props.comparisonNote ? Math.round(54 * scale) : 0;
  const estimatedHeight = headerSpace + noteSpace + estimatedCardHeight * (isStacked ? 3 : 1) + cardGap * (isStacked ? 2 : 0);
  const fitScale = estimatedHeight > Math.round(height * 0.9)
    ? Math.max(0.74, Math.round(((height * 0.9) / estimatedHeight) * 1000) / 1000)
    : 1;
  const framePadding = Math.round(contentWidth * variant.contentInset);
  const titleFontSize = Math.round((isPortrait || isSquare ? 40 : 48) * scale * variant.titleSizeBoost);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} />
      <DecorativeLayer
        theme={
          props.visualStyle === "creative-studio"
            ? "light-streaks"
            : props.visualStyle === "investor-clean"
              ? "corner-accents"
              : "minimal-dots"
        }
        accentColor={accentSeed}
        frame={frame}
        totalFrames={totalFrames}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: variant.accentHalo,
          opacity: exitOpacity,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: variant.overlay,
          opacity: exitOpacity,
          mixBlendMode: props.visualStyle === "investor-clean" ? "multiply" : "screen",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translateY(${floatY}px) scale(${fitScale})`,
          width: `${contentWidth}px`,
          padding: `${framePadding}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: variant.titleAlign === "left" ? "stretch" : "center",
          gap: `${Math.round((isPortrait ? 18 : 22) * scale)}px`,
          opacity: exitOpacity,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
          borderRadius: `${Math.round(variant.contentRadius * scale)}px`,
          border: `1px solid ${variant.contentBorder}`,
          boxShadow: variant.contentShadow,
          background: alpha(
            props.visualStyle === "investor-clean" ? "#FFFFFF" : "#050816",
            props.visualStyle === "investor-clean" ? 0.34 : 0.18,
          ),
          backdropFilter: "blur(10px)",
        }}
      >
        {variant.topRule ? (
          <div
            style={{
              width: `${Math.round(contentWidth * (props.visualStyle === "investor-clean" ? 0.22 : 0.28))}px`,
              height: `${Math.max(4, Math.round(5 * scale))}px`,
              borderRadius: `${Math.round(999 * scale)}px`,
              background: variant.topRule,
              alignSelf: variant.titleAlign === "left" ? "flex-start" : "center",
              opacity: 0.92,
            }}
          />
        ) : null}

        {props.title && (
          <div
            style={{
              textAlign: variant.titleAlign,
              alignSelf: variant.titleAlign === "left" ? "stretch" : "center",
              maxWidth: `${Math.round(contentWidth * variant.titleMaxWidthPct)}px`,
            }}
          >
            <div
              style={{
                fontSize: `${titleFontSize}px`,
                fontWeight: typo.fontWeight ?? "bold",
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                color: props.titleColor,
                opacity: fadeIn(frame, { startFrame: 0, endFrame: titleEnd }).opacity,
                letterSpacing: variant.titleLetterSpacing ?? typo.letterSpacing ?? undefined,
                lineHeight: typo.lineHeight ?? 1.04,
                textTransform: props.visualStyle === "creative-studio" ? "uppercase" : "none",
              }}
            >
              {props.title}
            </div>
            {props.subtitle && (
              <div
                style={{
                  marginTop: `${Math.round(14 * scale)}px`,
                  fontSize: `${Math.round((isPortrait ? 18 : 21) * scale)}px`,
                  fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                  color: props.subtitleColor,
                  opacity: fadeIn(frame, { startFrame: Math.round(titleEnd * 0.35), endFrame: subtitleEnd }).opacity,
                  lineHeight: typo.lineHeight ?? 1.35,
                  maxWidth: `${Math.round(contentWidth * variant.subtitleMaxWidthPct)}px`,
                }}
              >
                {props.subtitle}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: isStacked ? "column" : "row",
            alignItems: "stretch",
            justifyContent: "center",
            gap: `${cardGap}px`,
            width: "100%",
          }}
        >
          {props.plans.map((plan, index) => {
            const accent = plan.accentColor ?? (index === highlightIndex ? accentSeed : "#64748B");
            const range = staggerDelay(index, props.plans.length, cardsDuration);
            const animationRange = {
              startFrame: cardsStart + range.startFrame,
              endFrame: cardsStart + range.endFrame,
            };

            let cardOpacity = 1;
            let cardY = 0;
            let cardScale = 1;
            if (props.entranceAnimation === "fade-in") {
              cardOpacity = fadeIn(frame, animationRange).opacity;
            } else if (props.entranceAnimation === "slide-up") {
              const state = slideUp(frame, animationRange, Math.round(42 * scale));
              cardOpacity = state.opacity;
              cardY = state.y;
            } else if (props.entranceAnimation === "scale-pop") {
              const state = scalePop(frame, animationRange, index === highlightIndex ? 1.12 : 1.08);
              cardOpacity = state.opacity;
              cardScale = state.scale;
            }

            const isHighlighted = index === highlightIndex;
            const badgeText = plan.badge ?? (isHighlighted ? props.highlightLabel : undefined);
            const cardBg = isHighlighted ? variant.highlightedCardBackground : variant.mutedCardBackground;
            const borderColor = isHighlighted ? alpha(accent, 0.72) : alpha(props.cardBorderColor, 0.9);
            const priceSuffix = plan.priceSuffix ? ` ${plan.priceSuffix}` : "";
            const highlightYOffset = isHighlighted && !isStacked ? -Math.round(variant.highlightLift * scale) : 0;

            return (
              <div
                key={plan.name}
                style={{
                  width: `${cardWidth}px`,
                  minHeight: `${estimatedCardHeight}px`,
                  background: cardBg,
                  borderRadius: `${Math.round(variant.cardRadius * scale)}px`,
                  border: `1px solid ${borderColor}`,
                  boxShadow: isHighlighted ? variant.highlightShadow : variant.mutedShadow,
                  padding: `${Math.round(24 * scale)}px ${Math.round(22 * scale)}px`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: `${Math.round(18 * scale)}px`,
                  opacity: cardOpacity,
                  position: "relative",
                  overflow: "hidden",
                  transform: `translateY(${cardY + highlightYOffset}px) scale(${cardScale * (isHighlighted && !isStacked ? variant.highlightedScale : 1)}) rotate(${props.visualStyle === "creative-studio" && !isStacked ? (isHighlighted ? -0.4 : index === 0 ? -0.8 : 0.8) : 0}deg)`,
                }}
              >
                {props.visualStyle === "creative-studio" ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(180deg, ${alpha(accent, isHighlighted ? 0.2 : 0.08)} 0%, transparent 36%)`,
                      pointerEvents: "none",
                    }}
                  />
                ) : null}

                <div style={{ display: "flex", flexDirection: "column", gap: `${Math.round(16 * scale)}px`, position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: `${Math.round(12 * scale)}px` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: `${Math.round(12 * scale)}px` }}>
                      {plan.iconId ? (
                        <div
                          style={{
                            width: `${Math.round(44 * scale)}px`,
                            height: `${Math.round(44 * scale)}px`,
                            borderRadius: `${Math.round((props.visualStyle === "investor-clean" ? 12 : 14) * scale)}px`,
                            background: alpha(accent, isHighlighted ? 0.18 : 0.12),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `1px solid ${alpha(accent, 0.22)}`,
                          }}
                        >
                          <Asset id={plan.iconId} width={Math.round(20 * scale)} height={Math.round(20 * scale)} color={isHighlighted ? props.iconColor : accent} />
                        </div>
                      ) : null}
                      <div>
                        <div
                          style={{
                            fontSize: `${Math.round((isPortrait ? 24 : 26) * scale)}px`,
                            fontWeight: typo.fontWeight ?? "bold",
                            fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                            color: props.planNameColor,
                            lineHeight: 1.08,
                            textTransform: props.visualStyle === "creative-studio" ? "uppercase" : "none",
                            letterSpacing: props.visualStyle === "creative-studio" ? "0.02em" : undefined,
                          }}
                        >
                          {plan.name}
                        </div>
                        {plan.description && (
                          <div
                            style={{
                              marginTop: `${Math.round(6 * scale)}px`,
                              fontSize: `${Math.round((isPortrait ? 14 : 15) * scale)}px`,
                              fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                              color: props.mutedTextColor,
                              lineHeight: 1.35,
                              maxWidth: `${Math.round(cardWidth * 0.7)}px`,
                            }}
                          >
                            {plan.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {badgeText && (
                      <div
                        style={{
                          padding: `${Math.round(8 * scale)}px ${Math.round(12 * scale)}px`,
                          borderRadius: `${Math.round((props.visualStyle === "creative-studio" ? 14 : 999) * scale)}px`,
                          background: isHighlighted ? alpha(accent, props.visualStyle === "investor-clean" ? 0.16 : 0.22) : variant.badgeMutedBackground,
                          color: isHighlighted ? (props.visualStyle === "investor-clean" ? accent : "#FFFFFF") : props.mutedTextColor,
                          fontSize: `${Math.round(12 * scale)}px`,
                          fontWeight: 700,
                          fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          border: `1px solid ${isHighlighted ? alpha(accent, 0.34) : variant.badgeMutedBorder}`,
                          display: "flex",
                          alignItems: "center",
                          gap: `${Math.round(6 * scale)}px`,
                          flexShrink: 0,
                        }}
                      >
                        {isHighlighted ? <Asset id="star-icon" width={Math.round(12 * scale)} height={Math.round(12 * scale)} color={props.visualStyle === "investor-clean" ? accent : "#FFFFFF"} /> : null}
                        {badgeText}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: `${Math.round(10 * scale)}px`,
                      paddingBottom: `${Math.round(14 * scale)}px`,
                      borderBottom: `1px solid ${alpha(isHighlighted ? accent : props.cardBorderColor, props.visualStyle === "investor-clean" ? 0.32 : 0.24)}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: `${Math.round((isPortrait ? 44 : 50) * scale)}px`,
                        fontWeight: 800,
                        fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                        color: props.priceColor,
                        lineHeight: 1,
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {plan.price}
                    </div>
                    {plan.priceSuffix && (
                      <div
                        style={{
                          paddingBottom: `${Math.round(6 * scale)}px`,
                          fontSize: `${Math.round((isPortrait ? 15 : 16) * scale)}px`,
                          fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                          color: props.mutedTextColor,
                        }}
                      >
                        {priceSuffix}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: `${Math.round(12 * scale)}px` }}>
                    {plan.features.map((feature) => (
                      <div
                        key={`${plan.name}-${feature.label}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: `${Math.round(12 * scale)}px`,
                          opacity: feature.included ? 1 : 0.72,
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.round(24 * scale)}px`,
                            height: `${Math.round(24 * scale)}px`,
                            borderRadius: `${Math.round(999 * scale)}px`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: feature.included ? alpha(props.includedColor, 0.16) : alpha(props.excludedColor, 0.14),
                            border: `1px solid ${feature.included ? alpha(props.includedColor, 0.26) : alpha(props.excludedColor, 0.2)}`,
                            flexShrink: 0,
                          }}
                        >
                          <Asset
                            id={feature.included ? "checkmark" : "close"}
                            width={Math.round(11 * scale)}
                            height={Math.round(11 * scale)}
                            color={feature.included ? props.includedColor : props.excludedColor}
                          />
                        </div>
                        <div
                          style={{
                            fontSize: `${Math.round((isPortrait ? 16 : 17) * scale)}px`,
                            fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                            color: feature.included ? props.featureTextColor : props.mutedTextColor,
                            fontWeight: feature.emphasis ? 700 : 500,
                            lineHeight: 1.26,
                          }}
                        >
                          {feature.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: `${Math.round(52 * scale)}px`,
                    borderRadius: `${Math.round((props.visualStyle === "investor-clean" ? 14 : 16) * scale)}px`,
                    background: isHighlighted ? accent : variant.buttonMutedBackground,
                    border: `1px solid ${isHighlighted ? alpha(accent, 0.42) : variant.buttonMutedBorder}`,
                    color: isHighlighted ? props.buttonTextColor : props.planNameColor,
                    fontSize: `${Math.round((isPortrait ? 16 : 17) * scale)}px`,
                    fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                    fontWeight: 700,
                    letterSpacing: "0.01em",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {plan.ctaLabel ?? (isHighlighted ? "Start now" : "Choose plan")}
                </div>
              </div>
            );
          })}
        </div>

        {props.comparisonNote && (
          <div
            style={{
              padding: `${Math.round(10 * scale)}px ${Math.round(16 * scale)}px`,
              borderRadius: `${Math.round((props.visualStyle === "creative-studio" ? 16 : 999) * scale)}px`,
              background: variant.noteBackground,
              border: `1px solid ${variant.noteBorder}`,
              color: props.subtitleColor,
              fontSize: `${Math.round((isPortrait ? 14 : 15) * scale)}px`,
              fontFamily: typo.fontFamily ?? "Arial, sans-serif",
              alignSelf: variant.titleAlign === "left" ? "flex-start" : "center",
            }}
          >
            {props.comparisonNote}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
