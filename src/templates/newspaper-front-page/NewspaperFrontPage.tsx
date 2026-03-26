import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background } from "../../primitives/Background";
import { DecorativeLayer } from "../../primitives/DecorativeLayer";
import {
  adaptiveEntranceWindow,
  cameraDrift,
  fadeIn,
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
import type { NewspaperFrontPageProps } from "./schema";

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
  paperInset: number;
  paperShadow: string;
  mastheadScale: number;
  headlineSizeScale: number;
  headlineWeight: number;
  accentRule: string;
  photoBackground: string;
  photoBorder: string;
  bodyOpacity: number;
};

type EntranceState = {
  opacity: number;
  y: number;
  scale: number;
};

type DriftState = {
  x: number;
  y: number;
  scale: number;
  rotate: number;
};

type ColumnData = {
  title?: string;
  text: string;
};

function paragraphize(text: string) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (sentences.length >= 3) {
    return [
      sentences.slice(0, 1).join(" "),
      sentences.slice(1, Math.ceil(sentences.length / 2)).join(" "),
      sentences.slice(Math.ceil(sentences.length / 2)).join(" "),
    ].filter(Boolean);
  }

  if (sentences.length === 2) {
    return sentences;
  }

  const words = text.trim().split(/\s+/);
  if (words.length <= 16) return [text.trim()];

  const firstBreak = Math.ceil(words.length * 0.45);
  const secondBreak = Math.ceil(words.length * 0.78);

  return [
    words.slice(0, firstBreak).join(" "),
    words.slice(firstBreak, secondBreak).join(" "),
    words.slice(secondBreak).join(" "),
  ].filter(Boolean);
}

function getVariant(props: NewspaperFrontPageProps): Variant {
  if (props.visualStyle === "classic-front-page") {
    return {
      decorativeTheme: "corner-accents",
      paperInset: 0.72,
      paperShadow: `0 24px 82px ${alpha("#0F172A", 0.18)}`,
      mastheadScale: 0.97,
      headlineSizeScale: 0.98,
      headlineWeight: 840,
      accentRule: `linear-gradient(90deg, ${alpha(props.accentColor, 0.72)} 0%, ${alpha(props.accentColor, 0.08)} 42%, ${alpha(props.accentColor, 0)} 100%)`,
      photoBackground: alpha("#E8EDF5", 0.96),
      photoBorder: alpha(props.frameColor, 0.76),
      bodyOpacity: 0.92,
    };
  }

  if (props.visualStyle === "financial-journal") {
    return {
      decorativeTheme: "minimal-dots",
      paperInset: 0.71,
      paperShadow: `0 26px 88px ${alpha("#0B1020", 0.24)}`,
      mastheadScale: 0.94,
      headlineSizeScale: 0.94,
      headlineWeight: 800,
      accentRule: `linear-gradient(90deg, ${alpha(props.accentColor, 0.52)} 0%, ${alpha(props.accentColor, 0)} 100%)`,
      photoBackground: alpha("#1C2026", 0.88),
      photoBorder: alpha(props.frameColor, 0.3),
      bodyOpacity: 0.9,
    };
  }

  if (props.visualStyle === "tabloid-shock") {
    return {
      decorativeTheme: "light-streaks",
      paperInset: 0.76,
      paperShadow: `0 44px 124px ${alpha("#1A0A06", 0.36)}`,
      mastheadScale: 0.9,
      headlineSizeScale: 1.18,
      headlineWeight: 900,
      accentRule: `linear-gradient(90deg, ${props.accentColor} 0%, ${alpha(props.accentColor, 0.12)} 36%, ${alpha(props.accentColor, 0)} 100%)`,
      photoBackground: alpha("#1F1512", 0.94),
      photoBorder: alpha(props.accentColor, 0.36),
      bodyOpacity: 0.8,
    };
  }

  if (props.visualStyle === "sports-daily") {
    return {
      decorativeTheme: "corner-accents",
      paperInset: 0.74,
      paperShadow: `0 32px 102px ${alpha("#07111E", 0.32)}`,
      mastheadScale: 0.96,
      headlineSizeScale: 1.08,
      headlineWeight: 900,
      accentRule: `linear-gradient(90deg, ${alpha(props.accentColor, 0.88)} 0%, ${alpha(props.accentColor, 0.18)} 28%, ${alpha(props.accentColor, 0)} 100%)`,
      photoBackground: alpha("#12171D", 0.92),
      photoBorder: alpha(props.accentColor, 0.34),
      bodyOpacity: 0.84,
    };
  }

  if (props.visualStyle === "modern-breaking-news") {
    return {
      decorativeTheme: "light-streaks",
      paperInset: 0.74,
      paperShadow: `0 24px 78px ${alpha("#0F172A", 0.2)}`,
      mastheadScale: 0.9,
      headlineSizeScale: 1.02,
      headlineWeight: 900,
      accentRule: `linear-gradient(90deg, ${alpha(props.accentColor, 0.9)} 0%, ${alpha(props.accentColor, 0.18)} 30%, ${alpha(props.accentColor, 0)} 100%)`,
      photoBackground: alpha("#E6EBF2", 0.96),
      photoBorder: alpha(props.frameColor, 0.82),
      bodyOpacity: 0.9,
    };
  }

  if (props.visualStyle === "historic-edition") {
    return {
      decorativeTheme: "minimal-dots",
      paperInset: 0.68,
      paperShadow: `0 30px 96px ${alpha("#1E140C", 0.34)}`,
      mastheadScale: 1.02,
      headlineSizeScale: 1.12,
      headlineWeight: 900,
      accentRule: `linear-gradient(90deg, ${alpha(props.accentColor, 0.86)} 0%, ${alpha(props.accentColor, 0)} 100%)`,
      photoBackground: alpha("#2B241D", 0.92),
      photoBorder: alpha("#8B7355", 0.42),
      bodyOpacity: 0.88,
    };
  }

  return {
    decorativeTheme: "corner-accents",
    paperInset: 0.7,
    paperShadow: `0 34px 110px ${alpha("#000000", 0.36)}`,
    mastheadScale: 1,
    headlineSizeScale: 1,
    headlineWeight: 900,
    accentRule: `linear-gradient(90deg, ${alpha(props.accentColor, 0.82)} 0%, ${alpha(props.accentColor, 0)} 100%)`,
    photoBackground: alpha("#1F1B18", 0.92),
    photoBorder: alpha("#6B5A43", 0.42),
    bodyOpacity: 0.84,
  };
}

function getEntrance(
  frame: number,
  preset: NewspaperFrontPageProps["entranceAnimation"],
  startFrame: number,
  endFrame: number,
): EntranceState {
  const range = { startFrame, endFrame };
  if (preset === "none") return { opacity: 1, y: 0, scale: 1 };
  if (preset === "fade-in") {
    const state = fadeIn(frame, range);
    return { opacity: state.opacity, y: 0, scale: state.scale };
  }
  if (preset === "slide-up") {
    const state = slideUp(frame, range, 32);
    return { opacity: state.opacity, y: state.y, scale: 1 };
  }
  if (preset === "camera-drift") {
    const state = fadeIn(frame, range);
    return { opacity: state.opacity, y: 0, scale: 1 };
  }
  const state = scalePop(frame, range, 1.04);
  return { opacity: state.opacity, y: 0, scale: state.scale };
}

const loremFallback: ColumnData[] = [
  "In a stunning turn of events that has city leaders scrambling for answers, the situation unfolded with unusual speed and a striking sense of urgency. Officials are working to understand what changed, what it means, and what happens next.",
  "Witnesses described a sequence of developments that felt both chaotic and historic. Analysts expect the next 24 hours to shape the public response, while stakeholders across the region call for clarity and calm.",
  "As the story continues to evolve, attention has shifted toward the larger consequences. Public institutions, private leaders, and everyday observers now wait for the next confirmed update.",
].map((text) => ({ text }));

export const NewspaperFrontPage: React.FC<NewspaperFrontPageProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, scale, isPortrait, isSquare } = useResponsiveConfig();

  const effectiveStylePreset =
    props.stylePreset ??
    (props.visualStyle === "modern-breaking-news"
      ? "cinematic-noir"
      : props.visualStyle === "historic-edition"
        ? "editorial"
        : props.visualStyle === "classic-front-page"
          ? "modern-clean"
        : props.visualStyle === "financial-journal"
          ? "modern-clean"
          : props.visualStyle === "tabloid-shock"
            ? "brutalist"
            : props.visualStyle === "sports-daily"
              ? "cinematic-noir"
              : "minimal-luxury");

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
  const introWindow = adaptiveEntranceWindow(props.duration, totalFrames, motion.durationMultiplier, {
    startPct: 0.06,
    minSec: 1.6,
    maxSec: 3.2,
    maxEndPct: 0.52,
  });
  const exitStart = Math.round(totalFrames * 0.88);
  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);
  const paperState = getEntrance(frame, props.entranceAnimation, 0, introWindow.endFrame);
  const cameraRange = { startFrame: 0, endFrame: totalFrames };
  const drift: DriftState =
    props.entranceAnimation === "camera-drift"
      ? {
          ...cameraDrift(frame, cameraRange, 16, 10, 1, 1.035),
          rotate: interpolate(frame, [0, totalFrames], [props.paperTilt * 0.18, -props.paperTilt * 0.08], CLAMP),
        }
      : { x: 0, y: 0, scale: 1, rotate: 0 };

  const paperWidth = Math.round(width * (isPortrait ? 0.84 : isSquare ? 0.6 : variant.paperInset));
  const paperHeight = Math.round(height * (isPortrait ? 0.84 : 0.94));
  const paperPadding = Math.round((isPortrait ? 26 : 32) * scale);
  const dividerColor = alpha(props.inkColor, 0.34);
  const bodyFont = typo.fontFamily ?? '"Times New Roman", Georgia, serif';
  const mastheadFont =
    props.visualStyle === "modern-breaking-news" || props.visualStyle === "financial-journal"
      ? 'Inter, Arial, sans-serif'
      : '"Times New Roman", Georgia, serif';
  const sansFont =
    props.visualStyle === "classic-front-page" ||
    props.visualStyle === "financial-journal" ||
    props.visualStyle === "modern-breaking-news"
      ? 'Inter, Arial, sans-serif'
      : typo.fontFamily ?? 'Georgia, "Times New Roman", serif';
  const headlineFont =
    props.visualStyle === "modern-breaking-news" || props.visualStyle === "financial-journal"
      ? 'Inter, Arial, sans-serif'
      : mastheadFont;

  const headlineChars = props.headline.length;
  const headlineSize = Math.round(
    (headlineChars > 52 ? 58 : headlineChars > 34 ? 72 : 86) *
      scale *
      variant.headlineSizeScale *
      (isPortrait ? 0.8 : 1),
  );
  const bodySize = Math.round((isPortrait ? 15 : 17) * scale);
  const bodyLineHeight = 1.34;
  const columnGap = Math.round((isPortrait ? 20 : 24) * scale);
  const innerTopGap = Math.round(18 * scale);
  const photoHeight = Math.round((isPortrait ? 126 : 148) * scale);
  const columns: ColumnData[] = props.columns.length > 0 ? props.columns : loremFallback;
  const leadIndex = Math.min(1, columns.length - 1);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} frame={frame} />
      <DecorativeLayer
        theme={props.decorativeTheme ?? variant.decorativeTheme}
        accentColor={props.accentColor}
        frame={frame}
        totalFrames={totalFrames}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            props.visualStyle === "classic-front-page" ||
            props.visualStyle === "financial-journal" ||
            props.visualStyle === "modern-breaking-news"
              ? `radial-gradient(circle at 50% 38%, ${alpha("#F7FBFF", 0.14)} 0%, transparent 46%),
                 radial-gradient(circle at 15% 10%, ${alpha("#D9E7F7", 0.18)} 0%, transparent 28%)`
              : `radial-gradient(circle at 50% 44%, ${alpha("#F8F2E6", 0.06)} 0%, transparent 42%)`,
          opacity: exitOpacity,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: `${paperWidth}px`,
          height: `${paperHeight}px`,
          transform: `translate(-50%, -50%) translate(${drift.x}px, ${drift.y}px) rotate(${props.paperTilt + drift.rotate}deg) scale(${paperState.scale * drift.scale})`,
          opacity: paperState.opacity * exitOpacity,
          filter: fx.blurTransition ? `blur(${interpolate(frame, [0, introWindow.endFrame], [2.4, 0], CLAMP)}px)` : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: `${Math.round(8 * scale)}px`,
            background: `linear-gradient(180deg, ${alpha(props.paperTone, 0.98)} 0%, ${alpha(props.paperTone, 0.94)} 100%)`,
            border: `1px solid ${alpha(props.frameColor, 0.76)}`,
            boxShadow: variant.paperShadow,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                props.visualStyle === "historic-edition"
                  ? `radial-gradient(circle at 50% 0%, ${alpha("#FFF8E8", 0.28)} 0%, transparent 36%),
                     radial-gradient(circle at 12% 100%, ${alpha("#B08968", 0.1)} 0%, transparent 34%)`
                  : props.visualStyle === "classic-front-page" ||
                      props.visualStyle === "financial-journal" ||
                      props.visualStyle === "modern-breaking-news"
                    ? `radial-gradient(circle at 50% 8%, ${alpha("#FFFFFF", 0.22)} 0%, transparent 34%),
                       linear-gradient(180deg, ${alpha("#FFFFFF", 0.08)} 0%, transparent 26%)`
                  : `radial-gradient(circle at 50% 10%, ${alpha("#FFFFFF", 0.18)} 0%, transparent 34%)`,
              mixBlendMode: "screen",
              opacity: 0.76,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                props.visualStyle === "modern-breaking-news"
                  ? `linear-gradient(${alpha("#000000", 0.02)} 1px, transparent 1px), linear-gradient(90deg, ${alpha("#000000", 0.02)} 1px, transparent 1px)`
                  : "none",
              backgroundSize: `${Math.round(22 * scale)}px ${Math.round(22 * scale)}px`,
              opacity: 0.3,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: `${paperPadding}px`,
              right: `${paperPadding}px`,
              top: `${paperPadding}px`,
              bottom: `${paperPadding}px`,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontFamily: mastheadFont,
                fontSize: `${Math.round((isPortrait ? 40 : 54) * scale * variant.mastheadScale)}px`,
                fontWeight: 700,
                letterSpacing: "-0.035em",
                color: props.inkColor,
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              {props.masthead}
            </div>

            <div
              style={{
                marginTop: `${Math.round(8 * scale)}px`,
                height: `${Math.max(2, Math.round(3 * scale))}px`,
                background: props.inkColor,
                opacity: 0.88,
              }}
            />

            <div
              style={{
                marginTop: `${Math.round(12 * scale)}px`,
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: `${Math.round(10 * scale)}px`,
                alignItems: "center",
                color: alpha(props.inkColor, 0.86),
                fontFamily: sansFont,
                fontSize: `${Math.round((isPortrait ? 10 : 12) * scale)}px`,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              <div>{props.editionLine}</div>
              <div style={{ textAlign: "center" }}>{props.dateLine}</div>
              <div style={{ textAlign: "right" }}>{props.priceLine}</div>
            </div>

            <div
              style={{
                marginTop: `${Math.round(12 * scale)}px`,
                height: "1px",
                background: dividerColor,
              }}
            />

            {props.kicker ? (
              <div
                style={{
                  marginTop: `${Math.round(innerTopGap * 0.8)}px`,
                  alignSelf: "center",
                  padding: `0 ${Math.round(12 * scale)}px`,
                  color: alpha(props.inkColor, 0.64),
                  fontFamily: sansFont,
                  fontSize: `${Math.round((isPortrait ? 14 : 16) * scale)}px`,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  textAlign: "center",
                }}
              >
                {props.kicker}
              </div>
            ) : null}

            <div
              style={{
                marginTop: `${Math.round(10 * scale)}px`,
                fontFamily: mastheadFont,
                fontSize: `${headlineSize}px`,
                fontWeight: variant.headlineWeight,
                letterSpacing:
                  props.visualStyle === "modern-breaking-news" || props.visualStyle === "financial-journal"
                    ? "-0.035em"
                    : "-0.05em",
                lineHeight: 0.92,
                color: props.inkColor,
                textTransform: "uppercase",
                whiteSpace: "pre-wrap",
              }}
            >
              {props.headline}
            </div>

            {props.subheadline ? (
              <div
                style={{
                  marginTop: `${Math.round(10 * scale)}px`,
                  fontFamily: bodyFont,
                  fontSize: `${Math.round((isPortrait ? 17 : 20) * scale)}px`,
                  lineHeight: 1.3,
                  color: alpha(props.inkColor, 0.84),
                  maxWidth: `${Math.round(paperWidth * 0.74)}px`,
                }}
              >
                {props.subheadline}
              </div>
            ) : null}

            <div
              style={{
                marginTop: `${Math.round(22 * scale)}px`,
                display: "grid",
                gridTemplateColumns: isPortrait
                  ? "1fr"
                  : columns.length >= 3
                    ? "1fr 0.94fr 1fr"
                    : "1fr 1fr",
                gap: `${columnGap}px`,
                flex: 1,
              }}
            >
              {columns.map((column, index) => {
                const state = getEntrance(
                  frame,
                  props.entranceAnimation,
                  introWindow.startFrame + staggerDelay(index, columns.length, introWindow.endFrame).startFrame,
                  introWindow.startFrame + staggerDelay(index, columns.length, introWindow.endFrame).endFrame,
                );
                const isLead = index === leadIndex && !isPortrait;
                const paragraphs = paragraphize(column.text);

                return (
                  <div
                    key={`${index}-${column.title ?? "column"}`}
                    style={{
                      position: "relative",
                      paddingLeft: index > 0 && !isPortrait ? `${Math.round(14 * scale)}px` : "0px",
                      borderLeft: index > 0 && !isPortrait ? `1px solid ${dividerColor}` : "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: `${Math.round(10 * scale)}px`,
                      opacity: state.opacity,
                      transform: `translateY(${state.y}px) scale(${state.scale})`,
                    }}
                  >
                    {column.title ? (
                      <div
                        style={{
                          fontFamily: bodyFont,
                          fontWeight: 700,
                          fontSize: `${Math.round((isPortrait ? 16 : 18) * scale)}px`,
                          lineHeight: 1.15,
                          textTransform: "uppercase",
                          color: alpha(props.inkColor, 0.92),
                        }}
                      >
                        {column.title}
                      </div>
                    ) : null}

                    {isLead && props.showPhotoFrame ? (
                      <div
                        style={{
                          marginBottom: `${Math.round(4 * scale)}px`,
                          height: `${photoHeight}px`,
                          borderRadius: `${Math.round(4 * scale)}px`,
                          background: props.visualStyle === "modern-breaking-news"
                            ? `linear-gradient(180deg, ${alpha("#121212", 0.98)} 0%, ${alpha("#2B2B2B", 0.86)} 100%)`
                            : props.visualStyle === "classic-front-page" ||
                                props.visualStyle === "financial-journal" ||
                                props.visualStyle === "modern-breaking-news"
                              ? `linear-gradient(180deg, ${alpha("#E9EEF4", 0.98)} 0%, ${alpha("#D7DEE7", 0.94)} 100%)`
                            : `linear-gradient(180deg, ${variant.photoBackground} 0%, ${alpha("#000000", 0.78)} 100%)`,
                          border: `1px solid ${variant.photoBorder}`,
                          boxShadow:
                            props.visualStyle === "classic-front-page" ||
                            props.visualStyle === "financial-journal" ||
                            props.visualStyle === "modern-breaking-news"
                              ? `inset 0 0 0 1px ${alpha("#FFFFFF", 0.26)}`
                              : `inset 0 0 0 1px ${alpha("#FFFFFF", 0.03)}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              props.visualStyle === "historic-edition"
                                ? `radial-gradient(circle at 22% 18%, ${alpha("#FFFFFF", 0.16)} 0%, transparent 30%),
                                   linear-gradient(135deg, ${alpha("#000000", 0.12)} 0%, transparent 52%)`
                                : props.visualStyle === "classic-front-page" ||
                                    props.visualStyle === "financial-journal" ||
                                    props.visualStyle === "modern-breaking-news"
                                  ? `radial-gradient(circle at 24% 22%, ${alpha("#FFFFFF", 0.58)} 0%, transparent 32%),
                                     linear-gradient(135deg, ${alpha(props.accentColor, 0.06)} 0%, transparent 54%)`
                                : `radial-gradient(circle at 28% 26%, ${alpha("#FFFFFF", 0.12)} 0%, transparent 28%),
                                   linear-gradient(135deg, ${alpha(props.accentColor, 0.08)} 0%, transparent 54%)`,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            inset: `${Math.round(10 * scale)}px`,
                            border:
                              props.visualStyle === "classic-front-page" ||
                              props.visualStyle === "financial-journal" ||
                              props.visualStyle === "modern-breaking-news"
                                ? `1px solid ${alpha(props.frameColor, 0.72)}`
                                : `1px solid ${alpha("#FFFFFF", 0.05)}`,
                          }}
                        />
                        <div
                          style={{
                            fontFamily: bodyFont,
                            fontSize: `${Math.round((isPortrait ? 16 : 18) * scale)}px`,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color:
                              props.visualStyle === "classic-front-page" ||
                              props.visualStyle === "financial-journal" ||
                              props.visualStyle === "modern-breaking-news"
                                ? alpha(props.inkColor, 0.4)
                                : alpha("#FFFFFF", 0.54),
                          }}
                        >
                          {props.photoLabel}
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            left: `${Math.round(14 * scale)}px`,
                            right: `${Math.round(14 * scale)}px`,
                            bottom: `${Math.round(10 * scale)}px`,
                            height: `${Math.round(18 * scale)}px`,
                            borderTop: `1px solid ${alpha("#FFFFFF", 0.08)}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            color:
                              props.visualStyle === "classic-front-page" ||
                              props.visualStyle === "financial-journal" ||
                              props.visualStyle === "modern-breaking-news"
                                ? alpha(props.inkColor, 0.42)
                                : alpha("#FFFFFF", 0.36),
                            fontFamily: sansFont,
                            fontSize: `${Math.round((isPortrait ? 9 : 10) * scale)}px`,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                          }}
                        >
                          <span>Archive</span>
                          <span>No. 01</span>
                        </div>
                      </div>
                    ) : null}

                    <div
                      style={{
                        fontFamily: bodyFont,
                        fontSize: `${bodySize}px`,
                        lineHeight: bodyLineHeight,
                        color: alpha(props.inkColor, variant.bodyOpacity),
                        textAlign: "justify",
                        hyphens: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: `${Math.round(8 * scale)}px`,
                      }}
                    >
                      {paragraphs.map((paragraph, paragraphIndex) => (
                        <p
                          key={`${index}-${paragraphIndex}`}
                          style={{
                            margin: 0,
                            textIndent:
                              paragraphIndex > 0
                                ? `${Math.round((isPortrait ? 10 : 14) * scale)}px`
                                : "0px",
                          }}
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {isLead && props.photoCaption ? (
                      <div
                        style={{
                          fontFamily: sansFont,
                          fontSize: `${Math.round((isPortrait ? 11 : 12) * scale)}px`,
                          lineHeight: 1.3,
                          color: alpha(props.inkColor, 0.62),
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          borderTop: `1px solid ${dividerColor}`,
                          paddingTop: `${Math.round(8 * scale)}px`,
                        }}
                      >
                        {props.photoCaption}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: `${Math.round(14 * scale)}px`,
                height: "1px",
                background: dividerColor,
              }}
            />

            <div
              style={{
                marginTop: `${Math.round(10 * scale)}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: `${Math.round(14 * scale)}px`,
                flexWrap: "wrap",
                color: alpha(props.inkColor, 0.62),
                fontFamily: sansFont,
                fontSize: `${Math.round((isPortrait ? 11 : 12) * scale)}px`,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <div>{props.footerLine ?? "More updates expected in the morning edition"}</div>
              <div
                style={{
                  minWidth: `${Math.round(120 * scale)}px`,
                  height: `${Math.max(2, Math.round(3 * scale))}px`,
                  background: variant.accentRule,
                  borderRadius: `${Math.round(999 * scale)}px`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
