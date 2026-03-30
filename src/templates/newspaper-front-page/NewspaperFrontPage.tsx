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
  | "minimal-ledger"
  | "highlight-cover"
  | "opinion-column";

type NewspaperRenderProps = NewspaperFrontPageProps & {
  templateVariant?: NewspaperTemplateVariant;
};

type ActiveNewspaperMotionVariant =
  | "headline-punch"
  | "press-build"
  | "sunday-slow-reveal"
  | "tabloid-blast";

type ActiveHeadlineTreatment =
  | "plain"
  | "yellow-highlight"
  | "strike-through"
  | "sequence-stack"
  | "black-bar-banner"
  | "red-alert-strip"
  | "double-underline-editorial";

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

function splitHeadlineIntoLines(text: string, targetLines = 3) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const words = cleaned.split(" ");
  if (words.length <= targetLines) return words;

  const lines: string[] = [];
  const targetChars = Math.max(16, Math.ceil(cleaned.length / targetLines));
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (
      current &&
      next.length > targetChars &&
      lines.length < targetLines - 1
    ) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
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

  if (templateVariant === "highlight-cover") {
    return {
      paperTone: "#EFE4C6",
      frameColor: "#D3C39A",
      inkColor: "#16110D",
      accentColor: "#E1BE19",
      paperTilt: 0,
    };
  }

  if (templateVariant === "opinion-column") {
    return {
      paperTone: "#F4EBDD",
      frameColor: "#D8C9B7",
      inkColor: "#1A1612",
      accentColor: "#A03C2B",
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
      paperInset: 0.77,
      paperShadow: `0 24px 82px ${alpha("#0F172A", 0.18)}`,
      mastheadScale: 0.97,
      headlineSizeScale: 1.06,
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
      paperInset: 0.77,
      paperShadow: `0 26px 88px ${alpha("#0B1020", 0.24)}`,
      mastheadScale: 0.94,
      headlineSizeScale: 1.02,
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
      paperInset: 0.79,
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
      paperInset: 0.78,
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
      paperInset: 0.78,
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
      paperInset: 0.74,
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
    paperInset: 0.76,
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
  const resolvedMotionVariant: ActiveNewspaperMotionVariant =
    props.newspaperMotionVariant &&
    props.newspaperMotionVariant !== "auto"
      ? props.newspaperMotionVariant
      : templateVariant === "highlight-cover"
        ? "headline-punch"
        : templateVariant === "magazine-cover"
          ? "sunday-slow-reveal"
          : props.visualStyle === "tabloid-shock"
            ? "tabloid-blast"
            : "press-build";
  const resolvedHeadlineTreatment: ActiveHeadlineTreatment =
    props.headlineTreatment && props.headlineTreatment !== "auto"
      ? props.headlineTreatment
      : templateVariant === "highlight-cover"
        ? "yellow-highlight"
        : props.visualStyle === "tabloid-shock"
          ? "strike-through"
          : "plain";
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
  const paperHeight = Math.round(height * (isPortrait ? 0.86 : 0.96));
  const paperPadding = Math.round((isPortrait ? 24 : 28) * scale);
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
  const leadColumn = columns[0] ?? loremFallback[0];
  const middleColumn = columns[Math.min(1, columns.length - 1)] ?? leadColumn;
  const trailingColumns = columns.slice(1);
  const dividerThickness = `${Math.max(1, Math.round(scale))}px`;

  const getSectionRevealStyle = (order: number) => {
    if (resolvedMotionVariant === "press-build") {
      const localFrame = Math.max(0, frame - order * 6);
      return {
        opacity: fadeIn(localFrame, { startFrame: 0, endFrame: 10 }).opacity,
        transform: `translateY(${slideUp(
          localFrame,
          { startFrame: 0, endFrame: 14 },
          18,
        ).y}px)`,
      };
    }

    if (resolvedMotionVariant === "sunday-slow-reveal") {
      const localFrame = Math.max(0, frame - order * 10);
      return {
        opacity: fadeIn(localFrame, { startFrame: 0, endFrame: 18 }).opacity,
        transform: `translateY(${slideUp(
          localFrame,
          { startFrame: 0, endFrame: 20 },
          14,
        ).y}px)`,
      };
    }

    if (resolvedMotionVariant === "tabloid-blast") {
      const localFrame = Math.max(0, frame - order * 4);
      return {
        opacity: fadeIn(localFrame, { startFrame: 0, endFrame: 5 }).opacity,
        transform: `translateY(${slideUp(
          localFrame,
          { startFrame: 0, endFrame: 8 },
          34,
        ).y}px) scale(${interpolate(localFrame, [0, 8], [0.96, 1], CLAMP)})`,
      };
    }

    const localFrame = Math.max(0, frame - order * 5);
    return {
      opacity: fadeIn(localFrame, { startFrame: 0, endFrame: 7 }).opacity,
      transform: `translateY(${slideUp(
        localFrame,
        { startFrame: 0, endFrame: 10 },
        28,
      ).y}px) scale(${interpolate(localFrame, [0, 12, 24], [1.18, 0.98, 1], CLAMP)})`,
    };
  };

  const headlineRevealStyle = getSectionRevealStyle(0);

  const renderHeadlineTreatment = ({
    text,
    fontFamily,
    fontSize,
    fontWeight,
    color,
    lineHeight,
    letterSpacing,
    textTransform,
    textAlign = "left",
    maxWidth,
  }: {
    text: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    color: string;
    lineHeight: number;
    letterSpacing: string;
    textTransform?: "uppercase" | "none";
    textAlign?: "left" | "center" | "right";
    maxWidth?: number;
  }) => {
    const lines = splitHeadlineIntoLines(
      text,
      resolvedHeadlineTreatment === "sequence-stack" ? 3 : 2,
    ).slice(0, resolvedHeadlineTreatment === "sequence-stack" ? 3 : 2);

    if (resolvedHeadlineTreatment === "yellow-highlight") {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(4 * scale)}px`,
            alignItems: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start",
            maxWidth: maxWidth ? `${maxWidth}px` : undefined,
          }}
        >
          {lines.map((line, index) => (
            <div
              key={`${line}-${index}`}
              style={{
                display: "inline-block",
                width: textAlign === "left" ? "100%" : "auto",
                padding: `${Math.round(2 * scale)}px ${Math.round(8 * scale)}px ${Math.round(5 * scale)}px`,
                background: alpha("#E1BE19", 0.96),
              }}
            >
              <span
                style={{
                  fontFamily,
                  fontSize: `${fontSize}px`,
                  fontWeight,
                  color,
                  lineHeight,
                  letterSpacing,
                  textTransform,
                }}
              >
                {line}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (resolvedHeadlineTreatment === "strike-through") {
      return (
        <div
          style={{
            position: "relative",
            maxWidth: maxWidth ? `${maxWidth}px` : undefined,
            textAlign,
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: `${fontSize}px`,
              fontWeight,
              color,
              lineHeight,
              letterSpacing,
              textTransform,
            }}
          >
            {text}
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              height: `${Math.max(3, Math.round(4 * scale))}px`,
              background: alpha("#C92020", 0.92),
              transform: "translateY(-50%) rotate(-1.5deg)",
              boxShadow: `0 0 ${Math.round(10 * scale)}px ${alpha("#C92020", 0.18)}`,
            }}
          />
        </div>
      );
    }

    if (resolvedHeadlineTreatment === "sequence-stack") {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(6 * scale)}px`,
            maxWidth: maxWidth ? `${maxWidth}px` : undefined,
          }}
        >
          {lines.map((line, index) => (
            <div
              key={`${line}-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns: `${Math.round(46 * scale)}px 1fr`,
                gap: `${Math.round(10 * scale)}px`,
                alignItems: "baseline",
                borderTop:
                  index === 0
                    ? "none"
                    : `${Math.max(1, Math.round(scale))}px solid ${alpha(color, 0.14)}`,
                paddingTop: index === 0 ? "0px" : `${Math.round(4 * scale)}px`,
              }}
            >
              <div
                style={{
                  fontFamily: sansFont,
                  fontSize: `${Math.round(fontSize * 0.3)}px`,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: alpha(color, 0.42),
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <div
                style={{
                  fontFamily,
                  fontSize: `${fontSize}px`,
                  fontWeight,
                  color,
                  lineHeight,
                  letterSpacing,
                  textTransform,
                }}
              >
                {line}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (resolvedHeadlineTreatment === "black-bar-banner") {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(6 * scale)}px`,
            alignItems: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start",
            maxWidth: maxWidth ? `${maxWidth}px` : undefined,
          }}
        >
          {lines.map((line, index) => (
            <div
              key={`${line}-${index}`}
              style={{
                display: "inline-block",
                width: textAlign === "left" ? "100%" : "auto",
                padding: `${Math.round(4 * scale)}px ${Math.round(12 * scale)}px ${Math.round(8 * scale)}px`,
                background: "#121212",
                boxShadow: `0 ${Math.round(8 * scale)}px ${Math.round(20 * scale)}px ${alpha("#000000", 0.14)}`,
              }}
            >
              <span
                style={{
                  fontFamily,
                  fontSize: `${fontSize}px`,
                  fontWeight,
                  color: "#FFF7ED",
                  lineHeight,
                  letterSpacing,
                  textTransform,
                }}
              >
                {line}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (resolvedHeadlineTreatment === "red-alert-strip") {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(6 * scale)}px`,
            alignItems: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start",
            maxWidth: maxWidth ? `${maxWidth}px` : undefined,
          }}
        >
          {lines.map((line, index) => (
            <div
              key={`${line}-${index}`}
              style={{
                display: "inline-block",
                width: textAlign === "left" ? "100%" : "auto",
                padding: `${Math.round(5 * scale)}px ${Math.round(12 * scale)}px ${Math.round(8 * scale)}px`,
                background:
                  index === 0
                    ? "#C92020"
                    : `linear-gradient(90deg, #C92020 0%, ${alpha("#C92020", 0.86)} 72%, ${alpha("#C92020", 0.26)} 100%)`,
                boxShadow: `0 ${Math.round(10 * scale)}px ${Math.round(22 * scale)}px ${alpha("#C92020", 0.18)}`,
              }}
            >
              <span
                style={{
                  fontFamily,
                  fontSize: `${fontSize}px`,
                  fontWeight,
                  color: "#FFF7ED",
                  lineHeight,
                  letterSpacing,
                  textTransform,
                }}
              >
                {line}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (resolvedHeadlineTreatment === "double-underline-editorial") {
      return (
        <div
          style={{
            display: "inline-flex",
            flexDirection: "column",
            gap: `${Math.round(8 * scale)}px`,
            maxWidth: maxWidth ? `${maxWidth}px` : undefined,
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: `${fontSize}px`,
              fontWeight,
              color,
              lineHeight,
              letterSpacing,
              textTransform,
              textAlign,
            }}
          >
            {text}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: `${Math.round(4 * scale)}px`,
            }}
          >
            <div
              style={{
                width: "100%",
                height: `${Math.max(3, Math.round(4 * scale))}px`,
                background: alpha("#C92020", 0.92),
              }}
            />
            <div
              style={{
                width: `${Math.round((maxWidth ?? fontSize * 6) * 0.72)}px`,
                height: `${Math.max(2, Math.round(3 * scale))}px`,
                background: alpha(color, 0.74),
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
          fontWeight,
          color,
          lineHeight,
          letterSpacing,
          textTransform,
          textAlign,
          maxWidth: maxWidth ? `${maxWidth}px` : undefined,
        }}
      >
        {text}
      </div>
    );
  };

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
          borderRadius: `${Math.max(0, Math.round((compact ? 1 : 2) * scale))}px`,
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
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 5px)",
            mixBlendMode: "multiply",
            opacity: tone === "light" ? 0.22 : 0.28,
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
            padding: `${Math.round(4 * scale)}px ${Math.round(10 * scale)}px`,
            background: alpha("#000000", tone === "light" ? 0.06 : 0.24),
            border: `1px solid ${alpha("#000000", tone === "light" ? 0.08 : 0.18)}`,
            color: photoTheme.labelColor,
            fontFamily: sansFont,
            fontSize: `${Math.round((compact ? 8 : 9) * scale)}px`,
            letterSpacing: "0.14em",
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
            background: alpha("#000000", tone === "light" ? 0.03 : 0.08),
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
          minWidth: `${Math.round((mode === "pill" ? 156 : 120) * scale)}px`,
          height: `${Math.max(2, Math.round((mode === "pill" ? 12 : 3) * scale))}px`,
          background:
            mode === "pill"
              ? `linear-gradient(90deg, ${alpha(inkColor, 0)} 0%, ${alpha(accentColor, 0.22)} 12%, ${alpha(accentColor, 0.22)} 88%, ${alpha(inkColor, 0)} 100%)`
              : variant.accentRule,
          borderTop:
            mode === "pill"
              ? `${dividerThickness} solid ${alpha(accentColor, 0.46)}`
              : "none",
          borderBottom:
            mode === "pill"
              ? `${dividerThickness} solid ${alpha(accentColor, 0.16)}`
              : "none",
        }}
      />
    </div>
  );

  const renderHalftonePanel = ({
    heightPx,
    label,
    footer,
    variant = "metro",
  }: {
    heightPx: number;
    label: string;
    footer: string;
    variant?: "metro" | "portrait" | "stadium";
  }) => (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: `${heightPx}px`,
        overflow: "hidden",
        border: `1px solid ${alpha(inkColor, 0.46)}`,
        background:
          variant === "portrait"
            ? `radial-gradient(circle at 50% 22%, ${alpha("#FFF7ED", 0.42)} 0%, ${alpha("#FFF7ED", 0.12)} 20%, transparent 38%), linear-gradient(180deg, ${alpha("#362A1E", 0.96)} 0%, ${alpha("#17110C", 0.96)} 100%)`
            : `linear-gradient(180deg, ${alpha("#F4EEDD", 0.94)} 0%, ${alpha("#E6DECC", 0.98)} 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: `${Math.round(8 * scale)}px`,
          border: `1px solid ${alpha(inkColor, variant === "portrait" ? 0.32 : 0.16)}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            variant === "portrait"
              ? "radial-gradient(circle, rgba(0,0,0,0.46) 1.35px, transparent 1.45px)"
              : "radial-gradient(circle, rgba(0,0,0,0.24) 1.15px, transparent 1.25px)",
          backgroundSize:
            variant === "portrait"
              ? `${Math.round(4 * scale)}px ${Math.round(4 * scale)}px`
              : `${Math.round(16 * scale)}px ${Math.round(16 * scale)}px`,
          opacity: variant === "portrait" ? 0.56 : 0.5,
          mixBlendMode: "multiply",
        }}
      />
      {variant === "portrait" ? (
        <>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: `${Math.round(18 * scale)}px`,
              width: `${Math.round(92 * scale)}px`,
              height: `${Math.round(88 * scale)}px`,
              transform: "translateX(-50%)",
              borderRadius: "48% 48% 42% 42%",
              background: alpha("#090909", 0.96),
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: `${Math.round(84 * scale)}px`,
              width: `${Math.round(150 * scale)}px`,
              height: `${Math.round(188 * scale)}px`,
              transform: "translateX(-50%)",
              borderRadius: "44% 44% 8% 8%",
              background: alpha("#E7D9C5", 0.94),
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: `${Math.round(102 * scale)}px`,
              width: `${Math.round(62 * scale)}px`,
              height: `${Math.round(78 * scale)}px`,
              transform: "translateX(-50%)",
              borderRadius: "44% 44% 38% 38%",
              background: alpha("#F7E9D4", 0.78),
              opacity: 0.72,
            }}
          />
        </>
      ) : variant === "stadium" ? (
        <>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "48%",
              width: `${Math.round(160 * scale)}px`,
              height: `${Math.round(86 * scale)}px`,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              border: `2px solid ${alpha(accentColor, 0.82)}`,
              opacity: 0.84,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "48%",
              width: `${Math.round(76 * scale)}px`,
              height: `${Math.round(40 * scale)}px`,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background: alpha("#0F0F0F", 0.24),
              border: `1px solid ${alpha(inkColor, 0.28)}`,
            }}
          />
        </>
      ) : (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: `${Math.round(128 * scale)}px`,
            height: `${Math.round(128 * scale)}px`,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.72) 8%, rgba(0,0,0,0.38) 9%, rgba(0,0,0,0.38) 14%, transparent 15%)",
            opacity: 0.8,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          left: `${Math.round(10 * scale)}px`,
          top: `${Math.round(10 * scale)}px`,
          padding: `${Math.round(3 * scale)}px ${Math.round(8 * scale)}px`,
          border: `1px solid ${alpha(inkColor, 0.22)}`,
          background: alpha("#FFFFFF", variant === "portrait" ? 0.08 : 0.42),
          color: variant === "portrait" ? "#FFF7ED" : alpha(inkColor, 0.8),
          fontFamily: sansFont,
          fontSize: `${Math.round((isPortrait ? 8 : 9) * scale)}px`,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: `${Math.round(10 * scale)}px`,
          padding: `${Math.round(5 * scale)}px ${Math.round(10 * scale)}px`,
          background: variant === "portrait" ? alpha("#000000", 0.34) : alpha("#111111", 0.9),
          color: "#FFF7ED",
          fontFamily: sansFont,
          fontSize: `${Math.round((isPortrait ? 8 : 9) * scale)}px`,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {footer}
      </div>
    </div>
  );

  const renderFeatureCoverHero = ({
    heightPx,
    label,
    footer,
  }: {
    heightPx: number;
    label: string;
    footer: string;
  }) => (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: `${heightPx}px`,
        overflow: "hidden",
        border: `1px solid ${alpha(inkColor, 0.46)}`,
        background: `linear-gradient(180deg, ${alpha("#2C2119", 0.98)} 0%, ${alpha("#16110D", 0.98)} 100%)`,
        boxShadow: `inset 0 0 ${Math.round(80 * scale)}px ${alpha("#FFF7ED", 0.08)}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: `${Math.round(10 * scale)}px`,
          border: `1px solid ${alpha("#FFF7ED", 0.12)}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.4) 1.25px, transparent 1.35px)",
          backgroundSize: `${Math.round(4 * scale)}px ${Math.round(4 * scale)}px`,
          opacity: 0.28,
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: `${Math.round(22 * scale)}px`,
          width: `${Math.round(260 * scale)}px`,
          height: `${Math.round(260 * scale)}px`,
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha("#F4E5CA", 0.9)} 0%, ${alpha("#D8B88B", 0.42)} 28%, ${alpha("#9B6A46", 0.12)} 54%, transparent 72%)`,
          filter: `blur(${Math.round(2 * scale)}px)`,
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${Math.round(30 * scale)}px`,
          right: `${Math.round(30 * scale)}px`,
          top: `${Math.round(42 * scale)}px`,
          bottom: `${Math.round(54 * scale)}px`,
          borderTop: `${Math.max(2, Math.round(2 * scale))}px solid ${alpha("#FFF7ED", 0.3)}`,
          borderBottom: `${Math.max(2, Math.round(2 * scale))}px solid ${alpha("#FFF7ED", 0.12)}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${Math.round(54 * scale)}px`,
          right: `${Math.round(54 * scale)}px`,
          top: `${Math.round(58 * scale)}px`,
          bottom: `${Math.round(78 * scale)}px`,
          background: `linear-gradient(135deg, ${alpha("#F6E6C8", 0.06)} 0%, ${alpha("#FFF7ED", 0.22)} 48%, ${alpha("#E0B98C", 0.08)} 100%)`,
          clipPath:
            "polygon(12% 0%, 88% 0%, 100% 18%, 100% 100%, 0% 100%, 0% 18%)",
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${Math.round(40 * scale)}px`,
          top: `${Math.round(20 * scale)}px`,
          padding: `${Math.round(5 * scale)}px ${Math.round(8 * scale)}px`,
          background: alpha("#111111", 0.74),
          color: "#FFF7ED",
          fontFamily: sansFont,
          fontSize: `${Math.round((isPortrait ? 9 : 10) * scale)}px`,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: "absolute",
          left: `${Math.round(46 * scale)}px`,
          right: `${Math.round(46 * scale)}px`,
          bottom: `${Math.round(18 * scale)}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: `${Math.round(12 * scale)}px`,
          color: alpha("#FFF7ED", 0.7),
          fontFamily: sansFont,
          fontSize: `${Math.round((isPortrait ? 9 : 10) * scale)}px`,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <span>Feature Portrait</span>
        <span>{footer}</span>
      </div>
    </div>
  );

  const renderRouteMapPanel = ({
    heightPx,
    label,
  }: {
    heightPx: number;
    label: string;
  }) => (
    <div
      style={{
        borderTop: `${dividerThickness} solid ${dividerColor}`,
        borderBottom: `${dividerThickness} solid ${alpha(inkColor, 0.12)}`,
        padding: `${Math.round(10 * scale)}px ${Math.round(10 * scale)}px ${Math.round(12 * scale)}px`,
      }}
    >
      <div
        style={{
          color: alpha(inkColor, 0.86),
          fontFamily: sansFont,
          fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: `${Math.round(10 * scale)}px`,
          height: `${heightPx}px`,
          position: "relative",
          overflow: "hidden",
          border: `1px solid ${alpha(inkColor, 0.12)}`,
          background:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(0,0,0,0.02) 100%)",
          backgroundSize: `${Math.round(20 * scale)}px ${Math.round(20 * scale)}px`,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 44"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0 }}
        >
          <path
            d="M8 36 C16 30, 22 31, 30 24 S44 13, 56 18 S74 29, 90 11"
            fill="none"
            stroke={accentColor}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {[8, 22, 36, 52, 68, 84, 90].map((cx, index) => (
            <g key={cx}>
              <circle cx={cx} cy={index === 0 ? 36 : index === 1 ? 30 : index === 2 ? 24 : index === 3 ? 18 : index === 4 ? 24 : index === 5 ? 20 : 11} r="2.4" fill="#F8F3E8" stroke={inkColor} strokeWidth="0.8" />
              <circle cx={cx} cy={index === 0 ? 36 : index === 1 ? 30 : index === 2 ? 24 : index === 3 ? 18 : index === 4 ? 24 : index === 5 ? 20 : 11} r="1" fill={index === 3 ? accentColor : inkColor} />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );

  const renderMarketChartPanel = ({
    heightPx,
    label,
  }: {
    heightPx: number;
    label: string;
  }) => (
    <div
      style={{
        border: `1px solid ${alpha(inkColor, 0.22)}`,
        padding: `${Math.round(10 * scale)}px ${Math.round(12 * scale)}px ${Math.round(12 * scale)}px`,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          padding: `${Math.round(4 * scale)}px ${Math.round(8 * scale)}px`,
          border: `1px solid ${alpha(inkColor, 0.3)}`,
          color: alpha(inkColor, 0.9),
          fontFamily: sansFont,
          fontSize: `${Math.round((isPortrait ? 9 : 10) * scale)}px`,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: `${Math.round(8 * scale)}px`,
          height: `${heightPx}px`,
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
          backgroundSize: `${Math.round(22 * scale)}px ${Math.round(22 * scale)}px`,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 42"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0 }}
        >
          <path
            d="M0 30 C8 29, 12 28, 18 31 S28 29, 34 30 S44 31, 50 30"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M50 30 C58 28, 60 18, 68 10 S84 7, 100 6"
            fill="none"
            stroke="#D12C2C"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="50"
            y1="16"
            x2="50"
            y2="35"
            stroke="#D12C2C"
            strokeDasharray="2 2"
            strokeWidth="0.8"
          />
          <circle cx="50" cy="30" r="1.7" fill="#D12C2C" />
        </svg>
        <div
          style={{
            position: "absolute",
            left: `${Math.round(24 * scale)}px`,
            top: `${Math.round(6 * scale)}px`,
            color: "#D12C2C",
            fontFamily: sansFont,
            fontSize: `${Math.round((isPortrait ? 9 : 10) * scale)}px`,
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          Fed Announcement 2:15 PM
        </div>
      </div>
    </div>
  );

  const renderTickerBar = (text: string) => (
    <div
      style={{
        marginTop: `${Math.round(12 * scale)}px`,
        padding: `${Math.round(10 * scale)}px ${Math.round(14 * scale)}px`,
        background: "#121212",
        color: "#F8F3E8",
        fontFamily: '"Courier New", monospace',
        fontSize: `${Math.round((isPortrait ? 12 : 13) * scale)}px`,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      {text}
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
          ...getSectionRevealStyle(0),
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
          alignSelf: "stretch",
          ...headlineRevealStyle,
        }}
      >
        {renderHeadlineTreatment({
          text: props.headline,
          fontFamily:
            '"Arial Narrow", "Arial Narrow Bold", Impact, Haettenschweiler, sans-serif',
          fontSize: Math.round(headlineSize * 1.18),
          fontWeight: 900,
          color: inkColor,
          lineHeight: 0.8,
          letterSpacing: "-0.065em",
          textTransform: "uppercase",
          textAlign: "left",
          maxWidth: Math.round(paperWidth * 0.98),
        })}
      </div>

      {props.subheadline ? (
        <div
          style={{
            marginTop: `${Math.round(10 * scale)}px`,
            alignSelf: "stretch",
            fontFamily: bodyFont,
            fontStyle: "italic",
            fontSize: `${Math.round((isPortrait ? 17 : 19) * scale)}px`,
            lineHeight: 1.22,
            color: alpha(inkColor, 0.84),
            textAlign: "left",
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
          marginTop: `${Math.round(18 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait
            ? "1fr"
            : columns.length >= 3
              ? "0.96fr 1.22fr 0.9fr"
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
        }}
      />

      <div
        style={{
          marginTop: `${Math.round(16 * scale)}px`,
        }}
      >
        {renderHeadlineTreatment({
          text: props.headline,
          fontFamily: headlineFont,
          fontSize: Math.round(headlineSize * 1.1),
          fontWeight: 900,
          color: props.inkColor,
          lineHeight: 0.86,
          letterSpacing: "-0.055em",
          textTransform: "uppercase",
          maxWidth: Math.round(paperWidth * 0.92),
        })}
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
          }}
        >
          {renderHeadlineTreatment({
            text: props.headline,
            fontFamily: mastheadFont,
            fontSize: Math.round(headlineSize * 0.95),
            fontWeight: 900,
            color: props.inkColor,
            lineHeight: 0.9,
            letterSpacing: "-0.045em",
            textTransform: "uppercase",
            textAlign: "center",
            maxWidth: Math.round(paperWidth * 0.76),
          })}
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
            }}
          >
            {renderHeadlineTreatment({
              text: props.headline,
              fontFamily: headlineFont,
              fontSize: Math.round(headlineSize * 0.96),
              fontWeight: 900,
              color: props.inkColor,
              lineHeight: 0.88,
              letterSpacing: "-0.055em",
              textTransform: "uppercase",
              maxWidth: Math.round(paperWidth * 0.56),
            })}
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
          textAlign: "center",
          fontFamily: headlineFont,
          fontSize: `${Math.round((isPortrait ? 40 : 54) * scale)}px`,
          fontWeight: 700,
          letterSpacing: "-0.045em",
          textTransform: "uppercase",
          color: inkColor,
          ...getSectionRevealStyle(0),
        }}
      >
        {props.masthead}
      </div>

      <div
        style={{
          marginTop: `${Math.round(10 * scale)}px`,
          height: dividerThickness,
          background: inkColor,
        }}
      />

      <div
        style={{
          marginTop: `${Math.round(12 * scale)}px`,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: `${Math.round(10 * scale)}px`,
          alignItems: "center",
          color: alpha(inkColor, 0.8),
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
          gridTemplateColumns: isPortrait ? "1fr" : "1.14fr 0.86fr",
          gap: `${Math.round(18 * scale)}px`,
          alignItems: "start",
        }}
      >
        <div
          style={{
            borderTop: `${Math.max(2, Math.round(2 * scale))}px solid ${alpha(accentColor, 0.84)}`,
            borderBottom: `${dividerThickness} solid ${alpha(inkColor, 0.18)}`,
            padding: `${Math.round(12 * scale)}px ${Math.round(12 * scale)}px ${Math.round(14 * scale)}px`,
          }}
        >
          <div
            style={{
              color: alpha(accentColor, 0.88),
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
              marginTop: `${Math.round(10 * scale)}px`,
              ...headlineRevealStyle,
            }}
          >
            {renderHeadlineTreatment({
              text: props.headline,
              fontFamily:
                '"Arial Narrow", "Arial Narrow Bold", Impact, Haettenschweiler, sans-serif',
              fontSize: Math.round(headlineSize * 1.12),
              fontWeight: 900,
              color: inkColor,
              lineHeight: 0.83,
              letterSpacing: "-0.06em",
              textTransform: "uppercase",
              maxWidth: Math.round(paperWidth * 0.98),
            })}
          </div>
          {props.subheadline ? (
            <div
              style={{
                marginTop: `${Math.round(10 * scale)}px`,
                fontFamily: bodyFont,
                fontStyle: "italic",
                fontSize: `${Math.round((isPortrait ? 16 : 18) * scale)}px`,
                lineHeight: 1.24,
                color: alpha(inkColor, 0.86),
              }}
            >
              {props.subheadline}
            </div>
          ) : null}
          <div
            style={{
              marginTop: `${Math.round(12 * scale)}px`,
              display: "grid",
              gridTemplateColumns: isPortrait ? "1fr" : "1fr 1fr",
              gap: `${Math.round(10 * scale)}px`,
            }}
          >
            {["Commuters cheer as doors open", "Signal delays hit within first hour"].map((label, index) => (
              <div
                key={label}
                style={{
                  paddingTop: `${Math.round(8 * scale)}px`,
                  borderTop: `${dividerThickness} solid ${alpha(inkColor, index === 0 ? 0.22 : 0.14)}`,
                }}
              >
                <div
                  style={{
                    color: inkColor,
                    fontFamily: headlineFont,
                    fontSize: `${Math.round((isPortrait ? 15 : 16) * scale)}px`,
                    fontWeight: 700,
                    lineHeight: 1.06,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    marginTop: `${Math.round(5 * scale)}px`,
                    color: alpha(inkColor, 0.8),
                    fontFamily: bodyFont,
                    fontSize: `${Math.round((isPortrait ? 13 : 14) * scale)}px`,
                    lineHeight: 1.34,
                  }}
                >
                  {index === 0
                    ? (leadColumn.text.split(/[.!?]/)[0]?.trim() ??
                      leadColumn.text)
                    : (middleColumn.text.split(/[.!?]/)[0]?.trim() ??
                      middleColumn.text)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: `${Math.round(14 * scale)}px` }}>
            {renderRouteMapPanel({
              heightPx: Math.round((isPortrait ? 132 : 170) * scale),
              label: "Line 4 route map",
            })}
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
                borderTop: `${dividerThickness} solid ${alpha(inkColor, 0.24)}`,
                paddingTop: `${Math.round(10 * scale)}px`,
              }}
            >
              {renderHalftonePanel({
                heightPx: Math.round(photoHeight * 1.62),
                label: props.photoLabel,
                footer: props.photoCaption ?? "Photo: crowds at new central hub",
                variant: "metro",
              })}
            </div>
          ) : null}
          <div
            style={{
              padding: `${Math.round(12 * scale)}px 0px ${Math.round(10 * scale)}px`,
              borderTop: `${Math.max(2, Math.round(2 * scale))}px solid ${alpha(accentColor, 0.44)}`,
              borderBottom: `${dividerThickness} solid ${alpha(inkColor, 0.14)}`,
            }}
          >
            <div
              style={{
                color: alpha(inkColor, 0.72),
                fontFamily: sansFont,
                fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Voices of the city
            </div>
            <div
              style={{
                marginTop: `${Math.round(8 * scale)}px`,
                paddingLeft: `${Math.round(12 * scale)}px`,
                borderLeft: `${Math.max(2, Math.round(2 * scale))}px solid ${accentColor}`,
                color: alpha(inkColor, 0.86),
                fontFamily: bodyFont,
                fontStyle: "italic",
                fontSize: `${Math.round((isPortrait ? 17 : 20) * scale)}px`,
                lineHeight: 1.2,
              }}
            >
              "It cuts my commute in half. I can finally see my kids before bedtime."
              <div
                style={{
                  marginTop: `${Math.round(8 * scale)}px`,
                  color: alpha(inkColor, 0.72),
                  fontFamily: sansFont,
                  fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
                  fontWeight: 700,
                  fontStyle: "normal",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Sarah J., West End
              </div>
            </div>
          </div>
          <div
            style={{
              padding: `${Math.round(10 * scale)}px 0px`,
              borderTop: `${dividerThickness} solid ${alpha(inkColor, 0.18)}`,
            }}
          >
            <div
              style={{
                color: inkColor,
                fontFamily: headlineFont,
                fontSize: `${Math.round((isPortrait ? 15 : 17) * scale)}px`,
                fontWeight: 700,
                lineHeight: 1.08,
              }}
            >
              Neighborhood reaction
            </div>
            <div
              style={{
                marginTop: `${Math.round(5 * scale)}px`,
                color: alpha(inkColor, 0.78),
                fontFamily: bodyFont,
                fontSize: `${Math.round((isPortrait ? 13 : 14) * scale)}px`,
                lineHeight: 1.34,
              }}
            >
              Residents near the new stations report packed sidewalks, celebratory scenes, and longer-than-expected morning waits as the network absorbs its first surge.
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: `${Math.round(14 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait ? "1fr" : "repeat(3, minmax(0, 1fr))",
          gap: `${Math.round(14 * scale)}px`,
        }}
      >
        {[
          "Breaking delay ticker",
          "Mayor outlines next phase",
          "Neighbourhood stations highlighted",
        ].map((item, index) => (
          <div
            key={item}
            style={{
              paddingTop: `${Math.round(8 * scale)}px`,
              borderTop: `${dividerThickness} solid ${index === 0 ? alpha(accentColor, 0.44) : alpha(inkColor, 0.16)}`,
              color: alpha(inkColor, 0.76),
              fontFamily: sansFont,
              fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
              letterSpacing: "0.06em",
              lineHeight: 1.3,
            }}
          >
            {item}
          </div>
        ))}
      </div>

      {renderFooter(
        props.footerLine ??
          "A city morning edition with one dominant transit story, a service rail, and print-style utility blocks.",
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
          fontFamily: '"Bodoni MT", Didot, "Times New Roman", serif',
          fontSize: `${Math.round((isPortrait ? 44 : 64) * scale)}px`,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          textTransform: "uppercase",
          color: props.inkColor,
          ...getSectionRevealStyle(0),
        }}
      >
        {props.masthead}
      </div>

      <div
        style={{
          marginTop: `${Math.round(14 * scale)}px`,
          height: dividerThickness,
          background: inkColor,
        }}
      />

      <div
        style={{
          marginTop: `${Math.round(18 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait ? "1fr" : "0.2fr 0.6fr 0.2fr",
          gap: `${Math.round(14 * scale)}px`,
          alignItems: "start",
        }}
      >
        <div
          style={{
            paddingTop: `${Math.round(8 * scale)}px`,
            borderTop: `${dividerThickness} solid ${alpha(inkColor, 0.16)}`,
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(8 * scale)}px`,
            color: alpha(inkColor, 0.8),
            fontFamily: sansFont,
            fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {["Exclusive", "Long Read", "Weekend Review"].map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
          }}
        >
          {renderFeatureCoverHero({
            heightPx: Math.round((isPortrait ? 260 : 360) * scale),
            label: props.kicker ?? "Cover Story",
            footer: props.photoCaption ?? "Traditional print portrait treatment",
          })}
        </div>

        <div
          style={{
            paddingTop: `${Math.round(8 * scale)}px`,
            borderTop: `${dividerThickness} solid ${alpha(inkColor, 0.16)}`,
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(8 * scale)}px`,
            color: alpha(inkColor, 0.8),
            fontFamily: sansFont,
            fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textAlign: "right",
          }}
        >
          {["Interview", "Inside Story", "Culture"].map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: `${Math.round(12 * scale)}px`,
          display: "flex",
          justifyContent: "center",
          ...headlineRevealStyle,
        }}
      >
        {renderHeadlineTreatment({
          text: props.headline,
          fontFamily: '"Bodoni MT", Didot, "Times New Roman", serif',
          fontSize: Math.round(headlineSize * 1.04),
          fontWeight: 700,
          color: inkColor,
          lineHeight: 0.92,
          letterSpacing: "-0.05em",
          textTransform: "uppercase",
          textAlign: "center",
          maxWidth: Math.round(paperWidth * 0.84),
        })}
      </div>

      {props.subheadline ? (
        <div
          style={{
            marginTop: `${Math.round(10 * scale)}px`,
            maxWidth: `${Math.round(paperWidth * 0.72)}px`,
            alignSelf: "center",
            textAlign: "center",
            fontFamily: bodyFont,
            fontStyle: "italic",
            fontSize: `${Math.round((isPortrait ? 16 : 18) * scale)}px`,
            lineHeight: 1.28,
            color: alpha(inkColor, 0.8),
          }}
        >
          {props.subheadline}
        </div>
      ) : null}

      <div
        style={{
          marginTop: `${Math.round(14 * scale)}px`,
          height: dividerThickness,
          background: alpha(inkColor, 0.72),
        }}
      />

      <div
        style={{
          marginTop: `${Math.round(14 * scale)}px`,
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
          "A centered Sunday-review cover with framed portrait, big display type, and restrained coverline rails.",
        "pill",
      )}
    </>
  );

  const renderMinimalLedgerLayout = () => (
    <>
      <div
        style={{
          textAlign: "center",
          fontFamily: '"Bodoni MT", Didot, "Times New Roman", serif',
          fontSize: `${Math.round((isPortrait ? 40 : 52) * scale)}px`,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          textTransform: "uppercase",
          color: inkColor,
          ...getSectionRevealStyle(0),
        }}
      >
        {props.masthead}
      </div>

      <div
        style={{
          marginTop: `${Math.round(10 * scale)}px`,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: `${Math.round(10 * scale)}px`,
          alignItems: "center",
          color: alpha(inkColor, 0.78),
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
            textAlign: "center",
            paddingRight: !isPortrait ? `${Math.round(6 * scale)}px` : "0px",
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
              fontFamily: '"Bodoni MT", Didot, "Times New Roman", serif',
              fontSize: `${Math.round(headlineSize * 0.88)}px`,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 0.92,
              color: inkColor,
              textTransform: "uppercase",
              ...headlineRevealStyle,
            }}
          >
            {props.headline}
          </div>
          {props.subheadline ? (
            <div
              style={{
                marginTop: `${Math.round(12 * scale)}px`,
                maxWidth: `${Math.round(paperWidth * 0.72)}px`,
                alignSelf: "center",
                fontFamily: bodyFont,
                fontStyle: "italic",
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
            borderLeft: !isPortrait
              ? `${dividerThickness} solid ${alpha(inkColor, 0.16)}`
              : "none",
            paddingLeft: !isPortrait ? `${Math.round(18 * scale)}px` : "0px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: `${Math.round(14 * scale)}px`,
            }}
          >
            <div
              style={{
                paddingTop: `${Math.round(8 * scale)}px`,
                borderTop: `${dividerThickness} solid ${alpha(inkColor, 0.24)}`,
              }}
            >
              <div
                style={{
                  color: inkColor,
                  fontFamily: headlineFont,
                  fontSize: `${Math.round((isPortrait ? 17 : 18) * scale)}px`,
                  fontWeight: 700,
                  lineHeight: 1.06,
                }}
              >
                Bond markets reprice rapidly as yield curve flattens
              </div>
              <div
                style={{
                  marginTop: `${Math.round(8 * scale)}px`,
                  color: alpha(inkColor, 0.76),
                  fontFamily: bodyFont,
                  fontSize: `${Math.round((isPortrait ? 13 : 14) * scale)}px`,
                  lineHeight: 1.34,
                }}
              >
                Treasury yields fall sharply after the emergency move, forcing desks to reassess recession bets and funding costs before the close.
              </div>
            </div>
            <div
              style={{
                paddingTop: `${Math.round(8 * scale)}px`,
                borderTop: `${dividerThickness} solid ${alpha(inkColor, 0.14)}`,
              }}
            >
              <div
                style={{
                  color: inkColor,
                  fontFamily: headlineFont,
                  fontSize: `${Math.round((isPortrait ? 17 : 18) * scale)}px`,
                  fontWeight: 700,
                  lineHeight: 1.06,
                }}
              >
                Dollar weakens against major currencies on rate shock
              </div>
              <div
                style={{
                  marginTop: `${Math.round(8 * scale)}px`,
                  color: alpha(inkColor, 0.76),
                  fontFamily: bodyFont,
                  fontSize: `${Math.round((isPortrait ? 13 : 14) * scale)}px`,
                  lineHeight: 1.34,
                }}
              >
                FX traders unwind defensive positions as the surprise cut narrows yield advantages and sends the greenback lower through the afternoon.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: `${Math.round(16 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait ? "1fr" : "1.28fr 0.72fr",
          gap: `${Math.round(16 * scale)}px`,
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(12 * scale)}px`,
          }}
        >
          {renderMarketChartPanel({
            heightPx: Math.round((isPortrait ? 194 : 248) * scale),
            label: "S&P 500 - Intraday",
          })}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: `${Math.round(10 * scale)}px`,
              borderTop: `${dividerThickness} solid ${alpha(inkColor, 0.24)}`,
              borderBottom: `${dividerThickness} solid ${alpha(inkColor, 0.14)}`,
              padding: `${Math.round(10 * scale)}px 0px`,
            }}
          >
            {[
              ["Dow", "+4.2%"],
              ["S&P 500", "+3.8%"],
              ["Nasdaq", "+5.1%"],
              ["10-Yr Yield", "3.41%"],
              ["USD/EUR", "1.094"],
            ].map(([label, value], index) => (
              <div key={label}>
                <div
                  style={{
                    color: alpha(inkColor, 0.54),
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
                    color: index < 3 ? "#D12C2C" : inkColor,
                    fontFamily: sansFont,
                    fontSize: `${Math.round((isPortrait ? 14 : 15) * scale)}px`,
                    fontWeight: 800,
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
            borderLeft: !isPortrait
              ? `${dividerThickness} solid ${alpha(inkColor, 0.16)}`
              : "none",
            paddingLeft: !isPortrait ? `${Math.round(16 * scale)}px` : "0px",
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(16 * scale)}px`,
          }}
        >
          {[
            {
              title: "Bond markets reprice rapidly as yield curve flattens",
              body:
                "Treasury yields plummet across the board, signalling deep economic concerns as desks race to reframe expectations for growth and inflation.",
            },
            {
              title: "Dollar weakens against major currencies on rate shock",
              body:
                "The greenback falls against the euro and yen as traders unwind the dollar's relative rate advantage after the emergency move.",
            },
          ].map((story, index) => (
            <div
              key={story.title}
              style={{
                paddingTop: `${Math.round(8 * scale)}px`,
                borderTop: `${dividerThickness} solid ${alpha(inkColor, index === 0 ? 0.24 : 0.14)}`,
              }}
            >
              <div
                style={{
                  color: inkColor,
                  fontFamily: headlineFont,
                  fontSize: `${Math.round((isPortrait ? 18 : 20) * scale)}px`,
                  fontWeight: 700,
                  lineHeight: 1.08,
                }}
              >
                {story.title}
              </div>
              <div
                style={{
                  marginTop: `${Math.round(8 * scale)}px`,
                  color: alpha(inkColor, 0.78),
                  fontFamily: bodyFont,
                  fontSize: `${Math.round((isPortrait ? 13 : 14) * scale)}px`,
                  lineHeight: 1.34,
                }}
              >
                {story.body}
              </div>
              <div
                style={{
                  marginTop: `${Math.round(10 * scale)}px`,
                  width: `${Math.round(22 * scale)}px`,
                  height: `${Math.max(2, Math.round(3 * scale))}px`,
                  background: "#D12C2C",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {renderTickerBar(
        "BPS in emergency meeting *** Dow Jones industrial average surges over 1,000 points *** S&P 500 hits session highs *** Bond yields plunge",
      )}
    </>
  );

  const renderHighlightCoverLayout = () => {
    const headlineLines = splitHeadlineIntoLines(props.headline, 2).slice(0, 2);
    const emphasisLine =
      columns[0]?.title ?? props.kicker ?? "Power Move";
    const supportingQuote =
      columns[1]?.text ??
      "A political staffing move can instantly change how a story is read, shifting it from rumor into signal.";

    return (
      <div
        style={{
          position: "relative",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(${alpha(inkColor, 0.08)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(inkColor, 0.08)} 1px, transparent 1px)`,
            backgroundSize: `${Math.round(40 * scale)}px ${Math.round(40 * scale)}px`,
            opacity: 0.75,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(12 * scale)}px`,
            ...getSectionRevealStyle(0),
          }}
        >
          <div
            style={{
              alignSelf: "flex-start",
              padding: `${Math.round(7 * scale)}px ${Math.round(14 * scale)}px`,
              background: "#C92020",
              color: "#FFF7ED",
              fontFamily: headlineFont,
              fontSize: `${Math.round((isPortrait ? 14 : 16) * scale)}px`,
              fontWeight: 800,
              letterSpacing: "0.01em",
              textTransform: "uppercase",
            }}
          >
            {props.dateLine}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: `${Math.round(4 * scale)}px`,
              maxWidth: "100%",
            }}
          >
            {headlineLines.map((line, index) => (
              <div
                key={`${line}-${index}`}
                style={{
                  alignSelf: "stretch",
                  display: "block",
                  width: "100%",
                  padding: `${Math.round(2 * scale)}px ${Math.round(8 * scale)}px ${Math.round(5 * scale)}px`,
                  background:
                    index < 2
                      ? alpha(accentColor, 0.96)
                      : alpha(accentColor, 0.88),
                  boxDecorationBreak: "clone",
                  WebkitBoxDecorationBreak: "clone",
                }}
              >
                <span
                  style={{
                    fontFamily: mastheadFont,
                    fontSize: `${Math.round((isPortrait ? 34 : 52) * scale)}px`,
                    fontWeight: 700,
                    letterSpacing: "-0.045em",
                    lineHeight: 0.9,
                    color: inkColor,
                  }}
                >
                  {line}
                </span>
              </div>
            ))}
          </div>

          {props.subheadline ? (
            <div
              style={{
                maxWidth: `${Math.round(paperWidth * 0.94)}px`,
                fontFamily: bodyFont,
                fontSize: `${Math.round((isPortrait ? 15 : 19) * scale)}px`,
                lineHeight: 1.22,
                color: alpha(inkColor, 0.92),
              }}
            >
              {props.subheadline}
            </div>
          ) : null}

          <div
            style={{
              width: "100%",
              height: dividerThickness,
              background: alpha(inkColor, 0.68),
            }}
          />

          <div
            style={{
              alignSelf: "flex-end",
              fontFamily: mastheadFont,
              fontSize: `${Math.round((isPortrait ? 24 : 30) * scale)}px`,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: alpha(inkColor, 0.96),
            }}
          >
            {props.masthead}
          </div>

          <div
            style={{
              marginTop: `${Math.round(8 * scale)}px`,
              display: "flex",
              flexDirection: "column",
              gap: `${Math.round(18 * scale)}px`,
              flex: 1,
              minHeight: 0,
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                paddingTop: `${Math.round(12 * scale)}px`,
                borderTop: `${dividerThickness} solid ${alpha(inkColor, 0.18)}`,
              }}
            >
              <div
                style={{
                  fontFamily: sansFont,
                  fontSize: `${Math.round((isPortrait ? 11 : 12) * scale)}px`,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: alpha("#C92020", 0.92),
                }}
              >
                {emphasisLine}
              </div>
              <div
                style={{
                  marginTop: `${Math.round(8 * scale)}px`,
                  maxWidth: `${Math.round(paperWidth * 0.74)}px`,
                  fontFamily: mastheadFont,
                  fontSize: `${Math.round((isPortrait ? 34 : 48) * scale)}px`,
                  fontWeight: 700,
                  lineHeight: 0.94,
                  letterSpacing: "-0.04em",
                  color: alpha(inkColor, 0.92),
                  textTransform: "uppercase",
                }}
              >
                Power, timing, and influence collide in one move.
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isPortrait ? "1fr" : "1.05fr 0.95fr",
                gap: `${Math.round(18 * scale)}px`,
                alignItems: "end",
              }}
            >
              <div
                style={{
                  borderTop: `${dividerThickness} solid ${alpha(inkColor, 0.18)}`,
                  paddingTop: `${Math.round(12 * scale)}px`,
                }}
              >
                <div
                  style={{
                    fontFamily: bodyFont,
                    fontStyle: "italic",
                    fontSize: `${Math.round((isPortrait ? 22 : 28) * scale)}px`,
                    lineHeight: 1.18,
                    color: alpha(inkColor, 0.88),
                    maxWidth: `${Math.round(paperWidth * 0.5)}px`,
                  }}
                >
                  "{paragraphize(supportingQuote)[0]}"
                </div>
              </div>

              <div
                style={{
                  borderTop: `${dividerThickness} solid ${alpha(inkColor, 0.18)}`,
                  paddingTop: `${Math.round(12 * scale)}px`,
                  display: "flex",
                  flexDirection: "column",
                  gap: `${Math.round(6 * scale)}px`,
                }}
              >
                {["Earlier", "Now", "Next"].map((label, index) => (
                  <div
                    key={label}
                    style={{
                      display: "grid",
                      gridTemplateColumns: `${Math.round(60 * scale)}px 1fr`,
                      gap: `${Math.round(10 * scale)}px`,
                      alignItems: "start",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: sansFont,
                        fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
                        fontWeight: 800,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: alpha("#C92020", 0.9),
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontFamily: bodyFont,
                        fontSize: `${Math.round((isPortrait ? 15 : 18) * scale)}px`,
                        lineHeight: 1.18,
                        color: alpha(inkColor, 0.84),
                      }}
                    >
                      {index === 0
                        ? "Private conversations begin."
                        : index === 1
                          ? "A public move resets the story."
                          : "Observers watch for deeper alignment."}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  };

  const renderOpinionColumnLayout = () => (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: `${Math.round(10 * scale)}px`,
          color: alpha(inkColor, 0.72),
          fontFamily: sansFont,
          fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        <div>{props.editionLine}</div>
        <div style={{ textAlign: "center" }}>{props.kicker ?? "Opinion"}</div>
        <div style={{ textAlign: "right" }}>{props.dateLine}</div>
      </div>

      <div
        style={{
          marginTop: `${Math.round(12 * scale)}px`,
          height: dividerThickness,
          background: alpha(inkColor, 0.7),
        }}
      />

      <div
        style={{
          marginTop: `${Math.round(16 * scale)}px`,
          textAlign: "center",
          fontFamily: mastheadFont,
          fontSize: `${Math.round((isPortrait ? 22 : 28) * scale)}px`,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: inkColor,
        }}
      >
        {props.masthead}
      </div>

      <div
        style={{
          marginTop: `${Math.round(18 * scale)}px`,
          alignSelf: "center",
          ...headlineRevealStyle,
        }}
      >
        {renderHeadlineTreatment({
          text: props.headline,
          fontFamily: mastheadFont,
          fontSize: Math.round((isPortrait ? 46 : 72) * scale),
          fontWeight: 700,
          color: inkColor,
          lineHeight: 0.88,
          letterSpacing: "-0.05em",
          textAlign: "center",
          maxWidth: Math.round(paperWidth * 0.84),
        })}
      </div>

      {props.subheadline ? (
        <div
          style={{
            marginTop: `${Math.round(12 * scale)}px`,
            maxWidth: `${Math.round(paperWidth * 0.8)}px`,
            alignSelf: "center",
            textAlign: "center",
            fontFamily: bodyFont,
            fontStyle: "italic",
            fontSize: `${Math.round((isPortrait ? 22 : 28) * scale)}px`,
            lineHeight: 1.18,
            color: alpha(inkColor, 0.84),
          }}
        >
          {props.subheadline}
        </div>
      ) : null}

      <div
        style={{
          marginTop: `${Math.round(18 * scale)}px`,
          display: "grid",
          gridTemplateColumns: isPortrait ? "1fr" : "1.18fr 0.82fr",
          gap: `${Math.round(26 * scale)}px`,
          flex: 1,
        }}
      >
        <div
          style={{
            paddingTop: `${Math.round(10 * scale)}px`,
            borderTop: `${dividerThickness} solid ${alpha(inkColor, 0.18)}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily: bodyFont,
              fontSize: `${Math.round((isPortrait ? 22 : 29) * scale)}px`,
              lineHeight: 1.46,
              color: alpha(inkColor, 0.9),
              textAlign: "justify",
            }}
          >
            {[
              ...(paragraphize(columns[0]?.text ?? "") || []),
              ...(paragraphize(columns[1]?.text ?? columns[0]?.text ?? "") || []),
            ]
              .slice(0, isPortrait ? 4 : 5)
              .map((paragraph, index) => (
                <p
                  key={`${paragraph}-${index}`}
                  style={{
                    margin: 0,
                    textIndent:
                      index > 0 ? `${Math.round((isPortrait ? 14 : 22) * scale)}px` : "0px",
                  }}
                >
                  {paragraph}
                </p>
              ))}
          </div>

          <div>
            <div
              style={{
                marginTop: `${Math.round(18 * scale)}px`,
                fontFamily: bodyFont,
                fontStyle: "italic",
                fontSize: `${Math.round((isPortrait ? 28 : 38) * scale)}px`,
                lineHeight: 1.12,
                color: alpha(inkColor, 0.88),
                maxWidth: `${Math.round(paperWidth * 0.58)}px`,
              }}
            >
              "{paragraphize(columns[2]?.text ?? columns[1]?.text ?? "")[0]}"
            </div>
          </div>
        </div>

        <div
          style={{
            paddingTop: `${Math.round(10 * scale)}px`,
            borderTop: `${dividerThickness} solid ${alpha(inkColor, 0.18)}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            borderLeft: !isPortrait
              ? `${dividerThickness} solid ${alpha(inkColor, 0.14)}`
              : "none",
            paddingLeft: !isPortrait ? `${Math.round(20 * scale)}px` : "0px",
            gap: `${Math.round(18 * scale)}px`,
          }}
        >
          <div
            style={{
              fontFamily: mastheadFont,
              fontSize: `${Math.round((isPortrait ? 26 : 34) * scale)}px`,
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              color: inkColor,
            }}
          >
            {columns[0]?.title ?? "Lead Argument"}
          </div>

          <div
            style={{
              fontFamily: bodyFont,
              fontSize: `${Math.round((isPortrait ? 17 : 22) * scale)}px`,
              lineHeight: 1.36,
              color: alpha(inkColor, 0.84),
            }}
          >
            {[
              ...(paragraphize(columns[0]?.text ?? "") || []),
              ...(paragraphize(columns[2]?.text ?? columns[1]?.text ?? "") || []),
            ]
              .slice(0, isPortrait ? 3 : 4)
              .map((paragraph, index) => (
                <p
                  key={`${paragraph}-${index}`}
                  style={{ margin: index === 0 ? 0 : `${Math.round(8 * scale)}px 0 0` }}
                >
                  {paragraph}
                </p>
              ))}
          </div>

          <div
            style={{
              paddingTop: `${Math.round(10 * scale)}px`,
              borderTop: `${dividerThickness} solid ${alpha(inkColor, 0.14)}`,
              fontFamily: sansFont,
              fontSize: `${Math.round((isPortrait ? 10 : 11) * scale)}px`,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: alpha(inkColor, 0.72),
            }}
          >
            {props.footerLine ?? "A high-legibility opinion page designed for essays, editorials, and argument-led stories."}
          </div>
        </div>
      </div>
    </>
  );

  const renderBody = () => {
    if (templateVariant === "modern-grid") return renderModernGridLayout();
    if (templateVariant === "magazine-cover")
      return renderMagazineCoverLayout();
    if (templateVariant === "minimal-ledger")
      return renderMinimalLedgerLayout();
    if (templateVariant === "highlight-cover")
      return renderHighlightCoverLayout();
    if (templateVariant === "opinion-column")
      return renderOpinionColumnLayout();
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
              : templateVariant === "highlight-cover"
                ? `radial-gradient(circle at 28% 78%, ${alpha("#F9F0C1", 0.24)} 0%, transparent 34%),
                   radial-gradient(circle at 70% 18%, ${alpha("#F7E4A5", 0.16)} 0%, transparent 28%)`
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
            borderRadius:
              templateVariant === "magazine-cover"
                ? `${Math.round(2 * scale)}px`
                : "0px",
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
