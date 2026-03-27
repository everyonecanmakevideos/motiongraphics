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

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

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

type PhotoTone = "light" | "dark" | "sepia" | "accent";

type ColumnRenderOptions = {
  total?: number;
  borderLeft?: boolean;
  borderTop?: boolean;
  paddingLeft?: number;
  paddingTop?: number;
  showPhoto?: boolean;
  photoTone?: PhotoTone;
  photoHeight?: number;
  titleFont?: string;
  titleSize?: number;
  titleWeight?: number;
  titleColor?: string;
  titleLetterSpacing?: string;
  titleTransform?: "uppercase" | "none";
  bodySize?: number;
  bodyOpacity?: number;
  compact?: boolean;
  caption?: string;
  indexOverride?: number;
  footerLeft?: string;
  footerRight?: string;
};

type NewspaperTemplateVariant =
  | "front-page"
  | "modern-grid"
  | "magazine-cover"
  | "minimal-ledger";

type NewspaperRenderProps = NewspaperFrontPageProps & {
  templateVariant?: NewspaperTemplateVariant;
};

type TemplateChrome = {
  paperTone: string;
  frameColor: string;
  inkColor: string;
  accentColor: string;
  paperTilt: number;
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

function getTemplateChrome(
  templateVariant: NewspaperTemplateVariant,
  props: NewspaperFrontPageProps,
): TemplateChrome {
  if (templateVariant === "modern-grid") {
    return {
      paperTone: "#EEF5FF",
      frameColor: "#BFD3EA",
      inkColor: "#10233B",
      accentColor: "#3B78B7",
      paperTilt: 0,
    };
  }

  if (templateVariant === "magazine-cover") {
    return {
      paperTone: "#F6EBDD",
      frameColor: "#CFB8A1",
      inkColor: "#2E241C",
      accentColor: "#8C5B3B",
      paperTilt: Math.abs(props.paperTilt) > 0 ? props.paperTilt * 0.4 : 0.8,
    };
  }

  if (templateVariant === "minimal-ledger") {
    return {
      paperTone: "#F3F5F2",
      frameColor: "#C7D2C4",
      inkColor: "#1D2B22",
      accentColor: "#2E6B57",
      paperTilt: 0,
    };
  }

  return {
    paperTone: props.paperTone,
    frameColor: props.frameColor,
    inkColor: props.inkColor,
    accentColor: props.accentColor,
    paperTilt: props.paperTilt,
  };
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

export const NewspaperFrontPage: React.FC<NewspaperRenderProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, scale, isPortrait, isSquare } = useResponsiveConfig();
  const templateVariant = props.templateVariant ?? "front-page";
  const chrome = getTemplateChrome(templateVariant, props);
  const paperTone = chrome.paperTone;
  const frameColor = chrome.frameColor;
  const inkColor = chrome.inkColor;
  const accentColor = chrome.accentColor;
  const paperTilt = chrome.paperTilt;
  const themedProps: NewspaperFrontPageProps = {
    ...props,
    paperTone,
    frameColor,
    inkColor,
    accentColor,
    paperTilt,
  };

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
  const fx = resolveEffects(resolved.effects, accentColor);
  const variant = getVariant(themedProps);

  const totalFrames = secToFrame(props.duration);
  const introWindow = adaptiveEntranceWindow(
    props.duration,
    totalFrames,
    motion.durationMultiplier,
    {
      startPct: 0.06,
      minSec: 1.6,
      maxSec: 3.2,
      maxEndPct: 0.52,
    },
  );
  const exitStart = Math.round(totalFrames * 0.88);
  const exitOpacity = interpolate(
    frame,
    [exitStart, totalFrames],
    [1, 0],
    CLAMP,
  );
  const paperState = getEntrance(
    frame,
    props.entranceAnimation,
    0,
    introWindow.endFrame,
  );
  const cameraRange = { startFrame: 0, endFrame: totalFrames };
  const drift: DriftState =
    props.entranceAnimation === "camera-drift"
      ? {
          ...cameraDrift(frame, cameraRange, 16, 10, 1, 1.035),
          rotate: interpolate(
            frame,
            [0, totalFrames],
            [paperTilt * 0.18, -paperTilt * 0.08],
            CLAMP,
          ),
        }
      : { x: 0, y: 0, scale: 1, rotate: 0 };

  const paperWidth = Math.round(
    width * (isPortrait ? 0.84 : isSquare ? 0.6 : variant.paperInset),
  );
  const paperHeight = Math.round(height * (isPortrait ? 0.84 : 0.94));
  const paperPadding = Math.round((isPortrait ? 26 : 32) * scale);
  const dividerColor = alpha(props.inkColor, 0.34);
  const bodyFont = typo.fontFamily ?? '"Times New Roman", Georgia, serif';
  const mastheadFont =
    props.visualStyle === "modern-breaking-news" ||
    props.visualStyle === "financial-journal"
      ? "Inter, Arial, sans-serif"
      : '"Times New Roman", Georgia, serif';
  const sansFont =
    props.visualStyle === "classic-front-page" ||
    props.visualStyle === "financial-journal" ||
    props.visualStyle === "modern-breaking-news"
      ? "Inter, Arial, sans-serif"
      : (typo.fontFamily ?? 'Georgia, "Times New Roman", serif');
  const headlineFont =
    props.visualStyle === "modern-breaking-news" ||
    props.visualStyle === "financial-journal"
      ? "Inter, Arial, sans-serif"
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
  const columns: ColumnData[] =
    props.columns.length > 0 ? props.columns : loremFallback;
  const headlineMaxWidth = Math.round(paperWidth * (isPortrait ? 0.94 : 0.82));
  const leadColumn = columns[0] ?? loremFallback[0];
  const middleColumn = columns[Math.min(1, columns.length - 1)] ?? leadColumn;
  const trailingColumns = columns.slice(1);
  const dividerThickness = `${Math.max(1, Math.round(scale))}px`;

  const getColumnState = (index: number, total: number = columns.length) => {
    const window = staggerDelay(index, total, introWindow.endFrame);
    return getEntrance(
      frame,
      props.entranceAnimation,
      introWindow.startFrame + window.startFrame,
      introWindow.startFrame + window.endFrame,
    );
  };

  const getPhotoTone = (tone: PhotoTone) => {
    if (tone === "sepia") {
      return {
        background: `linear-gradient(180deg, ${alpha("#3A2C1F", 0.96)} 0%, ${alpha("#17110C", 0.94)} 100%)`,
        overlay: `radial-gradient(circle at 24% 20%, ${alpha("#FFF4D6", 0.18)} 0%, transparent 28%),
                  linear-gradient(135deg, ${alpha("#000000", 0.16)} 0%, transparent 56%)`,
        innerBorder: `1px solid ${alpha("#D5BC88", 0.26)}`,
        labelColor: alpha("#FFF4D6", 0.56),
        bandColor: alpha("#F2E5C6", 0.46),
        bandBorder: `1px solid ${alpha("#F2E5C6", 0.12)}`,
      };
    }

    if (tone === "dark") {
      return {
        background: `linear-gradient(180deg, ${alpha("#121826", 0.98)} 0%, ${alpha("#05070C", 0.94)} 100%)`,
        overlay: `radial-gradient(circle at 24% 22%, ${alpha("#FFFFFF", 0.12)} 0%, transparent 28%),
                  linear-gradient(135deg, ${alpha(accentColor, 0.16)} 0%, transparent 54%)`,
        innerBorder: `1px solid ${alpha("#FFFFFF", 0.08)}`,
        labelColor: alpha("#FFFFFF", 0.68),
        bandColor: alpha("#E2E8F0", 0.52),
        bandBorder: `1px solid ${alpha("#FFFFFF", 0.1)}`,
      };
    }

    if (tone === "accent") {
      return {
        background: `linear-gradient(180deg, ${alpha(accentColor, 0.98)} 0%, ${alpha("#150A08", 0.92)} 100%)`,
        overlay: `radial-gradient(circle at 22% 20%, ${alpha("#FFFFFF", 0.18)} 0%, transparent 26%),
                  linear-gradient(135deg, ${alpha("#000000", 0.22)} 0%, transparent 52%)`,
        innerBorder: `1px solid ${alpha("#FFFFFF", 0.14)}`,
        labelColor: alpha("#FFF7ED", 0.84),
        bandColor: alpha("#FFF7ED", 0.76),
        bandBorder: `1px solid ${alpha("#FFF7ED", 0.16)}`,
      };
    }

    return {
      background: `linear-gradient(180deg, ${alpha("#EEF3F8", 0.98)} 0%, ${alpha("#D9E0EA", 0.94)} 100%)`,
      overlay: `radial-gradient(circle at 24% 22%, ${alpha("#FFFFFF", 0.58)} 0%, transparent 32%),
                linear-gradient(135deg, ${alpha(accentColor, 0.08)} 0%, transparent 54%)`,
      innerBorder: `1px solid ${alpha(frameColor, 0.72)}`,
      labelColor: alpha(inkColor, 0.42),
      bandColor: alpha(inkColor, 0.44),
      bandBorder: `1px solid ${alpha(frameColor, 0.3)}`,
    };
  };

  const renderPhotoCard = ({
    heightPx,
    tone,
    badgeText,
    footerLeft,
    footerRight,
    compact = false,
  }: {
    heightPx: number;
    tone: PhotoTone;
    badgeText?: string;
    footerLeft?: string;
    footerRight?: string;
    compact?: boolean;
  }) => {
    const photoTheme = getPhotoTone(tone);
    return (
      <div
        style={{
          position: "relative",
          height: `${heightPx}px`,
          borderRadius: `${Math.round((compact ? 5 : 7) * scale)}px`,
          overflow: "hidden",
          border: `1px solid ${variant.photoBorder}`,
          background: photoTheme.background,
          boxShadow:
            tone === "light"
              ? `inset 0 0 0 1px ${alpha("#FFFFFF", 0.22)}`
              : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: photoTheme.overlay,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: `${Math.round((compact ? 8 : 10) * scale)}px`,
            border: photoTheme.innerBorder,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${Math.round((compact ? 10 : 14) * scale)}px`,
            top: `${Math.round((compact ? 10 : 14) * scale)}px`,
            padding: `${Math.round(4 * scale)}px ${Math.round(8 * scale)}px`,
            borderRadius: `${Math.round(999 * scale)}px`,
            background: alpha("#000000", tone === "light" ? 0.08 : 0.22),
            color: photoTheme.labelColor,
            fontFamily: sansFont,
            fontSize: `${Math.round((compact ? 8 : 9) * scale)}px`,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {badgeText ?? props.photoLabel}
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: bodyFont,
            fontSize: `${Math.round((compact ? 16 : 20) * scale)}px`,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: photoTheme.labelColor,
          }}
        >
          {props.photoLabel}
        </div>
        <div
          style={{
            position: "absolute",
            left: `${Math.round((compact ? 10 : 14) * scale)}px`,
            right: `${Math.round((compact ? 10 : 14) * scale)}px`,
            bottom: `${Math.round((compact ? 8 : 10) * scale)}px`,
            height: `${Math.round((compact ? 16 : 20) * scale)}px`,
            borderTop: photoTheme.bandBorder,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: photoTheme.bandColor,
            fontFamily: sansFont,
            fontSize: `${Math.round((compact ? 8 : 10) * scale)}px`,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          <span>{footerLeft ?? "Front Page"}</span>
          <span>{footerRight ?? "No. 01"}</span>
        </div>
      </div>
    );
  };

  const renderColumn = (
    column: ColumnData,
    index: number,
    options: ColumnRenderOptions = {},
  ) => {
    const paragraphs = paragraphize(column.text);
    const state = getColumnState(
      options.indexOverride ?? index,
      options.total ?? columns.length,
    );

    return (
      <div
        key={`${index}-${column.title ?? "column"}`}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: `${Math.round((options.compact ? 8 : 10) * scale)}px`,
          paddingLeft: options.borderLeft
            ? `${options.paddingLeft ?? Math.round(14 * scale)}px`
            : "0px",
          paddingTop: options.borderTop
            ? `${options.paddingTop ?? Math.round(12 * scale)}px`
            : "0px",
          borderLeft: options.borderLeft
            ? `${dividerThickness} solid ${dividerColor}`
            : "none",
          borderTop: options.borderTop
            ? `${dividerThickness} solid ${dividerColor}`
            : "none",
          opacity: state.opacity,
          transform: `translateY(${state.y}px) scale(${state.scale})`,
        }}
      >
        {column.title ? (
          <div
            style={{
              fontFamily: options.titleFont ?? bodyFont,
              fontWeight: options.titleWeight ?? 700,
              fontSize: `${options.titleSize ?? Math.round((isPortrait ? 16 : 18) * scale)}px`,
              lineHeight: 1.15,
              textTransform: options.titleTransform ?? "uppercase",
              color: options.titleColor ?? alpha(inkColor, 0.92),
              letterSpacing: options.titleLetterSpacing,
            }}
          >
            {column.title}
          </div>
        ) : null}

        {options.showPhoto
          ? renderPhotoCard({
              heightPx: options.photoHeight ?? photoHeight,
              tone: options.photoTone ?? "light",
              badgeText: props.photoLabel,
              footerLeft: options.footerLeft,
              footerRight: options.footerRight,
              compact: options.compact,
            })
          : null}

        <div
          style={{
            fontFamily: bodyFont,
            fontSize: `${options.bodySize ?? bodySize}px`,
            lineHeight: bodyLineHeight,
            color: alpha(inkColor, options.bodyOpacity ?? variant.bodyOpacity),
            textAlign: "justify",
            hyphens: "auto",
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round((options.compact ? 6 : 8) * scale)}px`,
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

        {options.caption ? (
          <div
            style={{
              fontFamily: sansFont,
              fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
              lineHeight: 1.3,
              color: alpha(inkColor, 0.62),
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              borderTop: `${dividerThickness} solid ${dividerColor}`,
              paddingTop: `${Math.round(8 * scale)}px`,
            }}
          >
            {options.caption}
          </div>
        ) : null}
      </div>
    );
  };

  const renderFooter = (text: string, mode: "line" | "pill" = "line") => (
    <div
      style={{
        marginTop: `${Math.round(12 * scale)}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: `${Math.round(14 * scale)}px`,
        flexWrap: "wrap",
        color: alpha(inkColor, 0.62),
        fontFamily: sansFont,
        fontSize: `${Math.round((isPortrait ? 11 : 12) * scale)}px`,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      <div>{text}</div>
      <div
        style={{
          minWidth: `${Math.round(mode === "pill" ? 148 : 120 * scale)}px`,
          height: `${Math.max(2, Math.round((mode === "pill" ? 6 : 3) * scale))}px`,
          background: variant.accentRule,
          borderRadius: `${Math.round(999 * scale)}px`,
        }}
      />
    </div>
  );

  const renderTemplateMark = (
    markVariant: NewspaperTemplateVariant,
    options: {
      size?: number;
      tone?: "accent" | "ink" | "light";
    } = {},
  ) => {
    const size = options.size ?? Math.round(22 * scale);
    const toneColor =
      options.tone === "light"
        ? "#FFF7ED"
        : options.tone === "accent"
          ? accentColor
          : inkColor;

    if (markVariant === "modern-grid") {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 6H20M4 18H20M7 6V18M12 6V18M17 6V18"
            fill="none"
            stroke={toneColor}
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <circle cx="7" cy="12" r="1.6" fill={toneColor} />
          <circle cx="12" cy="12" r="1.6" fill={toneColor} />
          <circle cx="17" cy="12" r="1.6" fill={toneColor} />
        </svg>
      );
    }

    if (markVariant === "magazine-cover") {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke={toneColor}
            strokeWidth="1.5"
          />
          <path
            d="M12 4.8L13.9 9.1L18.6 9.5L15 12.6L16.1 17.2L12 14.6L7.9 17.2L9 12.6L5.4 9.5L10.1 9.1Z"
            fill={toneColor}
          />
        </svg>
      );
    }

    if (markVariant === "minimal-ledger") {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 18H19M6.5 16V9.5M11.5 16V6.5M16.5 16V11.5"
            fill="none"
            stroke={toneColor}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="6.5" cy="9.5" r="1.2" fill={toneColor} />
          <circle cx="11.5" cy="6.5" r="1.2" fill={toneColor} />
          <circle cx="16.5" cy="11.5" r="1.2" fill={toneColor} />
        </svg>
      );
    }

    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 4L14 9L20 11L14 13L12 20L10 13L4 11L10 9Z"
          fill="none"
          stroke={toneColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="1.6" fill={toneColor} />
      </svg>
    );
  };

  const renderClassicLayout = () => (
    <>
      <div
        style={{
          alignSelf: "center",
          display: "flex",
          alignItems: "center",
          gap: `${Math.round(8 * scale)}px`,
          color: alpha(inkColor, 0.7),
        }}
      >
        {renderTemplateMark("front-page", {
          size: Math.round(18 * scale),
          tone: "ink",
        })}
        <div
          style={{
            fontFamily: sansFont,
            fontSize: `${Math.round((isPortrait ? 9 : 10) * scale)}px`,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Established Edition
        </div>
        {renderTemplateMark("front-page", {
          size: Math.round(18 * scale),
          tone: "ink",
        })}
      </div>

      <div
        style={{
          textAlign: "center",
          fontFamily: mastheadFont,
          fontSize: `${Math.round((isPortrait ? 40 : 54) * scale * variant.mastheadScale)}px`,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          color: inkColor,
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
          background: inkColor,
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
          color: alpha(inkColor, 0.86),
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
          height: dividerThickness,
          background: dividerColor,
        }}
      />

      {props.kicker ? (
        <div
          style={{
            marginTop: `${Math.round(innerTopGap * 0.8)}px`,
            alignSelf: "center",
            padding: `0 ${Math.round(12 * scale)}px`,
            color: alpha(inkColor, 0.64),
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
          alignSelf: "center",
          maxWidth: `${headlineMaxWidth}px`,
          fontFamily: mastheadFont,
          fontSize: `${headlineSize}px`,
          fontWeight: variant.headlineWeight,
          letterSpacing: "-0.05em",
          lineHeight: 0.92,
          color: inkColor,
          textTransform: "uppercase",
          textAlign: "center",
          whiteSpace: "pre-wrap",
        }}
      >
        {props.headline}
      </div>

      {props.subheadline ? (
        <div
          style={{
            marginTop: `${Math.round(10 * scale)}px`,
            alignSelf: "center",
            maxWidth: `${Math.round(paperWidth * 0.76)}px`,
            fontFamily: bodyFont,
            fontSize: `${Math.round((isPortrait ? 17 : 20) * scale)}px`,
            lineHeight: 1.3,
            color: alpha(inkColor, 0.84),
            textAlign: "center",
          }}
        >
          {props.subheadline}
        </div>
      ) : null}

      <div
        style={{
          marginTop: `${Math.round(12 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait ? "1fr" : "repeat(3, minmax(0, 1fr))",
          gap: `${Math.round(12 * scale)}px`,
        }}
      >
        {["Morning Edition", "City & Nation", "Markets & Culture"].map(
          (label) => (
            <div
              key={label}
              style={{
                paddingTop: `${Math.round(8 * scale)}px`,
                borderTop: `${dividerThickness} solid ${dividerColor}`,
                display: "flex",
                alignItems: "center",
                gap: `${Math.round(8 * scale)}px`,
                color: alpha(inkColor, 0.74),
                fontFamily: sansFont,
                fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {renderTemplateMark("front-page", {
                size: Math.round(14 * scale),
                tone: "accent",
              })}
              <span>{label}</span>
            </div>
          ),
        )}
      </div>

      <div
        style={{
          marginTop: `${Math.round(22 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait
            ? "1fr"
            : columns.length >= 3
              ? "1fr 1.08fr 1fr"
              : "1fr 1fr",
          gap: `${columnGap}px`,
          flex: 1,
        }}
      >
        {columns.map((column, index) =>
          renderColumn(column, index, {
            borderLeft: index > 0 && !isPortrait,
            showPhoto:
              index === Math.min(1, columns.length - 1) &&
              !isPortrait &&
              props.showPhotoFrame,
            photoTone: "light",
            photoHeight,
            caption:
              index === Math.min(1, columns.length - 1)
                ? props.photoCaption
                : undefined,
            footerLeft: "Archive",
            footerRight: "No. 01",
          }),
        )}
      </div>

      <div
        style={{
          marginTop: `${Math.round(14 * scale)}px`,
          height: dividerThickness,
          background: dividerColor,
        }}
      />

      {renderFooter(
        props.footerLine ?? "More updates expected in the morning edition",
      )}
    </>
  );

  const renderBreakingLayout = () => (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: `${Math.round(12 * scale)}px`,
          padding: `${Math.round(10 * scale)}px ${Math.round(14 * scale)}px`,
          borderRadius: `${Math.round(999 * scale)}px`,
          background: `linear-gradient(90deg, ${props.accentColor} 0%, ${alpha(props.accentColor, 0.72)} 100%)`,
          color: "#FFF7ED",
          fontFamily: sansFont,
          fontSize: `${Math.round((isPortrait ? 11 : 12) * scale)}px`,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        <span>{props.kicker ?? "Breaking News"}</span>
        <span>{props.dateLine}</span>
      </div>

      <div
        style={{
          marginTop: `${Math.round(16 * scale)}px`,
          display: "flex",
          alignItems: "end",
          justifyContent: "space-between",
          gap: `${Math.round(16 * scale)}px`,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontFamily: headlineFont,
            fontSize: `${Math.round((isPortrait ? 30 : 38) * scale)}px`,
            fontWeight: 700,
            letterSpacing: "-0.045em",
            textTransform: "uppercase",
            color: inkColor,
            lineHeight: 1,
          }}
        >
          {props.masthead}
        </div>
        <div
          style={{
            color: alpha(inkColor, 0.72),
            fontFamily: sansFont,
            fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {props.editionLine}
        </div>
      </div>

      <div
        style={{
          marginTop: `${Math.round(10 * scale)}px`,
          height: `${Math.max(3, Math.round(5 * scale))}px`,
          background: variant.accentRule,
          borderRadius: `${Math.round(999 * scale)}px`,
        }}
      />

      <div
        style={{
          marginTop: `${Math.round(16 * scale)}px`,
          maxWidth: `${Math.round(paperWidth * 0.92)}px`,
          fontFamily: headlineFont,
          fontSize: `${Math.round(headlineSize * 1.1)}px`,
          fontWeight: 900,
          letterSpacing: "-0.055em",
          lineHeight: 0.86,
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
            marginTop: `${Math.round(12 * scale)}px`,
            maxWidth: `${Math.round(paperWidth * 0.72)}px`,
            fontFamily: sansFont,
            fontSize: `${Math.round((isPortrait ? 16 : 19) * scale)}px`,
            lineHeight: 1.28,
            color: alpha(props.inkColor, 0.8),
          }}
        >
          {props.subheadline}
        </div>
      ) : null}

      {props.showPhotoFrame ? (
        <div style={{ marginTop: `${Math.round(18 * scale)}px` }}>
          {renderPhotoCard({
            heightPx: Math.round(photoHeight * (isPortrait ? 1.2 : 1.48)),
            tone: "accent",
            badgeText: props.photoLabel,
            footerLeft: "Live Wire",
            footerRight: props.priceLine,
          })}
        </div>
      ) : null}

      <div
        style={{
          marginTop: `${Math.round(18 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait ? "1fr" : "1.2fr 0.8fr",
          gap: `${Math.round(18 * scale)}px`,
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(14 * scale)}px`,
          }}
        >
          {renderColumn(leadColumn, 0, {
            titleFont: sansFont,
            titleSize: Math.round((isPortrait ? 17 : 18) * scale),
            bodySize: Math.round((isPortrait ? 15 : 16) * scale),
            titleLetterSpacing: "0.03em",
          })}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(14 * scale)}px`,
          }}
        >
          {(trailingColumns.length > 0 ? trailingColumns : [middleColumn]).map(
            (column, index) =>
              renderColumn(column, index + 1, {
                borderTop: index > 0 || !isPortrait,
                titleFont: sansFont,
                titleSize: Math.round((isPortrait ? 15 : 16) * scale),
                bodySize: Math.round((isPortrait ? 14 : 15) * scale),
                bodyOpacity: 0.86,
                compact: true,
              }),
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: `${Math.round(14 * scale)}px`,
          height: dividerThickness,
          background: dividerColor,
        }}
      />

      {renderFooter(
        props.footerLine ??
          "Developing story with updates expected throughout the day",
        "pill",
      )}
    </>
  );

  const renderHistoricLayout = () => {
    const historicGridColumns = isPortrait
      ? "1fr"
      : `repeat(${Math.min(4, Math.max(3, columns.length + 1))}, minmax(0, 1fr))`;

    return (
      <>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: `${Math.round(10 * scale)}px`,
            alignItems: "center",
            color: alpha(props.inkColor, 0.72),
            fontFamily: sansFont,
            fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
            letterSpacing: "0.08em",
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
            textAlign: "center",
            fontFamily: mastheadFont,
            fontSize: `${Math.round((isPortrait ? 42 : 58) * scale * variant.mastheadScale)}px`,
            fontWeight: 700,
            letterSpacing: "-0.045em",
            color: props.inkColor,
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          {props.masthead}
        </div>

        <div
          style={{
            marginTop: `${Math.round(10 * scale)}px`,
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: `${Math.round(12 * scale)}px`,
            alignItems: "center",
          }}
        >
          <div style={{ height: dividerThickness, background: dividerColor }} />
          <div
            style={{
              padding: `0 ${Math.round(12 * scale)}px`,
              fontFamily: sansFont,
              fontSize: `${Math.round((isPortrait ? 11 : 12) * scale)}px`,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: alpha(props.inkColor, 0.62),
            }}
          >
            {props.kicker ?? "Archive Edition"}
          </div>
          <div style={{ height: dividerThickness, background: dividerColor }} />
        </div>

        <div
          style={{
            marginTop: `${Math.round(16 * scale)}px`,
            alignSelf: "center",
            maxWidth: `${Math.round(paperWidth * 0.76)}px`,
            textAlign: "center",
            fontFamily: mastheadFont,
            fontSize: `${Math.round(headlineSize * 0.95)}px`,
            fontWeight: 900,
            letterSpacing: "-0.045em",
            lineHeight: 0.9,
            color: props.inkColor,
            textTransform: "uppercase",
          }}
        >
          {props.headline}
        </div>

        {props.subheadline ? (
          <div
            style={{
              marginTop: `${Math.round(12 * scale)}px`,
              alignSelf: "center",
              maxWidth: `${Math.round(paperWidth * 0.74)}px`,
              fontFamily: bodyFont,
              fontStyle: "italic",
              fontSize: `${Math.round((isPortrait ? 16 : 18) * scale)}px`,
              lineHeight: 1.32,
              color: alpha(props.inkColor, 0.82),
              textAlign: "center",
            }}
          >
            {props.subheadline}
          </div>
        ) : null}

        <div
          style={{
            marginTop: `${Math.round(20 * scale)}px`,
            display: "grid",
            gridTemplateColumns: historicGridColumns,
            gap: `${Math.round(14 * scale)}px`,
            flex: 1,
            alignContent: "start",
          }}
        >
          {props.showPhotoFrame ? (
            <div
              style={{
                paddingRight: !isPortrait
                  ? `${Math.round(10 * scale)}px`
                  : "0px",
                borderRight: !isPortrait
                  ? `${dividerThickness} solid ${dividerColor}`
                  : "none",
              }}
            >
              {renderPhotoCard({
                heightPx: Math.round(photoHeight * 1.18),
                tone: "sepia",
                badgeText: props.photoLabel,
                footerLeft: "Archive Plate",
                footerRight: props.priceLine,
              })}
              {props.photoCaption ? (
                <div
                  style={{
                    marginTop: `${Math.round(8 * scale)}px`,
                    fontFamily: sansFont,
                    fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
                    lineHeight: 1.3,
                    color: alpha(props.inkColor, 0.62),
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {props.photoCaption}
                </div>
              ) : null}
            </div>
          ) : null}

          {columns.map((column, index) =>
            renderColumn(column, index, {
              borderLeft: !isPortrait && index > 0,
              titleFont: mastheadFont,
              titleTransform: "none",
              titleSize: Math.round((isPortrait ? 15 : 16) * scale),
              bodySize: Math.round((isPortrait ? 14 : 15) * scale),
              bodyOpacity: 0.9,
              compact: true,
              paddingLeft: Math.round(12 * scale),
            }),
          )}
        </div>

        <div
          style={{
            marginTop: `${Math.round(12 * scale)}px`,
            height: dividerThickness,
            background: dividerColor,
          }}
        />

        {renderFooter(
          props.footerLine ??
            "Reconstructed in archival print style for dramatic historical storytelling.",
        )}
      </>
    );
  };

  const renderFinancialLayout = () => (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: `${Math.round(14 * scale)}px`,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontFamily: headlineFont,
            fontSize: `${Math.round((isPortrait ? 32 : 40) * scale)}px`,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
            color: props.inkColor,
          }}
        >
          {props.masthead}
        </div>
        <div
          style={{
            display: "flex",
            gap: `${Math.round(8 * scale)}px`,
            flexWrap: "wrap",
            color: alpha(props.inkColor, 0.74),
            fontFamily: sansFont,
            fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {["Markets", "Policy", "Commodities", "Outlook"].map((label) => (
            <span
              key={label}
              style={{
                padding: `${Math.round(5 * scale)}px ${Math.round(9 * scale)}px`,
                borderRadius: `${Math.round(999 * scale)}px`,
                border: `${dividerThickness} solid ${alpha(props.inkColor, 0.16)}`,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: `${Math.round(10 * scale)}px`,
          height: dividerThickness,
          background: props.inkColor,
          opacity: 0.82,
        }}
      />

      <div
        style={{
          marginTop: `${Math.round(12 * scale)}px`,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: `${Math.round(10 * scale)}px`,
          alignItems: "center",
          color: alpha(props.inkColor, 0.78),
          fontFamily: sansFont,
          fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <div>{props.editionLine}</div>
        <div style={{ textAlign: "center" }}>{props.dateLine}</div>
        <div style={{ textAlign: "right" }}>{props.priceLine}</div>
      </div>

      <div
        style={{
          marginTop: `${Math.round(18 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait ? "1fr" : "1.18fr 0.82fr",
          gap: `${Math.round(20 * scale)}px`,
        }}
      >
        <div>
          <div
            style={{
              color: alpha(props.accentColor, 0.9),
              fontFamily: sansFont,
              fontSize: `${Math.round((isPortrait ? 12 : 13) * scale)}px`,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {props.kicker ?? "Market Bulletin"}
          </div>
          <div
            style={{
              marginTop: `${Math.round(10 * scale)}px`,
              fontFamily: headlineFont,
              fontSize: `${Math.round(headlineSize * 0.88)}px`,
              fontWeight: 820,
              letterSpacing: "-0.04em",
              lineHeight: 0.92,
              color: props.inkColor,
              textTransform: "uppercase",
            }}
          >
            {props.headline}
          </div>
          {props.subheadline ? (
            <div
              style={{
                marginTop: `${Math.round(12 * scale)}px`,
                maxWidth: `${Math.round(paperWidth * 0.56)}px`,
                fontFamily: bodyFont,
                fontSize: `${Math.round((isPortrait ? 16 : 18) * scale)}px`,
                lineHeight: 1.32,
                color: alpha(props.inkColor, 0.82),
              }}
            >
              {props.subheadline}
            </div>
          ) : null}
        </div>

        <div
          style={{
            border: `${dividerThickness} solid ${alpha(props.inkColor, 0.12)}`,
            borderRadius: `${Math.round(10 * scale)}px`,
            background: alpha("#FFFFFF", 0.34),
            padding: `${Math.round(14 * scale)}px`,
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(12 * scale)}px`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: `${Math.round(10 * scale)}px`,
              color: alpha(props.inkColor, 0.72),
              fontFamily: sansFont,
              fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            <span>Market Snapshot</span>
            <span>{props.photoLabel}</span>
          </div>
          {renderPhotoCard({
            heightPx: Math.round(photoHeight * 0.92),
            tone: "light",
            badgeText: props.photoLabel,
            footerLeft: "Session",
            footerRight: "Open",
            compact: true,
          })}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: `${Math.round(8 * scale)}px`,
            }}
          >
            {["Open", "Guidance", "Risk"].map((label, index) => (
              <div
                key={label}
                style={{
                  padding: `${Math.round(8 * scale)}px`,
                  borderRadius: `${Math.round(8 * scale)}px`,
                  background: alpha(
                    props.accentColor,
                    index === 1 ? 0.18 : 0.1,
                  ),
                }}
              >
                <div
                  style={{
                    color: alpha(props.inkColor, 0.56),
                    fontFamily: sansFont,
                    fontSize: `${Math.round((isPortrait ? 9 : 10) * scale)}px`,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    marginTop: `${Math.round(6 * scale)}px`,
                    color: props.inkColor,
                    fontFamily: sansFont,
                    fontSize: `${Math.round((isPortrait ? 12 : 13) * scale)}px`,
                    fontWeight: 700,
                  }}
                >
                  {index === 0 ? "Steady" : index === 1 ? "Raised" : "Watch"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: `${Math.round(20 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait
            ? "1fr"
            : `repeat(${Math.min(3, columns.length)}, minmax(0, 1fr))`,
          gap: `${Math.round(16 * scale)}px`,
          flex: 1,
        }}
      >
        {columns.map((column, index) =>
          renderColumn(column, index, {
            borderLeft: !isPortrait && index > 0,
            titleFont: sansFont,
            titleSize: Math.round((isPortrait ? 14 : 15) * scale),
            titleLetterSpacing: "0.06em",
            bodySize: Math.round((isPortrait ? 14 : 15) * scale),
            bodyOpacity: 0.9,
            compact: true,
          }),
        )}
      </div>

      <div
        style={{
          marginTop: `${Math.round(12 * scale)}px`,
          height: dividerThickness,
          background: dividerColor,
        }}
      />

      {renderFooter(
        props.footerLine ??
          "A denser journal-style front page for consequential market and business coverage.",
      )}
    </>
  );

  const renderTabloidLayout = () => (
    <>
      <div
        style={{
          padding: `${Math.round(10 * scale)}px ${Math.round(14 * scale)}px`,
          background: props.accentColor,
          color: "#FFF7ED",
          borderRadius: `${Math.round(8 * scale)}px`,
          fontFamily: sansFont,
          fontSize: `${Math.round((isPortrait ? 13 : 15) * scale)}px`,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          textAlign: "center",
          boxShadow: `0 16px 38px ${alpha(props.accentColor, 0.24)}`,
        }}
      >
        {props.kicker ?? "Exclusive"}
      </div>

      <div
        style={{
          marginTop: `${Math.round(14 * scale)}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: `${Math.round(12 * scale)}px`,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontFamily: sansFont,
            fontSize: `${Math.round((isPortrait ? 22 : 28) * scale)}px`,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
            color: props.inkColor,
          }}
        >
          {props.masthead}
        </div>
        <div
          style={{
            color: alpha(props.inkColor, 0.68),
            fontFamily: sansFont,
            fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {props.dateLine}
        </div>
      </div>

      <div
        style={{
          marginTop: `${Math.round(10 * scale)}px`,
          height: `${Math.max(4, Math.round(6 * scale))}px`,
          background: variant.accentRule,
          borderRadius: `${Math.round(999 * scale)}px`,
        }}
      />

      <div
        style={{
          marginTop: `${Math.round(16 * scale)}px`,
          fontFamily: headlineFont,
          fontSize: `${Math.round(headlineSize * 1.18)}px`,
          fontWeight: 900,
          letterSpacing: "-0.065em",
          lineHeight: 0.84,
          color: props.inkColor,
          textTransform: "uppercase",
        }}
      >
        {props.headline}
      </div>

      {props.subheadline ? (
        <div
          style={{
            marginTop: `${Math.round(10 * scale)}px`,
            maxWidth: `${Math.round(paperWidth * 0.82)}px`,
            fontFamily: sansFont,
            fontSize: `${Math.round((isPortrait ? 15 : 18) * scale)}px`,
            lineHeight: 1.26,
            color: alpha(props.inkColor, 0.78),
          }}
        >
          {props.subheadline}
        </div>
      ) : null}

      {props.showPhotoFrame ? (
        <div style={{ marginTop: `${Math.round(18 * scale)}px` }}>
          {renderPhotoCard({
            heightPx: Math.round(photoHeight * (isPortrait ? 1.3 : 1.7)),
            tone: "dark",
            badgeText: props.photoLabel,
            footerLeft: "Exclusive Shot",
            footerRight: props.priceLine,
          })}
        </div>
      ) : null}

      <div
        style={{
          marginTop: `${Math.round(18 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait ? "1fr" : "1fr 1fr",
          gap: `${Math.round(18 * scale)}px`,
          flex: 1,
        }}
      >
        {[leadColumn, middleColumn].map((column, index) =>
          renderColumn(column, index, {
            borderLeft: !isPortrait && index > 0,
            titleFont: sansFont,
            titleSize: Math.round((isPortrait ? 16 : 18) * scale),
            titleWeight: 800,
            titleLetterSpacing: "0.04em",
            bodySize: Math.round((isPortrait ? 15 : 16) * scale),
            bodyOpacity: 0.86,
            compact: false,
            paddingLeft: Math.round(16 * scale),
            caption: index === 0 ? props.photoCaption : undefined,
          }),
        )}
      </div>

      <div
        style={{
          marginTop: `${Math.round(12 * scale)}px`,
          height: dividerThickness,
          background: dividerColor,
        }}
      />

      {renderFooter(
        props.footerLine ??
          "A louder tabloid treatment built for instant visual impact.",
        "pill",
      )}
    </>
  );

  const renderSportsLayout = () => (
    <>
      <div
        style={{
          textAlign: "center",
          fontFamily: headlineFont,
          fontSize: `${Math.round((isPortrait ? 34 : 46) * scale)}px`,
          fontWeight: 800,
          letterSpacing: "-0.045em",
          textTransform: "uppercase",
          color: props.inkColor,
        }}
      >
        {props.masthead}
      </div>

      <div
        style={{
          marginTop: `${Math.round(12 * scale)}px`,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: `${Math.round(10 * scale)}px`,
          alignItems: "center",
          padding: `${Math.round(9 * scale)}px ${Math.round(12 * scale)}px`,
          borderRadius: `${Math.round(999 * scale)}px`,
          background: alpha(props.accentColor, 0.12),
          color: props.inkColor,
          fontFamily: sansFont,
          fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        <div>{props.kicker ?? "Match Report"}</div>
        <div style={{ fontWeight: 800 }}>Final</div>
        <div style={{ textAlign: "right" }}>{props.dateLine}</div>
      </div>

      <div
        style={{
          marginTop: `${Math.round(18 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait ? "1fr" : "0.88fr 1.12fr",
          gap: `${Math.round(20 * scale)}px`,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: `${Math.round(14 * scale)}px`,
          }}
        >
          <div
            style={{
              fontFamily: headlineFont,
              fontSize: `${Math.round(headlineSize * 0.96)}px`,
              fontWeight: 900,
              letterSpacing: "-0.055em",
              lineHeight: 0.88,
              color: props.inkColor,
              textTransform: "uppercase",
            }}
          >
            {props.headline}
          </div>

          {props.subheadline ? (
            <div
              style={{
                fontFamily: sansFont,
                fontSize: `${Math.round((isPortrait ? 16 : 18) * scale)}px`,
                lineHeight: 1.28,
                color: alpha(props.inkColor, 0.8),
              }}
            >
              {props.subheadline}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              gap: `${Math.round(8 * scale)}px`,
              flexWrap: "wrap",
            }}
          >
            {["Championship", "Last Second", "Full Time"].map((label) => (
              <span
                key={label}
                style={{
                  padding: `${Math.round(6 * scale)}px ${Math.round(10 * scale)}px`,
                  borderRadius: `${Math.round(999 * scale)}px`,
                  background: alpha(props.accentColor, 0.14),
                  color: props.inkColor,
                  fontFamily: sansFont,
                  fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div>
          {renderPhotoCard({
            heightPx: Math.round(photoHeight * (isPortrait ? 1.24 : 1.56)),
            tone: "dark",
            badgeText: props.photoLabel,
            footerLeft: "Game Photo",
            footerRight: props.priceLine,
          })}
          {props.photoCaption ? (
            <div
              style={{
                marginTop: `${Math.round(8 * scale)}px`,
                fontFamily: sansFont,
                fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
                lineHeight: 1.3,
                color: alpha(props.inkColor, 0.62),
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {props.photoCaption}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          marginTop: `${Math.round(18 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait
            ? "1fr"
            : `repeat(${Math.min(3, columns.length)}, minmax(0, 1fr))`,
          gap: `${Math.round(16 * scale)}px`,
          flex: 1,
        }}
      >
        {columns.map((column, index) =>
          renderColumn(column, index, {
            borderLeft: !isPortrait && index > 0,
            titleFont: sansFont,
            titleSize: Math.round((isPortrait ? 15 : 16) * scale),
            titleWeight: 800,
            titleLetterSpacing: "0.08em",
            bodySize: Math.round((isPortrait ? 14 : 15) * scale),
            compact: true,
            paddingLeft: Math.round(14 * scale),
          }),
        )}
      </div>

      <div
        style={{
          marginTop: `${Math.round(12 * scale)}px`,
          height: dividerThickness,
          background: dividerColor,
        }}
      />

      {renderFooter(
        props.footerLine ??
          "A sports-desk front page treatment designed for major matchday headlines.",
        "pill",
      )}
    </>
  );

  const renderModernGridLayout = () => (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: `${Math.round(14 * scale)}px`,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: `${Math.round(10 * scale)}px`,
          }}
        >
          {renderTemplateMark("modern-grid", {
            size: Math.round(22 * scale),
            tone: "accent",
          })}
          <div
            style={{
              fontFamily: headlineFont,
              fontSize: `${Math.round((isPortrait ? 32 : 40) * scale)}px`,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              color: inkColor,
            }}
          >
            {props.masthead}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: `${Math.round(8 * scale)}px`,
            flexWrap: "wrap",
            color: alpha(inkColor, 0.72),
            fontFamily: sansFont,
            fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <span>{props.editionLine}</span>
          <span>{props.dateLine}</span>
          <span>{props.priceLine}</span>
        </div>
      </div>

      <div
        style={{
          marginTop: `${Math.round(10 * scale)}px`,
          height: `${Math.max(3, Math.round(5 * scale))}px`,
          background: variant.accentRule,
          borderRadius: `${Math.round(999 * scale)}px`,
        }}
      />

      <div
        style={{
          marginTop: `${Math.round(12 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait ? "1fr" : "repeat(3, minmax(0, 1fr))",
          gap: `${Math.round(10 * scale)}px`,
        }}
      >
        {[props.kicker ?? "Metro Edition", "City Desk", "Transit Watch"].map(
          (label, index) => (
            <div
              key={label}
              style={{
                padding: `${Math.round(10 * scale)}px ${Math.round(12 * scale)}px`,
                borderRadius: `${Math.round(8 * scale)}px`,
                border: `${dividerThickness} solid ${alpha(inkColor, 0.1)}`,
                background: alpha(accentColor, index === 1 ? 0.12 : 0.08),
                color: inkColor,
                fontFamily: sansFont,
                fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </div>
          ),
        )}
      </div>

      <div
        style={{
          marginTop: `${Math.round(18 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait ? "1fr" : "1.18fr 0.82fr",
          gap: `${Math.round(18 * scale)}px`,
          alignItems: "start",
        }}
      >
        <div
          style={{
            padding: `${Math.round(16 * scale)}px`,
            borderRadius: `${Math.round(10 * scale)}px`,
            border: `${dividerThickness} solid ${alpha(inkColor, 0.1)}`,
            background: `linear-gradient(180deg, ${alpha(accentColor, 0.12)} 0%, ${alpha("#FFFFFF", 0.28)} 100%)`,
            display: "grid",
            gap: `${Math.round(12 * scale)}px`,
          }}
        >
          <div
            style={{
              color: alpha(accentColor, 0.92),
              fontFamily: sansFont,
              fontSize: `${Math.round((isPortrait ? 11 : 12) * scale)}px`,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {props.kicker ?? "Metro Edition"}
          </div>
          <div
            style={{
              fontFamily: headlineFont,
              fontSize: `${Math.round(headlineSize * 1.02)}px`,
              fontWeight: 900,
              letterSpacing: "-0.05em",
              lineHeight: 0.88,
              color: inkColor,
              textTransform: "uppercase",
            }}
          >
            {props.headline}
          </div>
          {props.subheadline ? (
            <div
              style={{
                fontFamily: sansFont,
                fontSize: `${Math.round((isPortrait ? 15 : 17) * scale)}px`,
                lineHeight: 1.28,
                color: alpha(inkColor, 0.8),
              }}
            >
              {props.subheadline}
            </div>
          ) : null}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isPortrait ? "1fr" : "1fr 1fr",
              gap: `${Math.round(10 * scale)}px`,
            }}
          >
            {["Network expansion", "Rush-hour briefing"].map((label, index) => (
              <div
                key={label}
                style={{
                  padding: `${Math.round(10 * scale)}px ${Math.round(12 * scale)}px`,
                  borderRadius: `${Math.round(8 * scale)}px`,
                  background: alpha("#FFFFFF", index === 0 ? 0.34 : 0.22),
                  border: `${dividerThickness} solid ${alpha(inkColor, 0.08)}`,
                }}
              >
                <div
                  style={{
                    color: alpha(inkColor, 0.5),
                    fontFamily: sansFont,
                    fontSize: `${Math.round((isPortrait ? 9 : 10) * scale)}px`,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    marginTop: `${Math.round(5 * scale)}px`,
                    color: inkColor,
                    fontFamily: bodyFont,
                    fontSize: `${Math.round((isPortrait ? 12 : 13) * scale)}px`,
                    lineHeight: 1.24,
                  }}
                >
                  {index === 0
                    ? (leadColumn.text.split(/[.!?]/)[0]?.trim() ??
                      leadColumn.text)
                    : "Service maps, station notes, and commuter guidance packaged in a compact metro desk module."}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(12 * scale)}px`,
          }}
        >
          {props.showPhotoFrame ? (
            <div
              style={{
                padding: `${Math.round(12 * scale)}px`,
                borderRadius: `${Math.round(10 * scale)}px`,
                border: `${dividerThickness} solid ${alpha(inkColor, 0.1)}`,
                background: alpha("#FFFFFF", 0.34),
              }}
            >
              {renderPhotoCard({
                heightPx: Math.round(photoHeight * 1.08),
                tone: "light",
                badgeText: props.photoLabel,
                footerLeft: "Metro",
                footerRight: "Edition",
              })}
              {props.photoCaption ? (
                <div
                  style={{
                    marginTop: `${Math.round(8 * scale)}px`,
                    fontFamily: sansFont,
                    fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
                    lineHeight: 1.3,
                    color: alpha(inkColor, 0.62),
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {props.photoCaption}
                </div>
              ) : null}
            </div>
          ) : null}
          <div
            style={{
              padding: `${Math.round(12 * scale)}px`,
              borderRadius: `${Math.round(10 * scale)}px`,
              border: `${dividerThickness} solid ${alpha(inkColor, 0.1)}`,
              background: alpha(accentColor, 0.08),
            }}
          >
            <div
              style={{
                color: alpha(inkColor, 0.52),
                fontFamily: sansFont,
                fontSize: `${Math.round((isPortrait ? 9 : 10) * scale)}px`,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              City Desk Brief
            </div>
            <div
              style={{
                marginTop: `${Math.round(8 * scale)}px`,
                display: "flex",
                flexDirection: "column",
                gap: `${Math.round(8 * scale)}px`,
              }}
            >
              {columns.slice(0, 3).map((column, index) => (
                <div
                  key={`${column.title ?? "brief"}-${index}`}
                  style={{
                    paddingTop:
                      index > 0 ? `${Math.round(8 * scale)}px` : "0px",
                    borderTop:
                      index > 0
                        ? `${dividerThickness} solid ${alpha(inkColor, 0.08)}`
                        : "none",
                  }}
                >
                  <div
                    style={{
                      color: inkColor,
                      fontFamily: sansFont,
                      fontSize: `${Math.round((isPortrait ? 11 : 12) * scale)}px`,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {column.title ?? `Story ${index + 1}`}
                  </div>
                  <div
                    style={{
                      marginTop: `${Math.round(3 * scale)}px`,
                      color: alpha(inkColor, 0.72),
                      fontFamily: bodyFont,
                      fontSize: `${Math.round((isPortrait ? 12 : 13) * scale)}px`,
                      lineHeight: 1.25,
                    }}
                  >
                    {column.text.split(/[.!?]/)[0]?.trim() ?? column.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              padding: `${Math.round(12 * scale)}px`,
              borderRadius: `${Math.round(10 * scale)}px`,
              border: `${dividerThickness} solid ${alpha(inkColor, 0.1)}`,
              background: alpha("#FFFFFF", 0.28),
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: `${Math.round(8 * scale)}px`,
              }}
            >
              {["06:30", "08:10", "12:45"].map((time, index) => (
                <div key={time}>
                  <div
                    style={{
                      color: alpha(inkColor, 0.44),
                      fontFamily: sansFont,
                      fontSize: `${Math.round((isPortrait ? 9 : 10) * scale)}px`,
                      letterSpacing: "0.08em",
                    }}
                  >
                    {time}
                  </div>
                  <div
                    style={{
                      marginTop: `${Math.round(4 * scale)}px`,
                      color: inkColor,
                      fontFamily: sansFont,
                      fontSize: `${Math.round((isPortrait ? 11 : 12) * scale)}px`,
                      lineHeight: 1.2,
                      textTransform: "uppercase",
                    }}
                  >
                    {index === 0
                      ? "Stations open"
                      : index === 1
                        ? "Live update"
                        : "Ridership note"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: `${Math.round(18 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait ? "1fr" : "repeat(4, minmax(0, 1fr))",
          gap: `${Math.round(12 * scale)}px`,
          flex: 1,
        }}
      >
        {columns.slice(0, 4).map((column, index) => (
          <div
            key={`${column.title ?? "metro-card"}-${index}`}
            style={{
              padding: `${Math.round(12 * scale)}px`,
              borderRadius: `${Math.round(10 * scale)}px`,
              border: `${dividerThickness} solid ${alpha(inkColor, 0.1)}`,
              background:
                index === 0 ? alpha(accentColor, 0.1) : alpha("#FFFFFF", 0.28),
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: `${Math.round((isPortrait ? 112 : 128) * scale)}px`,
            }}
          >
            <div>
              <div
                style={{
                  color: alpha(inkColor, 0.46),
                  fontFamily: sansFont,
                  fontSize: `${Math.round((isPortrait ? 9 : 10) * scale)}px`,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {index === 0
                  ? "Lead Story"
                  : index === 1
                    ? "Inside Report"
                    : index === 2
                      ? "Analysis"
                      : "City Notes"}
              </div>
              <div
                style={{
                  marginTop: `${Math.round(8 * scale)}px`,
                  color: inkColor,
                  fontFamily: sansFont,
                  fontSize: `${Math.round((isPortrait ? 13 : 14) * scale)}px`,
                  fontWeight: 800,
                  lineHeight: 1.18,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {column.title ?? `Story ${index + 1}`}
              </div>
              <div
                style={{
                  marginTop: `${Math.round(8 * scale)}px`,
                  color: alpha(inkColor, 0.74),
                  fontFamily: bodyFont,
                  fontSize: `${Math.round((isPortrait ? 12 : 13) * scale)}px`,
                  lineHeight: 1.28,
                }}
              >
                {column.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: `${Math.round(16 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait ? "1fr" : "repeat(3, minmax(0, 1fr))",
          gap: `${Math.round(12 * scale)}px`,
        }}
      >
        {[
          "Morning commute impact",
          "Mayor outlines next phase",
          "Neighbourhood stations highlighted",
        ].map((line, index) => (
          <div
            key={line}
            style={{
              paddingTop: `${Math.round(10 * scale)}px`,
              borderTop: `${dividerThickness} solid ${dividerColor}`,
              color: alpha(inkColor, 0.78),
              fontFamily: sansFont,
              fontSize: `${Math.round((isPortrait ? 11 : 12) * scale)}px`,
              lineHeight: 1.3,
              textTransform: index === 0 ? "uppercase" : "none",
              letterSpacing: index === 0 ? "0.05em" : undefined,
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {renderFooter(
        props.footerLine ??
          "A modular metro front page built around a clean news grid.",
      )}
    </>
  );

  const renderMagazineCoverLayout = () => (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: `${Math.round(12 * scale)}px`,
          color: alpha(inkColor, 0.72),
          fontFamily: sansFont,
          fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        <span>{props.editionLine}</span>
        <span>{props.dateLine}</span>
      </div>

      <div
        style={{
          marginTop: `${Math.round(12 * scale)}px`,
          textAlign: "center",
          fontFamily: mastheadFont,
          fontSize: `${Math.round((isPortrait ? 38 : 54) * scale)}px`,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          textTransform: "uppercase",
          color: props.inkColor,
        }}
      >
        {props.masthead}
      </div>

      <div
        style={{
          marginTop: `${Math.round(16 * scale)}px`,
          position: "relative",
          flex: 1,
          minHeight: `${Math.round(photoHeight * 2.34)}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "end",
          padding: `${Math.round(20 * scale)}px`,
          borderRadius: `${Math.round(10 * scale)}px`,
          overflow: "hidden",
          background: `linear-gradient(180deg, ${alpha("#F7F0E4", 0.2)} 0%, ${alpha("#000000", 0)} 28%), linear-gradient(180deg, ${alpha("#111827", 0.12)} 0%, ${alpha("#111827", 0.78)} 100%)`,
          border: `1px solid ${alpha(props.frameColor, 0.72)}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              `radial-gradient(circle at 52% 24%, ${alpha("#FFFFFF", 0.38)} 0%, transparent 30%), ` +
              `linear-gradient(135deg, ${alpha(props.accentColor, 0.12)} 0%, transparent 54%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: `${Math.round(14 * scale)}px`,
            border: `1px solid ${alpha("#FFFFFF", 0.12)}`,
          }}
        />
        <div
          style={{
            position: "relative",
            color: "#FFF7ED",
            display: "flex",
            alignItems: "center",
            gap: `${Math.round(8 * scale)}px`,
            fontFamily: sansFont,
            fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {renderTemplateMark("magazine-cover", {
            size: Math.round(18 * scale),
            tone: "light",
          })}
          {props.kicker ?? "Cover Story"}
        </div>
        <div
          style={{
            position: "absolute",
            left: `${Math.round(20 * scale)}px`,
            top: `${Math.round(22 * scale)}px`,
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(8 * scale)}px`,
            width: `${Math.round((isPortrait ? 118 : 150) * scale)}px`,
          }}
        >
          {["Exclusive", "Long Read", "Weekend Review"].map((label, index) => (
            <div
              key={label}
              style={{
                padding: `${Math.round(8 * scale)}px ${Math.round(10 * scale)}px`,
                background: alpha("#111827", index === 0 ? 0.48 : 0.3),
                border: `1px solid ${alpha("#FFF7ED", 0.14)}`,
                color: "#FFF7ED",
                fontFamily: sansFont,
                fontSize: `${Math.round((isPortrait ? 9 : 10) * scale)}px`,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "relative",
            marginTop: `${Math.round(10 * scale)}px`,
            maxWidth: `${Math.round(paperWidth * 0.76)}px`,
            fontFamily: mastheadFont,
            fontSize: `${Math.round(headlineSize * 1.06)}px`,
            fontWeight: 900,
            letterSpacing: "-0.045em",
            lineHeight: 0.86,
            color: "#FFF7ED",
            textTransform: "uppercase",
            textShadow: `0 ${Math.round(8 * scale)}px ${Math.round(18 * scale)}px ${alpha("#000000", 0.28)}`,
          }}
        >
          {props.headline}
        </div>
        {props.subheadline ? (
          <div
            style={{
              position: "relative",
              marginTop: `${Math.round(12 * scale)}px`,
              maxWidth: `${Math.round(paperWidth * 0.6)}px`,
              fontFamily: bodyFont,
              fontSize: `${Math.round((isPortrait ? 16 : 18) * scale)}px`,
              lineHeight: 1.3,
              color: alpha("#FFF7ED", 0.84),
              textShadow: `0 ${Math.round(6 * scale)}px ${Math.round(16 * scale)}px ${alpha("#000000", 0.28)}`,
            }}
          >
            {props.subheadline}
          </div>
        ) : null}

        <div
          style={{
            position: "absolute",
            right: `${Math.round(18 * scale)}px`,
            top: `${Math.round(18 * scale)}px`,
            width: `${Math.round((isPortrait ? 120 : 156) * scale)}px`,
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(8 * scale)}px`,
          }}
        >
          {["Interview", "Inside Story", "Culture"].map((label, index) => (
            <div
              key={label}
              style={{
                padding: `${Math.round(8 * scale)}px ${Math.round(10 * scale)}px`,
                borderRadius: `${Math.round(8 * scale)}px`,
                background: alpha("#FFF7ED", index === 0 ? 0.18 : 0.1),
                border: `1px solid ${alpha("#FFF7ED", 0.14)}`,
                color: "#FFF7ED",
                fontFamily: sansFont,
                fontSize: `${Math.round((isPortrait ? 9 : 10) * scale)}px`,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div
          style={{
            position: "relative",
            marginTop: `${Math.round(18 * scale)}px`,
            display: "grid",
            gridTemplateColumns: isPortrait ? "1fr" : "1.1fr 0.9fr",
            gap: `${Math.round(12 * scale)}px`,
          }}
        >
          <div
            style={{
              padding: `${Math.round(12 * scale)}px`,
              borderTop: `1px solid ${alpha("#FFF7ED", 0.22)}`,
              background: alpha("#0F172A", 0.24),
            }}
          >
            <div
              style={{
                color: alpha("#FFF7ED", 0.68),
                fontFamily: sansFont,
                fontSize: `${Math.round((isPortrait ? 9 : 10) * scale)}px`,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Cover lines
            </div>
            <div
              style={{
                marginTop: `${Math.round(8 * scale)}px`,
                display: "flex",
                flexDirection: "column",
                gap: `${Math.round(8 * scale)}px`,
              }}
            >
              {columns.slice(0, 2).map((column, index) => (
                <div key={`${column.title ?? "cover-line"}-${index}`}>
                  <div
                    style={{
                      color: "#FFF7ED",
                      fontFamily: sansFont,
                      fontSize: `${Math.round((isPortrait ? 11 : 12) * scale)}px`,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {column.title ?? `Feature ${index + 1}`}
                  </div>
                  <div
                    style={{
                      marginTop: `${Math.round(3 * scale)}px`,
                      color: alpha("#FFF7ED", 0.76),
                      fontFamily: bodyFont,
                      fontSize: `${Math.round((isPortrait ? 12 : 13) * scale)}px`,
                      lineHeight: 1.24,
                    }}
                  >
                    {column.text.split(/[.!?]/)[0]?.trim() ?? column.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              padding: `${Math.round(12 * scale)}px`,
              borderTop: `1px solid ${alpha("#FFF7ED", 0.22)}`,
              background: alpha("#0F172A", 0.18),
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                color: alpha("#FFF7ED", 0.68),
                fontFamily: sansFont,
                fontSize: `${Math.round((isPortrait ? 9 : 10) * scale)}px`,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              This issue
            </div>
            <div
              style={{
                marginTop: `${Math.round(8 * scale)}px`,
                color: "#FFF7ED",
                fontFamily: sansFont,
                fontSize: `${Math.round((isPortrait ? 18 : 20) * scale)}px`,
                fontWeight: 700,
                lineHeight: 1.05,
                textTransform: "uppercase",
              }}
            >
              Four major stories shaping the week ahead.
            </div>
            <div
              style={{
                marginTop: `${Math.round(10 * scale)}px`,
                color: alpha("#FFF7ED", 0.74),
                fontFamily: bodyFont,
                fontSize: `${Math.round((isPortrait ? 12 : 13) * scale)}px`,
                lineHeight: 1.3,
              }}
            >
              A curated cover package with interviews, profiles, and the most
              talked-about feature from the edition.
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: `${Math.round(16 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait ? "1fr" : "repeat(3, minmax(0, 1fr))",
          gap: `${Math.round(14 * scale)}px`,
        }}
      >
        {columns.slice(0, 3).map((column, index) =>
          renderColumn(column, index, {
            titleFont: sansFont,
            titleSize: Math.round((isPortrait ? 14 : 15) * scale),
            titleWeight: 800,
            titleLetterSpacing: "0.08em",
            bodySize: Math.round((isPortrait ? 13 : 14) * scale),
            bodyOpacity: 0.84,
            compact: true,
            borderTop: index > 0,
          }),
        )}
      </div>

      <div
        style={{
          marginTop: `${Math.round(14 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait ? "1fr" : "repeat(4, minmax(0, 1fr))",
          gap: `${Math.round(10 * scale)}px`,
        }}
      >
        {["Editor's note", "Profiles", "Arts", "Weekend"].map(
          (label, index) => (
            <div
              key={label}
              style={{
                padding: `${Math.round(10 * scale)}px ${Math.round(12 * scale)}px`,
                borderTop: `${dividerThickness} solid ${alpha("#FFF7ED", 0.18)}`,
                color: index === 0 ? inkColor : alpha(inkColor, 0.76),
                fontFamily: sansFont,
                fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </div>
          ),
        )}
      </div>

      {renderFooter(
        props.footerLine ??
          "A weekly-style cover layout with a dominant feature image and deck.",
        "pill",
      )}
    </>
  );

  const renderMinimalLedgerLayout = () => (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: `${Math.round(12 * scale)}px`,
          color: alpha(inkColor, 0.68),
          fontFamily: sansFont,
          fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        <span>{props.editionLine}</span>
        <span>{props.priceLine}</span>
      </div>

      <div
        style={{
          marginTop: `${Math.round(10 * scale)}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: `${Math.round(10 * scale)}px`,
        }}
      >
        {renderTemplateMark("minimal-ledger", {
          size: Math.round(20 * scale),
          tone: "accent",
        })}
        <div
          style={{
            fontFamily: headlineFont,
            fontSize: `${Math.round((isPortrait ? 28 : 36) * scale)}px`,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
            color: inkColor,
          }}
        >
          {props.masthead}
        </div>
      </div>

      <div
        style={{
          marginTop: `${Math.round(12 * scale)}px`,
          height: dividerThickness,
          background: dividerColor,
        }}
      />

      <div
        style={{
          marginTop: `${Math.round(18 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait ? "1fr" : "0.95fr 1.05fr",
          gap: `${Math.round(18 * scale)}px`,
        }}
      >
        <div
          style={{
            paddingRight: !isPortrait ? `${Math.round(10 * scale)}px` : "0px",
          }}
        >
          <div
            style={{
              color: alpha(accentColor, 0.9),
              fontFamily: sansFont,
              fontSize: `${Math.round((isPortrait ? 11 : 12) * scale)}px`,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {props.kicker ?? "Daily Briefing"}
          </div>
          <div
            style={{
              marginTop: `${Math.round(10 * scale)}px`,
              maxWidth: `${Math.round(paperWidth * 0.62)}px`,
              fontFamily: headlineFont,
              fontSize: `${Math.round(headlineSize * 0.82)}px`,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 0.94,
              color: inkColor,
              textTransform: "uppercase",
            }}
          >
            {props.headline}
          </div>
          {props.subheadline ? (
            <div
              style={{
                marginTop: `${Math.round(12 * scale)}px`,
                maxWidth: `${Math.round(paperWidth * 0.54)}px`,
                fontFamily: bodyFont,
                fontSize: `${Math.round((isPortrait ? 15 : 17) * scale)}px`,
                lineHeight: 1.3,
                color: alpha(inkColor, 0.8),
              }}
            >
              {props.subheadline}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isPortrait ? "1fr" : "1fr 1fr",
            gap: `${Math.round(10 * scale)}px`,
          }}
        >
          {[
            props.dateLine,
            props.photoLabel,
            props.footerLine ?? "Morning briefing",
            props.priceLine,
          ].map((value, index) => (
            <div
              key={`${value}-${index}`}
              style={{
                padding: `${Math.round(12 * scale)}px`,
                border: `${dividerThickness} solid ${alpha(inkColor, 0.12)}`,
                borderRadius: `${Math.round(8 * scale)}px`,
                background: alpha("#FFFFFF", 0.34),
              }}
            >
              <div
                style={{
                  color: alpha(inkColor, 0.48),
                  fontFamily: sansFont,
                  fontSize: `${Math.round((isPortrait ? 9 : 10) * scale)}px`,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {index === 0
                  ? "Edition"
                  : index === 1
                    ? "Photo Desk"
                    : index === 2
                      ? "Note"
                      : "Price"}
              </div>
              <div
                style={{
                  marginTop: `${Math.round(6 * scale)}px`,
                  color: inkColor,
                  fontFamily: sansFont,
                  fontSize: `${Math.round((isPortrait ? 12 : 13) * scale)}px`,
                  lineHeight: 1.3,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: `${Math.round(16 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait ? "1fr" : "repeat(4, minmax(0, 1fr))",
          gap: `${Math.round(12 * scale)}px`,
        }}
      >
        {[
          props.dateLine,
          "Markets at a glance",
          "Updated before the opening bell",
          "Briefing cadence",
        ].map((line, index) => (
          <div
            key={`${line}-${index}`}
            style={{
              padding: `${Math.round(10 * scale)}px ${Math.round(12 * scale)}px`,
              borderRadius: `${Math.round(8 * scale)}px`,
              border: `${dividerThickness} solid ${alpha(inkColor, 0.1)}`,
              background: alpha(accentColor, index === 1 ? 0.1 : 0.05),
              color: inkColor,
              fontFamily: sansFont,
              fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {index === 3 ? "Issued at sunrise and noon" : line}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: `${Math.round(20 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait ? "1fr" : "0.9fr 0.9fr 1.2fr",
          gap: `${Math.round(16 * scale)}px`,
          flex: 1,
        }}
      >
        {[leadColumn, middleColumn].map((column, index) =>
          renderColumn(column, index, {
            borderLeft: !isPortrait && index > 0,
            titleFont: sansFont,
            titleSize: Math.round((isPortrait ? 14 : 15) * scale),
            titleWeight: 800,
            titleLetterSpacing: "0.06em",
            bodySize: Math.round((isPortrait ? 14 : 15) * scale),
            bodyOpacity: 0.86,
            compact: true,
            paddingLeft: Math.round(16 * scale),
          }),
        )}

        <div
          style={{
            borderLeft: !isPortrait
              ? `${dividerThickness} solid ${dividerColor}`
              : "none",
            paddingLeft: !isPortrait ? `${Math.round(16 * scale)}px` : "0px",
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(10 * scale)}px`,
          }}
        >
          <div
            style={{
              color: alpha(inkColor, 0.5),
              fontFamily: sansFont,
              fontSize: `${Math.round((isPortrait ? 9 : 10) * scale)}px`,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Briefing Notes
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: `${Math.round(8 * scale)}px`,
            }}
          >
            {["Open", "Midday", "Close", "Watch"].map((label, index) => (
              <div
                key={label}
                style={{
                  padding: `${Math.round(8 * scale)}px`,
                  border: `${dividerThickness} solid ${alpha(inkColor, 0.08)}`,
                  background: alpha(accentColor, index === 3 ? 0.1 : 0.04),
                }}
              >
                <div
                  style={{
                    color: alpha(inkColor, 0.46),
                    fontFamily: sansFont,
                    fontSize: `${Math.round((isPortrait ? 9 : 10) * scale)}px`,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    marginTop: `${Math.round(4 * scale)}px`,
                    color: inkColor,
                    fontFamily: sansFont,
                    fontSize: `${Math.round((isPortrait ? 11 : 12) * scale)}px`,
                    lineHeight: 1.22,
                  }}
                >
                  {index === 0
                    ? "Rates steady"
                    : index === 1
                      ? "Volume builds"
                      : index === 2
                        ? "Guidance due"
                        : "Policy remarks"}
                </div>
              </div>
            ))}
          </div>
          {(trailingColumns.length > 1
            ? trailingColumns.slice(1)
            : columns.slice(0, 2)
          ).map((column, index) => (
            <div
              key={`${column.title ?? "briefing"}-${index}`}
              style={{
                paddingTop: `${Math.round(8 * scale)}px`,
                borderTop:
                  index > 0
                    ? `${dividerThickness} solid ${dividerColor}`
                    : "none",
              }}
            >
              <div
                style={{
                  color: props.inkColor,
                  fontFamily: sansFont,
                  fontSize: `${Math.round((isPortrait ? 11 : 12) * scale)}px`,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {column.title ?? `Update ${index + 1}`}
              </div>
              <div
                style={{
                  marginTop: `${Math.round(4 * scale)}px`,
                  color: alpha(props.inkColor, 0.74),
                  fontFamily: bodyFont,
                  fontSize: `${Math.round((isPortrait ? 12 : 13) * scale)}px`,
                  lineHeight: 1.28,
                }}
              >
                {column.text.split(/[.!?]/)[0]?.trim() ?? column.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {renderFooter(
        props.footerLine ??
          "A minimal ledger-style front page with quieter, cleaner hierarchy.",
      )}
    </>
  );

  const renderBody = () => {
    if (templateVariant === "modern-grid") return renderModernGridLayout();
    if (templateVariant === "magazine-cover")
      return renderMagazineCoverLayout();
    if (templateVariant === "minimal-ledger")
      return renderMinimalLedgerLayout();
    if (props.visualStyle === "modern-breaking-news")
      return renderBreakingLayout();
    if (props.visualStyle === "historic-edition") return renderHistoricLayout();
    if (props.visualStyle === "financial-journal")
      return renderFinancialLayout();
    if (props.visualStyle === "tabloid-shock") return renderTabloidLayout();
    if (props.visualStyle === "sports-daily") return renderSportsLayout();
    return renderClassicLayout();
  };

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} frame={frame} />
      <DecorativeLayer
        theme={props.decorativeTheme ?? variant.decorativeTheme}
        accentColor={accentColor}
        frame={frame}
        totalFrames={totalFrames}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            templateVariant === "modern-grid"
              ? `radial-gradient(circle at 50% 38%, ${alpha("#F3F9FF", 0.18)} 0%, transparent 46%),
                 radial-gradient(circle at 14% 12%, ${alpha(accentColor, 0.14)} 0%, transparent 26%)`
              : templateVariant === "magazine-cover"
                ? `radial-gradient(circle at 50% 40%, ${alpha("#FFF7ED", 0.14)} 0%, transparent 42%),
                   radial-gradient(circle at 18% 10%, ${alpha(accentColor, 0.12)} 0%, transparent 28%)`
                : templateVariant === "minimal-ledger"
                  ? `radial-gradient(circle at 52% 42%, ${alpha("#F7FAF7", 0.16)} 0%, transparent 44%),
                     radial-gradient(circle at 18% 14%, ${alpha(accentColor, 0.1)} 0%, transparent 24%)`
                  : props.visualStyle === "classic-front-page" ||
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
          transform: `translate(-50%, -50%) translate(${drift.x}px, ${drift.y}px) rotate(${paperTilt + drift.rotate}deg) scale(${paperState.scale * drift.scale})`,
          opacity: paperState.opacity * exitOpacity,
          filter: fx.blurTransition
            ? `blur(${interpolate(frame, [0, introWindow.endFrame], [2.4, 0], CLAMP)}px)`
            : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: `${Math.round(8 * scale)}px`,
            background: `linear-gradient(180deg, ${alpha(paperTone, 0.98)} 0%, ${alpha(paperTone, 0.94)} 100%)`,
            border: `1px solid ${alpha(frameColor, 0.76)}`,
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
            {renderBody()}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
