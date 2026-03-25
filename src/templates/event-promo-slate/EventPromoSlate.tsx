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
import type { EventPromoSlateProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

function alpha(hex: string, opacity: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

type Variant = {
  panelBg: string;
  panelBorder: string;
  panelShadow: string;
  halo: string;
  overlay?: string;
  ticketBg: string;
  ticketBorder: string;
  ctaBg: string;
  ctaBorder: string;
  chipBg: string;
  chipBorder: string;
  chipText: string;
  titleTransform?: "uppercase" | "none";
  titleLetterSpacing?: string;
  align: "left" | "center";
  accentRule: string;
  panelWidthPct: number;
  titleScale: number;
  metadataScale: number;
  ctaScale: number;
  supportScale: number;
};

function getVariant(props: EventPromoSlateProps): Variant {
  if (props.visualStyle === "conference-clean") {
    return {
      panelBg: alpha("#FFFFFF", 0.9),
      panelBorder: alpha("#D9E1EB", 0.96),
      panelShadow: `0 28px 80px ${alpha("#0F172A", 0.14)}`,
      halo: `radial-gradient(circle at 18% 14%, ${alpha(props.accentColor, 0.14)} 0%, transparent 38%)`,
      overlay: `linear-gradient(180deg, ${alpha("#F6F3EC", 0.85)} 0%, ${alpha("#ECE6DC", 0.74)} 100%)`,
      ticketBg: alpha("#FFFFFF", 0.96),
      ticketBorder: alpha("#D9E1EB", 0.96),
      ctaBg: props.accentColor,
      ctaBorder: alpha(props.accentColor, 0.42),
      chipBg: alpha("#F8FAFC", 0.96),
      chipBorder: alpha("#D7DEE9", 0.96),
      chipText: props.metadataTextColor,
      titleTransform: "none",
      titleLetterSpacing: "-0.03em",
      align: "left",
      accentRule: `linear-gradient(90deg, ${props.accentColor} 0%, ${alpha(props.accentColor, 0)} 100%)`,
      panelWidthPct: 0.84,
      titleScale: 1.06,
      metadataScale: 1.08,
      ctaScale: 1.08,
      supportScale: 1.04,
    };
  }

  if (props.visualStyle === "festival-burst") {
    return {
      panelBg: `linear-gradient(160deg, ${alpha(props.cardBackground, 0.84)} 0%, ${alpha("#1E0C26", 0.94)} 100%)`,
      panelBorder: alpha(props.secondaryAccentColor, 0.26),
      panelShadow: `0 32px 84px ${alpha("#14040E", 0.34)}`,
      halo: `radial-gradient(circle at 82% 18%, ${alpha(props.secondaryAccentColor, 0.18)} 0%, transparent 32%), radial-gradient(circle at 18% 82%, ${alpha(props.accentColor, 0.16)} 0%, transparent 35%)`,
      overlay: `linear-gradient(135deg, ${alpha("#300D3B", 0.34)} 0%, transparent 42%), linear-gradient(320deg, ${alpha("#7C2D12", 0.3)} 0%, transparent 35%)`,
      ticketBg: alpha("#1A1022", 0.92),
      ticketBorder: alpha(props.secondaryAccentColor, 0.32),
      ctaBg: props.secondaryAccentColor,
      ctaBorder: alpha(props.secondaryAccentColor, 0.42),
      chipBg: alpha("#160F21", 0.86),
      chipBorder: alpha(props.secondaryAccentColor, 0.24),
      chipText: props.metadataTextColor,
      titleTransform: "uppercase",
      titleLetterSpacing: "-0.035em",
      align: "left",
      accentRule: `linear-gradient(90deg, ${props.secondaryAccentColor} 0%, ${props.accentColor} 55%, ${alpha(props.accentColor, 0)} 100%)`,
      panelWidthPct: 0.82,
      titleScale: 1.08,
      metadataScale: 1.04,
      ctaScale: 1.1,
      supportScale: 1.02,
    };
  }

  return {
    panelBg: alpha(props.cardBackground, 0.84),
    panelBorder: alpha(props.accentColor, 0.18),
    panelShadow: `0 28px 76px ${alpha("#020617", 0.38)}`,
    halo: `radial-gradient(circle at 50% 18%, ${alpha(props.accentColor, 0.12)} 0%, transparent 36%)`,
    overlay: `linear-gradient(180deg, transparent 0%, ${alpha("#020617", 0.12)} 100%)`,
    ticketBg: alpha("#0B1020", 0.88),
    ticketBorder: alpha(props.accentColor, 0.24),
    ctaBg: props.accentColor,
    ctaBorder: alpha(props.accentColor, 0.42),
    chipBg: alpha("#FFFFFF", 0.05),
    chipBorder: alpha("#FFFFFF", 0.08),
    chipText: props.metadataTextColor,
    titleTransform: "none",
    titleLetterSpacing: "-0.03em",
    align: "center",
    accentRule: `linear-gradient(90deg, ${alpha(props.accentColor, 0)} 0%, ${props.accentColor} 50%, ${alpha(props.accentColor, 0)} 100%)`,
    panelWidthPct: 0.84,
    titleScale: 1.05,
    metadataScale: 1.06,
    ctaScale: 1.08,
    supportScale: 1.02,
  };
}

export const EventPromoSlate: React.FC<EventPromoSlateProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, scale, isPortrait, isSquare } = useResponsiveConfig();

  const effectiveStylePreset =
    props.stylePreset ??
    (props.visualStyle === "conference-clean"
      ? "editorial"
      : props.visualStyle === "festival-burst"
        ? "warm-organic"
        : "cinematic-noir");

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

  const totalFrames = secToFrame(props.duration);
  const titleEnd = Math.round(totalFrames * 0.15 * motion.durationMultiplier);
  const subtitleEnd = Math.round(totalFrames * 0.22 * motion.durationMultiplier);
  const contentWindow = adaptiveEntranceWindow(props.duration, totalFrames, motion.durationMultiplier, {
    startPct: 0.08,
    minSec: 1.6,
    maxSec: 3.8,
    maxEndPct: 0.74,
  });
  const exitStart = Math.round(totalFrames * 0.88);
  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);
  const exitBlur = fx.blurTransition ? interpolate(frame, [exitStart, totalFrames], [0, 8], CLAMP) : 0;
  const floatY =
    motion.microMotionEnabled && frame > contentWindow.endFrame && frame < exitStart
      ? microFloat(frame, Math.max(1, scale * 2.2)).y
      : 0;

  const panelWidth = Math.round(width * (isPortrait ? 0.88 : variant.panelWidthPct));
  const panelPaddingX = Math.round((isPortrait ? 28 : 38) * scale);
  const panelPaddingY = Math.round((isPortrait ? 26 : 32) * scale);
  const titleSize = Math.round((isPortrait || isSquare ? 48 : 68) * scale * variant.titleScale);
  const chipGap = Math.round(12 * scale);

  const metadata = [
    props.dateText ? { icon: "calendar", text: props.dateText } : null,
    props.timeText ? { icon: "alarm", text: props.timeText } : null,
    props.venueText ? { icon: "ticket", text: props.venueText } : null,
    props.locationText ? { icon: "map", text: props.locationText } : null,
  ].filter(Boolean) as Array<{ icon: string; text: string }>;

  const itemRange = (index: number) => {
    const range = staggerDelay(index, Math.max(1, metadata.length + 3), Math.max(1, contentWindow.endFrame - contentWindow.startFrame));
    return {
      startFrame: contentWindow.startFrame + range.startFrame,
      endFrame: contentWindow.startFrame + range.endFrame,
    };
  };

  const titleState =
    props.entranceAnimation === "scale-pop"
      ? scalePop(frame, { startFrame: 0, endFrame: titleEnd }, 1.08)
      : props.entranceAnimation === "slide-up"
        ? slideUp(frame, { startFrame: 0, endFrame: titleEnd }, 36)
        : fadeIn(frame, { startFrame: 0, endFrame: titleEnd });

  const subtitleState =
    props.entranceAnimation === "scale-pop"
      ? scalePop(frame, { startFrame: Math.round(titleEnd * 0.35), endFrame: subtitleEnd }, 1.03)
      : props.entranceAnimation === "slide-up"
        ? slideUp(frame, { startFrame: Math.round(titleEnd * 0.35), endFrame: subtitleEnd }, 20)
        : fadeIn(frame, { startFrame: Math.round(titleEnd * 0.35), endFrame: subtitleEnd });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} />
      <DecorativeLayer
        theme={
          props.visualStyle === "conference-clean"
            ? "corner-accents"
            : props.visualStyle === "festival-burst"
              ? "light-streaks"
              : "minimal-dots"
        }
        accentColor={props.visualStyle === "festival-burst" ? props.secondaryAccentColor : props.accentColor}
        frame={frame}
        totalFrames={totalFrames}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: variant.halo,
          opacity: exitOpacity,
        }}
      />
      {variant.overlay ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: variant.overlay,
            opacity: exitOpacity,
            mixBlendMode: props.visualStyle === "conference-clean" ? "multiply" : "screen",
          }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: `${panelWidth}px`,
          transform: `translate(-50%, -50%) translateY(${floatY}px)`,
          opacity: exitOpacity,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        <div
          style={{
            position: "relative",
            padding: `${panelPaddingY}px ${panelPaddingX}px`,
            borderRadius: `${Math.round(34 * scale)}px`,
            background: variant.panelBg,
            border: `1px solid ${variant.panelBorder}`,
            boxShadow: variant.panelShadow,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: panelPaddingX,
              right: panelPaddingX,
              height: `${Math.max(4, Math.round(5 * scale))}px`,
              borderRadius: `${Math.round(999 * scale)}px`,
              background: variant.accentRule,
              opacity: 0.9,
            }}
          />

          {props.badgeText ? (
            <div
              style={{
                position: "absolute",
                right: `${panelPaddingX}px`,
                top: `${panelPaddingY}px`,
                display: "inline-flex",
                alignItems: "center",
                gap: `${Math.round(8 * scale)}px`,
                padding: `${Math.round(8 * scale)}px ${Math.round(12 * scale)}px`,
                borderRadius: `${Math.round(999 * scale)}px`,
                background: variant.ticketBg,
                border: `1px solid ${variant.ticketBorder}`,
                color: props.metadataTextColor,
                fontSize: `${Math.round(12 * scale)}px`,
                fontWeight: 700,
                fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <Asset id="ticket" width={Math.round(14 * scale)} height={Math.round(14 * scale)} color={props.secondaryAccentColor} />
              {props.badgeText}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: variant.align === "left" ? "flex-start" : "center",
              textAlign: variant.align,
              gap: `${Math.round(20 * scale)}px`,
            }}
          >
            {props.eyebrow ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: `${Math.round(10 * scale)}px`,
                  color: props.accentColor,
                  fontSize: `${Math.round(14 * scale)}px`,
                  fontWeight: 700,
                  fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  opacity: fadeIn(frame, { startFrame: 0, endFrame: Math.round(titleEnd * 0.55) }).opacity,
                }}
              >
                <span
                  style={{
                    width: `${Math.round(26 * scale)}px`,
                    height: `${Math.round(2 * scale)}px`,
                    background: props.accentColor,
                    borderRadius: `${Math.round(999 * scale)}px`,
                  }}
                />
                {props.eyebrow}
              </div>
            ) : null}

            <div style={{ maxWidth: `${Math.round(panelWidth * (variant.align === "left" ? 0.68 : 0.86))}px` }}>
              <div
                style={{
                  fontSize: `${titleSize}px`,
                  fontWeight: 800,
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: props.titleColor,
                  lineHeight: 1.02,
                  letterSpacing: variant.titleLetterSpacing ?? "-0.03em",
                  textTransform: variant.titleTransform,
                  opacity: titleState.opacity,
                  transform: "y" in titleState
                    ? `translateY(${titleState.y}px)`
                    : `scale(${("scale" in titleState ? titleState.scale : 1)})`,
                }}
              >
                {props.title}
              </div>
              {props.subtitle ? (
              <div
                style={{
                  marginTop: `${Math.round(14 * scale)}px`,
                  fontSize: `${Math.round((isPortrait ? 19 : 21) * scale)}px`,
                  fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                  color: props.subtitleColor,
                  lineHeight: 1.35,
                    opacity: subtitleState.opacity,
                    transform: "y" in subtitleState
                      ? `translateY(${subtitleState.y}px)`
                      : `scale(${("scale" in subtitleState ? subtitleState.scale : 1)})`,
                  }}
                >
                  {props.subtitle}
                </div>
              ) : null}
            </div>

            {metadata.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: `${chipGap}px`,
                  justifyContent: variant.align === "left" ? "flex-start" : "center",
                }}
              >
                {metadata.map((item, index) => {
                  const state =
                    props.entranceAnimation === "scale-pop"
                      ? scalePop(frame, itemRange(index), 1.04)
                      : props.entranceAnimation === "slide-up"
                        ? slideUp(frame, itemRange(index), 18)
                        : fadeIn(frame, itemRange(index));
                  return (
                    <div
                      key={`${item.icon}-${item.text}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: `${Math.round(10 * scale)}px`,
                        padding: `${Math.round(12 * scale)}px ${Math.round(16 * scale)}px`,
                        borderRadius: `${Math.round(999 * scale)}px`,
                        background: variant.chipBg,
                        border: `1px solid ${variant.chipBorder}`,
                        color: variant.chipText,
                        fontSize: `${Math.round(15 * scale * variant.metadataScale)}px`,
                        fontWeight: 600,
                        fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                        opacity: state.opacity,
                        transform: "y" in state
                          ? `translateY(${state.y}px)`
                          : `scale(${("scale" in state ? state.scale : 1)})`,
                      }}
                    >
                      <Asset id={item.icon} width={Math.round(16 * scale)} height={Math.round(16 * scale)} color={props.secondaryAccentColor} />
                      {item.text}
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div
              style={{
                display: "flex",
                alignItems: isPortrait ? "stretch" : "center",
                justifyContent: "space-between",
                flexDirection: isPortrait ? "column" : "row",
                width: "100%",
                gap: `${Math.round(18 * scale)}px`,
                marginTop: `${Math.round(8 * scale)}px`,
              }}
            >
                <div
                  style={{
                    color: props.mutedTextColor,
                    fontSize: `${Math.round(15 * scale * variant.supportScale)}px`,
                    fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                    lineHeight: 1.4,
                    maxWidth: `${Math.round(panelWidth * 0.52)}px`,
                    opacity: fadeIn(frame, itemRange(metadata.length + 1)).opacity,
                    alignSelf: variant.align === "left" ? "flex-start" : undefined,
                  }}
              >
                {props.supportLabel ?? "Seats fill fast. Secure your spot before registration closes."}
              </div>

              <div
                style={{
                  minWidth: `${Math.round((isPortrait ? 0 : 250) * scale)}px`,
                  padding: `${Math.round(18 * scale * variant.ctaScale)}px ${Math.round(26 * scale * variant.ctaScale)}px`,
                  borderRadius: `${Math.round(18 * scale)}px`,
                  background: variant.ctaBg,
                  border: `1px solid ${variant.ctaBorder}`,
                  color: props.buttonTextColor,
                  fontSize: `${Math.round((isPortrait ? 18 : 20) * scale * variant.ctaScale)}px`,
                  fontWeight: 800,
                  fontFamily: typo.fontFamily ?? "Arial, sans-serif",
                  letterSpacing: "0.01em",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: `${Math.round(10 * scale)}px`,
                  alignSelf: variant.align === "left" ? "flex-start" : undefined,
                  opacity: fadeIn(frame, itemRange(metadata.length + 2)).opacity,
                  boxShadow: `0 ${Math.round(12 * scale)}px ${Math.round(26 * scale)}px ${alpha(
                    props.visualStyle === "conference-clean" ? props.accentColor : props.secondaryAccentColor,
                    0.22,
                  )}`,
                }}
              >
                {props.ctaLabel}
                <Asset id="arrow-right" width={Math.round(18 * scale)} height={Math.round(18 * scale)} color={props.buttonTextColor} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
