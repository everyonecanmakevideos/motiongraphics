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
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import type { YTChaptersProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

function alpha(hex: string, opacity: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

type Variant = {
  decorativeTheme: "corner-accents" | "minimal-dots" | "light-streaks";
  contentWidthPct: number;
  shellBackground: string;
  shellBorder: string;
  shellShadow: string;
  railBackground: string;
  railBorder: string;
  rowBackground: string;
  rowBorder: string;
  activeRowBackground: string;
  activeRowBorder: string;
  timestampBackground: string;
  timestampText: string;
  titleAlign: "left" | "center";
  titleScale: number;
  eyebrowColor: string;
  badgeBackground: string;
  badgeBorder: string;
  buttonBackground: string;
  buttonBorder: string;
  buttonText: string;
  chipBackground: string;
  chipBorder: string;
  accentRule: string;
};

function getVariant(props: YTChaptersProps): Variant {
  if (props.visualStyle === "editorial-index") {
    return {
      decorativeTheme: "corner-accents",
      contentWidthPct: 0.9,
      shellBackground: alpha("#FFFCF6", 0.92),
      shellBorder: alpha("#D9D1C5", 0.96),
      shellShadow: `0 32px 84px ${alpha("#0F172A", 0.12)}`,
      railBackground: alpha("#FFF8EE", 0.88),
      railBorder: alpha("#D9D1C5", 0.96),
      rowBackground: alpha("#FFFFFF", 0.96),
      rowBorder: alpha("#DDD4C7", 0.9),
      activeRowBackground: `linear-gradient(180deg, ${alpha(props.secondaryAccentColor, 0.14)} 0%, ${alpha("#FFFFFF", 0.98)} 100%)`,
      activeRowBorder: alpha(props.secondaryAccentColor, 0.46),
      timestampBackground: alpha("#F8E7D5", 0.96),
      timestampText: "#7C2D12",
      titleAlign: "left",
      titleScale: 1.05,
      eyebrowColor: props.secondaryAccentColor,
      badgeBackground: alpha("#FFFFFF", 0.96),
      badgeBorder: alpha("#D9D1C5", 0.96),
      buttonBackground: props.secondaryAccentColor,
      buttonBorder: alpha(props.secondaryAccentColor, 0.4),
      buttonText: "#FFF7ED",
      chipBackground: alpha("#FFF8EE", 0.96),
      chipBorder: alpha("#E6D5BF", 0.96),
      accentRule: `linear-gradient(90deg, ${props.secondaryAccentColor} 0%, ${alpha(props.secondaryAccentColor, 0)} 100%)`,
    };
  }

  if (props.visualStyle === "creator-dark") {
    return {
      decorativeTheme: "light-streaks",
      contentWidthPct: 0.88,
      shellBackground: alpha("#090C14", 0.84),
      shellBorder: alpha("#334155", 0.62),
      shellShadow: `0 36px 88px ${alpha("#020617", 0.42)}`,
      railBackground: alpha("#0E1523", 0.92),
      railBorder: alpha("#23324A", 0.92),
      rowBackground: alpha("#0B111D", 0.88),
      rowBorder: alpha("#22314A", 0.84),
      activeRowBackground: `linear-gradient(180deg, ${alpha(props.secondaryAccentColor, 0.18)} 0%, ${alpha("#0F172A", 0.98)} 100%)`,
      activeRowBorder: alpha(props.secondaryAccentColor, 0.52),
      timestampBackground: alpha(props.secondaryAccentColor, 0.18),
      timestampText: "#FED7AA",
      titleAlign: "left",
      titleScale: 1.08,
      eyebrowColor: props.secondaryAccentColor,
      badgeBackground: alpha("#111827", 0.96),
      badgeBorder: alpha(props.secondaryAccentColor, 0.3),
      buttonBackground: props.secondaryAccentColor,
      buttonBorder: alpha(props.secondaryAccentColor, 0.42),
      buttonText: "#190C0A",
      chipBackground: alpha("#0F172A", 0.9),
      chipBorder: alpha("#334155", 0.96),
      accentRule: `linear-gradient(90deg, ${props.secondaryAccentColor} 0%, ${props.accentColor} 58%, ${alpha(props.accentColor, 0)} 100%)`,
    };
  }

  return {
    decorativeTheme: "minimal-dots",
    contentWidthPct: 0.9,
    shellBackground: alpha("#FFFFFF", 0.86),
    shellBorder: alpha("#D7DEE9", 0.96),
    shellShadow: `0 30px 80px ${alpha("#0F172A", 0.12)}`,
    railBackground: alpha("#F8FAFC", 0.92),
    railBorder: alpha("#D7DEE9", 0.96),
    rowBackground: alpha("#FFFFFF", 0.98),
    rowBorder: alpha("#D7DEE9", 0.96),
    activeRowBackground: `linear-gradient(180deg, ${alpha(props.accentColor, 0.12)} 0%, ${alpha("#FFFFFF", 0.98)} 100%)`,
    activeRowBorder: alpha(props.accentColor, 0.44),
    timestampBackground: alpha("#DBEAFE", 0.92),
    timestampText: "#1D4ED8",
    titleAlign: "left",
    titleScale: 1.02,
    eyebrowColor: props.accentColor,
    badgeBackground: alpha("#FFFFFF", 0.96),
    badgeBorder: alpha("#D7DEE9", 0.96),
    buttonBackground: props.accentColor,
    buttonBorder: alpha(props.accentColor, 0.36),
    buttonText: "#EFF6FF",
    chipBackground: alpha("#EFF6FF", 0.92),
    chipBorder: alpha("#BFDBFE", 0.96),
    accentRule: `linear-gradient(90deg, ${props.accentColor} 0%, ${alpha(props.accentColor, 0)} 100%)`,
  };
}

export const YTChapters: React.FC<YTChaptersProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, scale, isPortrait, isSquare } = useResponsiveConfig();

  const effectiveStylePreset =
    props.stylePreset ??
    (props.visualStyle === "editorial-index"
      ? "editorial"
      : props.visualStyle === "creator-dark"
        ? "cinematic-noir"
        : "modern-clean");

  const resolved = resolveStylePreset(
    effectiveStylePreset,
    props.typography,
    props.motionStyle,
    props.effects,
  );
  const typo = resolveTypography(resolved.typography);
  const motion = resolveMotionStyle(resolved.motionStyle);
  const fx = resolveEffects(resolved.effects, props.accentColor);
  const variant = getVariant(props);

  const activeIndex = Math.max(0, Math.min(props.activeChapter, props.chapters.length - 1));
  const totalFrames = secToFrame(props.duration);
  const titleEnd = Math.round(totalFrames * 0.14 * motion.durationMultiplier);
  const chapterWindow = adaptiveEntranceWindow(props.duration, totalFrames, motion.durationMultiplier, {
    startPct: 0.1,
    minSec: 2.2,
    maxSec: 4.8,
    maxEndPct: 0.82,
  });
  const exitStart = Math.round(totalFrames * 0.9);
  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);
  const exitBlur = fx.blurTransition
    ? interpolate(frame, [exitStart, totalFrames], [0, 8], CLAMP)
    : 0;
  const floatY =
    motion.microMotionEnabled && frame > chapterWindow.endFrame && frame < exitStart
      ? microFloat(frame, Math.max(1, scale * 2)).y
      : 0;

  const shellWidth = Math.round(width * (isPortrait ? 0.94 : variant.contentWidthPct));
  const shellPaddingX = Math.round((isPortrait ? 26 : 38) * scale);
  const shellPaddingY = Math.round((isPortrait ? 24 : 34) * scale);
  const titleSize = Math.round((isPortrait ? 44 : isSquare ? 50 : 58) * scale * variant.titleScale);
  const supportSize = Math.round((isPortrait ? 16 : 18) * scale);
  const rowHeight = Math.round((isPortrait ? 100 : 96) * scale);
  const rowGap = Math.round((isPortrait ? 15 : 18) * scale);
  const chapterCountLabel = `${props.chapters.length} chapters`;
  const ctaLabel = props.ctaLabel ?? "Jump to chapter";

  const titleState =
    props.entranceAnimation === "scale-pop"
      ? scalePop(frame, { startFrame: 0, endFrame: titleEnd }, 1.05)
      : props.entranceAnimation === "slide-up"
        ? slideUp(frame, { startFrame: 0, endFrame: titleEnd }, 28)
        : fadeIn(frame, { startFrame: 0, endFrame: titleEnd });

  const chapterState = (index: number) => {
    const range = staggerDelay(
      index,
      Math.max(1, props.chapters.length + 2),
      Math.max(1, chapterWindow.endFrame - chapterWindow.startFrame),
    );
    const adjusted = {
      startFrame: chapterWindow.startFrame + range.startFrame,
      endFrame: chapterWindow.startFrame + range.endFrame,
    };

    if (props.entranceAnimation === "scale-pop") {
      return scalePop(frame, adjusted, index === activeIndex ? 1.04 : 1.02);
    }
    if (props.entranceAnimation === "slide-up") {
      return slideUp(frame, adjusted, 22);
    }
    return fadeIn(frame, adjusted);
  };

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} frame={frame} />
      <DecorativeLayer
        theme={variant.decorativeTheme}
        accentColor={props.visualStyle === "creator-dark" ? props.secondaryAccentColor : props.accentColor}
        frame={frame}
        totalFrames={totalFrames}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            props.visualStyle === "creator-dark"
              ? `radial-gradient(circle at 78% 16%, ${alpha(props.secondaryAccentColor, 0.14)} 0%, transparent 34%)`
              : `radial-gradient(circle at 18% 18%, ${alpha(props.accentColor, 0.1)} 0%, transparent 38%)`,
          opacity: exitOpacity,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: `${shellWidth}px`,
          transform: `translate(-50%, -50%) translateY(${floatY}px)`,
          opacity: exitOpacity,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        <div
          style={{
            position: "relative",
            padding: `${shellPaddingY}px ${shellPaddingX}px`,
            borderRadius: `${Math.round(34 * scale)}px`,
            background: variant.shellBackground,
            border: `1px solid ${variant.shellBorder}`,
            boxShadow: variant.shellShadow,
            backdropFilter: "blur(10px)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: shellPaddingX,
              right: shellPaddingX,
              height: `${Math.max(4, Math.round(5 * scale))}px`,
              borderRadius: `${Math.round(999 * scale)}px`,
              background: variant.accentRule,
              opacity: 0.92,
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: isPortrait ? "flex-start" : "center",
              justifyContent: "space-between",
              flexDirection: isPortrait ? "column" : "row",
              gap: `${Math.round(18 * scale)}px`,
              marginBottom: `${Math.round(28 * scale)}px`,
              opacity: titleState.opacity,
              transform: `translateY(${("y" in titleState ? titleState.y : 0) ?? 0}px) scale(${("scale" in titleState ? titleState.scale : 1) ?? 1})`,
            }}
          >
            <div
              style={{
                maxWidth: `${Math.round(shellWidth * (isPortrait ? 0.94 : 0.66))}px`,
                textAlign: variant.titleAlign,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: `${Math.round(10 * scale)}px`,
                  fontSize: `${Math.round((isPortrait ? 12 : 13) * scale)}px`,
                  fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: variant.eyebrowColor,
                  marginBottom: `${Math.round(10 * scale)}px`,
                }}
              >
                <span
                  style={{
                    width: `${Math.round(24 * scale)}px`,
                    height: `${Math.round(2 * scale)}px`,
                    borderRadius: `${Math.round(999 * scale)}px`,
                    background: variant.eyebrowColor,
                    opacity: 0.9,
                  }}
                />
                {props.eyebrow ?? "YouTube Chapters"}
              </div>

              <div
                style={{
                  fontSize: `${titleSize}px`,
                  fontWeight: 800,
                  fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                  color: props.titleColor,
                  lineHeight: 1.05,
                  letterSpacing: props.visualStyle === "creator-dark" ? "-0.03em" : "-0.025em",
                }}
              >
                {props.title}
              </div>

              {props.subtitle ? (
                <div
                  style={{
                    marginTop: `${Math.round(10 * scale)}px`,
                    fontSize: `${supportSize}px`,
                    fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                    color: props.subtitleColor,
                    lineHeight: 1.42,
                    maxWidth: `${Math.round(shellWidth * 0.52)}px`,
                  }}
                >
                  {props.subtitle}
                </div>
              ) : null}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: `${Math.round(12 * scale)}px`,
                flexWrap: "wrap",
              }}
            >
              {props.totalDurationLabel ? (
                <div
                  style={{
                    padding: `${Math.round(10 * scale)}px ${Math.round(15 * scale)}px`,
                    borderRadius: `${Math.round(999 * scale)}px`,
                    background: variant.badgeBackground,
                    border: `1px solid ${variant.badgeBorder}`,
                    color: props.bodyColor,
                    fontSize: `${Math.round((isPortrait ? 14 : 15) * scale)}px`,
                    fontWeight: 700,
                    fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                  }}
                >
                  {props.totalDurationLabel}
                </div>
              ) : null}

              <div
                style={{
                  padding: `${Math.round(9 * scale)}px ${Math.round(14 * scale)}px`,
                  borderRadius: `${Math.round(999 * scale)}px`,
                  background: variant.badgeBackground,
                  border: `1px solid ${variant.badgeBorder}`,
                  color: props.mutedTextColor,
                  fontSize: `${Math.round((isPortrait ? 13 : 14) * scale)}px`,
                  fontWeight: 700,
                  fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                }}
              >
                {chapterCountLabel}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isPortrait ? "1fr" : `${Math.round(shellWidth * 0.205)}px 1fr`,
              gap: `${Math.round((isPortrait ? 18 : 22) * scale)}px`,
              alignItems: "start",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: isPortrait ? "row" : "column",
                gap: `${Math.round(12 * scale)}px`,
                padding: `${Math.round(18 * scale)}px`,
                borderRadius: `${Math.round(24 * scale)}px`,
                background: variant.railBackground,
                border: `1px solid ${variant.railBorder}`,
                minHeight: `${Math.round((isPortrait ? 84 : 132) * scale)}px`,
              }}
            >
              <div
                style={{
                  width: `${Math.round((isPortrait ? 52 : 108) * scale)}px`,
                  height: `${Math.round((isPortrait ? 52 : 108) * scale)}px`,
                  borderRadius: `${Math.round(18 * scale)}px`,
                  background: alpha(
                    props.visualStyle === "creator-dark" ? props.secondaryAccentColor : props.accentColor,
                    props.visualStyle === "creator-dark" ? 0.18 : 0.12,
                  ),
                  border: `1px solid ${alpha(props.accentColor, 0.28)}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Asset
                  id="play"
                  width={Math.round((isPortrait ? 18 : 24) * scale)}
                  height={Math.round((isPortrait ? 18 : 24) * scale)}
                  color={props.visualStyle === "creator-dark" ? props.secondaryAccentColor : props.accentColor}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: `${Math.round(8 * scale)}px` }}>
                <div
                  style={{
                    fontSize: `${Math.round((isPortrait ? 14 : 15) * scale)}px`,
                    fontWeight: 700,
                    color: props.bodyColor,
                    fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  Chapter Marker
                </div>
                <div
                  style={{
                    fontSize: `${Math.round((isPortrait ? 17 : 20) * scale)}px`,
                    fontWeight: 700,
                    color: props.titleColor,
                    fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                    lineHeight: 1.2,
                  }}
                >
                  {props.chapters[activeIndex]?.title}
                </div>
                {props.currentTimestamp ? (
                  <div
                    style={{
                      alignSelf: "flex-start",
                      padding: `${Math.round(9 * scale)}px ${Math.round(14 * scale)}px`,
                      borderRadius: `${Math.round(999 * scale)}px`,
                      background: variant.chipBackground,
                      border: `1px solid ${variant.chipBorder}`,
                      color: props.bodyColor,
                      fontSize: `${Math.round((isPortrait ? 13 : 14) * scale)}px`,
                      fontWeight: 700,
                      fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                    }}
                  >
                    Now at {props.currentTimestamp}
                  </div>
                ) : null}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: `${rowGap}px` }}>
              {props.chapters.map((chapter, index) => {
                const state = chapterState(index);
                const isActive = index === activeIndex;
                const accent = chapter.accentColor ?? (isActive ? props.secondaryAccentColor : props.accentColor);

                return (
                  <div
                    key={`${chapter.timestamp}-${chapter.title}`}
                    style={{
                      minHeight: `${rowHeight}px`,
                      borderRadius: `${Math.round(22 * scale)}px`,
                      background: isActive ? variant.activeRowBackground : variant.rowBackground,
                      border: `1px solid ${isActive ? variant.activeRowBorder : variant.rowBorder}`,
                      padding: `${Math.round(18 * scale)}px ${Math.round(20 * scale)}px`,
                      display: "grid",
                      gridTemplateColumns: `${Math.round((isPortrait ? 88 : 110) * scale)}px 1fr auto`,
                      gap: `${Math.round(16 * scale)}px`,
                      alignItems: "center",
                      opacity: state.opacity,
                      transform: `translateY(${("y" in state ? state.y : 0) ?? 0}px) scale(${("scale" in state ? state.scale : 1) ?? 1})`,
                      boxShadow: isActive ? `0 22px 52px ${alpha(accent, 0.16)}` : undefined,
                    }}
                  >
                    <div
                      style={{
                        alignSelf: "stretch",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: `${Math.round(18 * scale)}px`,
                        background: variant.timestampBackground,
                        color: variant.timestampText,
                        fontSize: `${Math.round((isPortrait ? 19 : 21) * scale)}px`,
                        fontWeight: 800,
                        fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {chapter.timestamp}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: `${Math.round(6 * scale)}px` }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: `${Math.round(10 * scale)}px`,
                          flexWrap: "wrap",
                        }}
                      >
                        {chapter.iconId ? (
                          <div
                            style={{
                              width: `${Math.round(32 * scale)}px`,
                              height: `${Math.round(32 * scale)}px`,
                              borderRadius: `${Math.round(10 * scale)}px`,
                              background: alpha(accent, 0.14),
                              border: `1px solid ${alpha(accent, 0.26)}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Asset id={chapter.iconId} width={Math.round(14 * scale)} height={Math.round(14 * scale)} color={accent} />
                          </div>
                        ) : null}

                        <div
                          style={{
                            fontSize: `${Math.round((isPortrait ? 22 : 25) * scale)}px`,
                            fontWeight: isActive ? 800 : 700,
                            fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                            color: props.titleColor,
                            lineHeight: 1.1,
                          }}
                        >
                          {chapter.title}
                        </div>
                      </div>

                      {chapter.summary ? (
                        <div
                          style={{
                            fontSize: `${Math.round((isPortrait ? 14 : 15) * scale)}px`,
                            fontWeight: 500,
                            fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                            color: props.mutedTextColor,
                            lineHeight: 1.35,
                            maxWidth: `${Math.round(shellWidth * 0.46)}px`,
                          }}
                        >
                          {chapter.summary}
                        </div>
                      ) : null}
                    </div>

                    <div
                      style={{
                        justifySelf: "end",
                        display: "flex",
                        alignItems: "center",
                        gap: `${Math.round(8 * scale)}px`,
                        color: isActive ? accent : props.mutedTextColor,
                        fontSize: `${Math.round((isPortrait ? 14 : 15) * scale)}px`,
                        fontWeight: 700,
                        fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        minWidth: `${Math.round((isPortrait ? 88 : 98) * scale)}px`,
                        justifyContent: "flex-end",
                      }}
                    >
                      {isActive ? "Active" : "Up Next"}
                      <Asset id="arrow-right" width={Math.round(12 * scale)} height={Math.round(12 * scale)} color={isActive ? accent : props.mutedTextColor} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: `${Math.round(16 * scale)}px`,
              flexWrap: "wrap",
              marginTop: `${Math.round(24 * scale)}px`,
            }}
          >
            <div
              style={{
                fontSize: `${Math.round((isPortrait ? 14 : 15) * scale)}px`,
                fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                color: props.mutedTextColor,
                lineHeight: 1.4,
              }}
            >
              Structured timestamps that feel native to creator and broadcast workflows.
            </div>

            <div
              style={{
                minWidth: `${Math.round(194 * scale)}px`,
                minHeight: `${Math.round(54 * scale)}px`,
                padding: `${Math.round(11 * scale)}px ${Math.round(20 * scale)}px`,
                borderRadius: `${Math.round(999 * scale)}px`,
                background: variant.buttonBackground,
                border: `1px solid ${variant.buttonBorder}`,
                color: variant.buttonText,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: `${Math.round(10 * scale)}px`,
                fontSize: `${Math.round((isPortrait ? 15 : 16) * scale)}px`,
                fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                fontWeight: 700,
                letterSpacing: "0.01em",
                boxShadow: `0 12px 28px ${alpha(
                  props.visualStyle === "creator-dark" ? props.secondaryAccentColor : props.accentColor,
                  0.18,
                )}`,
              }}
            >
              {ctaLabel}
              <Asset id="play" width={Math.round(14 * scale)} height={Math.round(14 * scale)} color={variant.buttonText} />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
