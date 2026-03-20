import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import {
  secToFrame,
  fadeIn,
  fadeOut,
  slideUp,
  clipReveal,
  cameraDrift,
  parallaxLayer,
  glowPulse,
  microFloat,
} from "../../primitives/animations";
import type { ClipDirection } from "../../primitives/animations";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveEffects } from "../../primitives/useEffects";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { CinematicHeroProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const REVEAL_MAP: Record<string, ClipDirection> = {
  left: "left",
  right: "right",
  center: "center-h",
  bottom: "bottom",
};

interface AccentShape {
  type: "circle" | "line" | "rectangle" | "diamond";
  x: string;
  y: string;
  size: number;
  depth: number;
  rotation?: number;
}

function getMoodAccents(mood: string): AccentShape[] {
  if (mood === "minimal") {
    return [
      { type: "line", x: "75%", y: "30%", size: 120, depth: 0.2, rotation: 0 },
      { type: "circle", x: "80%", y: "70%", size: 24, depth: 0.35 },
    ];
  }
  if (mood === "elegant") {
    return [
      { type: "diamond", x: "82%", y: "25%", size: 18, depth: 0.25, rotation: 45 },
      { type: "line", x: "15%", y: "80%", size: 80, depth: 0.2, rotation: -30 },
      { type: "diamond", x: "12%", y: "30%", size: 12, depth: 0.4, rotation: 45 },
    ];
  }
  // bold
  return [
    { type: "circle", x: "85%", y: "20%", size: 180, depth: 0.15 },
    { type: "line", x: "10%", y: "75%", size: 160, depth: 0.3, rotation: 25 },
    { type: "rectangle", x: "78%", y: "75%", size: 60, depth: 0.4, rotation: 15 },
  ];
}

function renderAccent(
  shape: AccentShape,
  index: number,
  accentColor: string,
  opacity: number,
  parallaxX: number,
  scale: number
): React.ReactNode {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: shape.x,
    top: shape.y,
    opacity,
    transform: `translateX(${parallaxX}px) rotate(${shape.rotation || 0}deg)`,
  };

  const s = Math.round(shape.size * scale);

  if (shape.type === "circle") {
    return (
      <div
        key={index}
        style={{
          ...baseStyle,
          width: s + "px",
          height: s + "px",
          borderRadius: "50%",
          border: `2px solid ${accentColor}40`,
          backgroundColor: accentColor + "08",
        }}
      />
    );
  }
  if (shape.type === "line") {
    return (
      <div
        key={index}
        style={{
          ...baseStyle,
          width: s + "px",
          height: "2px",
          backgroundColor: accentColor + "30",
        }}
      />
    );
  }
  if (shape.type === "diamond") {
    return (
      <div
        key={index}
        style={{
          ...baseStyle,
          width: s + "px",
          height: s + "px",
          border: `1.5px solid ${accentColor}50`,
        }}
      />
    );
  }
  // rectangle
  return (
    <div
      key={index}
      style={{
        ...baseStyle,
        width: s + "px",
        height: Math.round(s * 0.6) + "px",
        border: `1.5px solid ${accentColor}25`,
        borderRadius: "4px",
      }}
    />
  );
}

export const CinematicHero: React.FC<CinematicHeroProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, scale } = useResponsiveConfig();
  const totalFrames = secToFrame(props.duration);

  // ── Resolve creative enhancement fields ────────────────────────────────
  const resolved = resolveStylePreset(
    props.stylePreset,
    props.typography,
    props.motionStyle,
    props.effects,
  );
  const typo = resolveTypography(resolved.typography);
  const motion = resolveMotionStyle(resolved.motionStyle);
  const fx = resolveEffects(resolved.effects, props.accentColor ?? undefined);

  // ── Phase timing ───────────────────────────────────────────────────────
  const kickerStart = 0;
  const kickerEnd = Math.round(totalFrames * 0.15 * motion.durationMultiplier);
  const revealStart = Math.round(totalFrames * 0.05);
  const revealEnd = Math.round(totalFrames * 0.30 * motion.durationMultiplier);
  const sweepEnd = Math.round(totalFrames * 0.25);
  const accentEntrEnd = Math.round(totalFrames * 0.20);
  const subStart = Math.round(totalFrames * 0.30);
  const subEnd = Math.round(totalFrames * 0.42);
  const glowStart = Math.round(totalFrames * 0.25);
  const glowEnd = Math.round(totalFrames * 0.80);
  const exitStart = Math.round(totalFrames * 0.82);
  const exitEnd = totalFrames;

  const isMainPhase = frame >= revealEnd && frame < exitStart;
  const floatY = motion.microMotionEnabled && isMainPhase ? microFloat(frame).y : 0;

  const exitBlurValue = fx.blurTransition
    ? interpolate(frame, [exitStart, exitEnd], [0, 8], CLAMP)
    : 0;

  // ── Camera drift (continuous) ──────────────────────────────────────────
  const cam = cameraDrift(
    frame,
    { startFrame: 0, endFrame: totalFrames },
    15 * scale,
    8 * scale,
    1.0,
    1.04
  );

  // ── Headline clip reveal ───────────────────────────────────────────────
  const clipDir = REVEAL_MAP[props.revealDirection] || "left";
  const reveal = clipReveal(frame, { startFrame: revealStart, endFrame: revealEnd }, clipDir);

  // ── Kicker entrance ────────────────────────────────────────────────────
  const kicker = props.kicker
    ? fadeIn(frame, { startFrame: kickerStart, endFrame: kickerEnd })
    : null;

  // ── Subheadline entrance ───────────────────────────────────────────────
  const sub = props.subheadline
    ? slideUp(frame, { startFrame: subStart, endFrame: subEnd }, 30)
    : null;

  // ── Glow pulse on accent bar ───────────────────────────────────────────
  const glow = glowPulse(frame, { startFrame: glowStart, endFrame: glowEnd }, 2);

  // ── Exit ───────────────────────────────────────────────────────────────
  const exit = fadeOut(frame, { startFrame: exitStart, endFrame: exitEnd });

  // ── Light sweep ────────────────────────────────────────────────────────
  const sweepX = props.lightSweep
    ? interpolate(frame, [0, sweepEnd], [-30, 130], CLAMP)
    : -100;

  // ── Accent shapes ──────────────────────────────────────────────────────
  const accents = getMoodAccents(props.mood);
  const accentEntrance = fadeIn(frame, { startFrame: 0, endFrame: accentEntrEnd });

  // ── Font sizing ────────────────────────────────────────────────────────
  const rawFontSize = props.headline.length > 40 ? 56 : props.headline.length > 20 ? 72 : 96;
  const baseFontSize = Math.round(rawFontSize * scale);
  const subFontSize = Math.round(baseFontSize * 0.35);
  const kickerFontSize = Math.round(baseFontSize * 0.18);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Background with camera drift */}
      <div
        style={{
          position: "absolute",
          inset: -Math.round(30 * scale) + "px",
          transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})`,
        }}
      >
        <Background config={props.background} />
      </div>

      {/* Accent geometric shapes with parallax */}
      <div style={{ position: "absolute", inset: 0, opacity: exit.opacity }}>
        {accents.map((shape, i) => {
          const prl = parallaxLayer(
            frame,
            { startFrame: 0, endFrame: totalFrames },
            shape.depth,
            40 * scale
          );
          return renderAccent(shape, i, props.accentColor, accentEntrance.opacity, prl.x, scale);
        })}
      </div>

      {/* Light sweep overlay */}
      {props.lightSweep && frame < sweepEnd + 5 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(30deg, transparent ${sweepX - 15}%, rgba(255,255,255,0.06) ${sweepX}%, transparent ${sweepX + 15}%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Content container */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translateY(${floatY}px)`,
          maxWidth: "85%",
          textAlign: "center",
          opacity: exit.opacity,
          boxShadow: fx.boxShadow,
          filter: exitBlurValue > 0 ? `blur(${exitBlurValue}px)` : undefined,
        }}
      >
        {/* Kicker */}
        {kicker && props.kicker && (
          <div
            style={{
              marginBottom: Math.round(baseFontSize * 0.2) + "px",
              opacity: kicker.opacity,
            }}
          >
            <span
              style={{
                fontSize: kickerFontSize + "px",
                fontWeight: typo.fontWeight ?? "bold",
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                color: props.accentColor,
                letterSpacing: typo.letterSpacing ?? "0.2em",
                textTransform: "uppercase",
              }}
            >
              {props.kicker}
            </span>
          </div>
        )}

        {/* Headline with clip reveal */}
        <div
          style={{
            clipPath: reveal.clipPath,
            WebkitClipPath: reveal.clipPath,
          }}
        >
          <span
            style={{
              fontSize: baseFontSize + "px",
              fontWeight: typo.fontWeight ?? "bold",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.headlineColor,
              lineHeight: typo.lineHeight ?? 1.1,
              letterSpacing: typo.letterSpacing ?? "-0.02em",
            }}
          >
            {props.headline}
          </span>
        </div>

        {/* Accent glow bar under headline */}
        <div
          style={{
            margin: Math.round(12 * scale) + "px auto",
            width: Math.round(60 * scale) + "px",
            height: Math.round(3 * scale) + "px",
            backgroundColor: props.accentColor,
            borderRadius: "2px",
            opacity: glow.opacity,
            boxShadow: `0 0 ${glow.spread}px ${props.accentColor}80`,
          }}
        />

        {/* Subheadline */}
        {sub && props.subheadline && (
          <div
            style={{
              marginTop: Math.round(baseFontSize * 0.15) + "px",
              opacity: sub.opacity,
              transform: `translateY(${sub.y}px)`,
            }}
          >
            <span
              style={{
                fontSize: subFontSize + "px",
                fontWeight: typo.fontWeight ?? "normal",
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                color: props.headlineColor + "CC",
                lineHeight: typo.lineHeight ?? 1.4,
              }}
            >
              {props.subheadline}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
