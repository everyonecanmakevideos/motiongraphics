import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import {
  secToFrame,
  fadeIn,
  fadeOut,
  slideUp,
  clipReveal,
  parallaxLayer,
  staggerCascade,
  microFloat,
} from "../../primitives/animations";
import type { ClipDirection } from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveEffects } from "../../primitives/useEffects";
import type { ParallaxShowcaseProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const DEPTH_PX: Record<string, number> = { subtle: 20, medium: 40, strong: 70 };

interface FgElement {
  x: string;
  y: string;
  size: number;
  type: "circle" | "line" | "triangle" | "rectangle";
  rotation: number;
}

function getForegroundElements(style: string, seed: number): FgElement[] {
  // Deterministic positions using simple hash
  const hash = (i: number) => ((seed * 9301 + i * 49297) % 233280) / 233280;

  if (style === "dots") {
    return Array.from({ length: 7 }, (_, i) => ({
      x: (10 + hash(i) * 80) + "%",
      y: (10 + hash(i + 100) * 80) + "%",
      size: 6 + Math.round(hash(i + 200) * 8),
      type: "circle" as const,
      rotation: 0,
    }));
  }
  if (style === "lines") {
    return Array.from({ length: 4 }, (_, i) => ({
      x: (15 + hash(i) * 70) + "%",
      y: (15 + hash(i + 100) * 70) + "%",
      size: 40 + Math.round(hash(i + 200) * 60),
      type: "line" as const,
      rotation: Math.round(hash(i + 300) * 180 - 90),
    }));
  }
  // geometric
  const types: Array<"circle" | "triangle" | "rectangle"> = ["circle", "triangle", "rectangle"];
  return Array.from({ length: 6 }, (_, i) => ({
    x: (10 + hash(i) * 80) + "%",
    y: (10 + hash(i + 100) * 80) + "%",
    size: 8 + Math.round(hash(i + 200) * 16),
    type: types[i % 3],
    rotation: Math.round(hash(i + 300) * 360),
  }));
}

function renderFgElement(el: FgElement, accentColor: string, scale: number): React.ReactNode {
  const s = Math.round(el.size * scale);
  if (el.type === "circle") {
    return (
      <div
        style={{
          width: s + "px",
          height: s + "px",
          borderRadius: "50%",
          backgroundColor: accentColor + "35",
        }}
      />
    );
  }
  if (el.type === "line") {
    return (
      <div
        style={{
          width: s + "px",
          height: "2px",
          backgroundColor: accentColor + "30",
          transform: `rotate(${el.rotation}deg)`,
        }}
      />
    );
  }
  if (el.type === "triangle") {
    const half = Math.round(s / 2);
    return (
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: half + "px solid transparent",
          borderRight: half + "px solid transparent",
          borderBottom: s + "px solid " + accentColor + "25",
          transform: `rotate(${el.rotation}deg)`,
        }}
      />
    );
  }
  // rectangle
  return (
    <div
      style={{
        width: s + "px",
        height: Math.round(s * 0.6) + "px",
        border: `1.5px solid ${accentColor}30`,
        borderRadius: "3px",
        transform: `rotate(${el.rotation}deg)`,
      }}
    />
  );
}

export const ParallaxShowcase: React.FC<ParallaxShowcaseProps> = (props) => {
  const frame = useCurrentFrame();
  const { scale } = useResponsiveConfig();

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

  const totalFrames = secToFrame(props.duration);

  const basePx = DEPTH_PX[props.depthIntensity] || 40;
  const fullRange = { startFrame: 0, endFrame: totalFrames };

  // ── Phase timing ───────────────────────────────────────────────────────
  const entrEnd = Math.round(totalFrames * 0.25 * motion.durationMultiplier);
  const fgEntrStart = Math.round(totalFrames * 0.05);
  const fgEntrEnd = Math.round(totalFrames * 0.25);
  const contentEntrStart = Math.round(totalFrames * 0.12);
  const contentEntrEnd = Math.round(totalFrames * 0.30);
  const subtitleStart = Math.round(totalFrames * 0.28);
  const subtitleEnd = Math.round(totalFrames * 0.38);
  const descStart = Math.round(totalFrames * 0.34);
  const descEnd = Math.round(totalFrames * 0.44);
  const exitStart = Math.round(totalFrames * 0.82);
  const exitEnd = totalFrames;

  // ── MicroFloat & exit blur ─────────────────────────────────────────────
  const isMainPhase = frame >= contentEntrEnd && frame < exitStart;
  const floatY = motion.microMotionEnabled && isMainPhase ? microFloat(frame).y : 0;

  const exitBlur = fx.blurTransition
    ? interpolate(frame, [exitStart, exitEnd], [0, 8], CLAMP)
    : 0;

  // ── Parallax layers ────────────────────────────────────────────────────
  const dirMultiplier = props.parallaxDirection === "right" ? -1 : 1;
  const isVertical = props.parallaxDirection === "up";

  function getParallax(depth: number): { x: number; y: number } {
    const prl = parallaxLayer(frame, fullRange, depth, basePx * scale);
    if (isVertical) return { x: 0, y: prl.x * dirMultiplier };
    return { x: prl.x * dirMultiplier, y: 0 };
  }

  const bgPrl = getParallax(0.1);
  const midPrl = getParallax(0.3);
  const contentPrl = getParallax(0.5);

  // ── Far background decorative blob ─────────────────────────────────────
  const bgBlobOpacity = fadeIn(frame, { startFrame: 0, endFrame: entrEnd }).opacity;

  // ── Content entrance ───────────────────────────────────────────────────
  let contentOpacity = 1;
  let contentY = 0;
  let contentClip: string | undefined;
  if (props.entranceAnimation === "clip-reveal") {
    const cr = clipReveal(frame, { startFrame: contentEntrStart, endFrame: contentEntrEnd }, "left" as ClipDirection);
    contentClip = cr.clipPath;
    contentOpacity = 1;
  } else if (props.entranceAnimation === "slide-up") {
    const s = slideUp(frame, { startFrame: contentEntrStart, endFrame: contentEntrEnd }, 40);
    contentOpacity = s.opacity;
    contentY = s.y;
  } else {
    contentOpacity = fadeIn(frame, { startFrame: contentEntrStart, endFrame: contentEntrEnd }).opacity;
  }

  // ── Subtitle & description ─────────────────────────────────────────────
  const subtitleAnim = props.subtitle
    ? slideUp(frame, { startFrame: subtitleStart, endFrame: subtitleEnd }, 20)
    : null;
  const descAnim = props.description
    ? fadeIn(frame, { startFrame: descStart, endFrame: descEnd })
    : null;

  // ── Exit ───────────────────────────────────────────────────────────────
  const exit = fadeOut(frame, { startFrame: exitStart, endFrame: exitEnd });

  // ── Foreground elements ────────────────────────────────────────────────
  const fgElements = getForegroundElements(props.foregroundStyle, 42);

  // ── Font sizing ────────────────────────────────────────────────────────
  const titleFontSize = Math.round(72 * scale);
  const subtitleFontSize = Math.round(28 * scale);
  const descFontSize = Math.round(20 * scale);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Far background layer (depth 0.1) */}
      <div
        style={{
          position: "absolute",
          inset: -Math.round(basePx * scale) + "px",
          transform: `translate(${bgPrl.x}px, ${bgPrl.y}px)`,
        }}
      >
        <Background config={props.background} />

        {/* Large blurred decorative blob */}
        <div
          style={{
            position: "absolute",
            right: "10%",
            top: "20%",
            width: Math.round(300 * scale) + "px",
            height: Math.round(300 * scale) + "px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${props.accentColor}15, transparent 70%)`,
            filter: `blur(${Math.round(40 * scale)}px)`,
            opacity: bgBlobOpacity,
          }}
        />
      </div>

      {/* Mid background layer (depth 0.3) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${midPrl.x}px, ${midPrl.y}px)`,
          opacity: exit.opacity,
        }}
      >
        {/* Decorative mid-layer shapes */}
        <div
          style={{
            position: "absolute",
            left: "70%",
            top: "60%",
            width: Math.round(80 * scale) + "px",
            height: Math.round(80 * scale) + "px",
            borderRadius: "50%",
            border: `2px solid ${props.accentColor}20`,
            opacity: bgBlobOpacity,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "20%",
            top: "25%",
            width: Math.round(100 * scale) + "px",
            height: "1.5px",
            backgroundColor: props.accentColor + "18",
            transform: "rotate(-20deg)",
            opacity: bgBlobOpacity,
          }}
        />
      </div>

      {/* Content plane (depth 0.5) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(calc(-50% + ${contentPrl.x}px), calc(-50% + ${contentPrl.y + floatY}px))`,
          maxWidth: "80%",
          textAlign: "center",
          opacity: exit.opacity,
          boxShadow: fx.boxShadow,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        {/* Title */}
        <div
          style={{
            opacity: contentOpacity,
            transform: `translateY(${contentY}px)`,
            clipPath: contentClip,
            WebkitClipPath: contentClip,
          }}
        >
          <span
            style={{
              fontSize: titleFontSize + "px",
              fontWeight: typo.fontWeight ?? "bold",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.titleColor,
              lineHeight: typo.lineHeight ?? 1.1,
              letterSpacing: typo.letterSpacing ?? "-0.02em",
            }}
          >
            {props.title}
          </span>
        </div>

        {/* Subtitle */}
        {subtitleAnim && props.subtitle && (
          <div
            style={{
              marginTop: Math.round(16 * scale) + "px",
              opacity: subtitleAnim.opacity,
              transform: `translateY(${subtitleAnim.y}px)`,
            }}
          >
            <span
              style={{
                fontSize: subtitleFontSize + "px",
                fontWeight: typo.fontWeight ?? "normal",
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                color: props.titleColor + "CC",
                lineHeight: typo.lineHeight ?? 1.4,
              }}
            >
              {props.subtitle}
            </span>
          </div>
        )}

        {/* Description */}
        {descAnim && props.description && (
          <div
            style={{
              marginTop: Math.round(12 * scale) + "px",
              opacity: descAnim.opacity,
              maxWidth: "70%",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <span
              style={{
                fontSize: descFontSize + "px",
                fontWeight: typo.fontWeight ?? "normal",
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                color: props.titleColor + "99",
                lineHeight: typo.lineHeight ?? 1.6,
              }}
            >
              {props.description}
            </span>
          </div>
        )}
      </div>

      {/* Foreground accents (depth 0.8) */}
      {fgElements.map((el, i) => {
        const fgPrl = getParallax(0.8);
        const stagger = staggerCascade(i, fgElements.length, fgEntrEnd - fgEntrStart, "center-out");
        const elOpacity = fadeIn(frame, {
          startFrame: fgEntrStart + stagger.startFrame,
          endFrame: fgEntrStart + stagger.endFrame,
        }).opacity;
        // Foreground exits first for "pulling away" feel
        const fgExit = fadeOut(frame, {
          startFrame: exitStart - Math.round((exitEnd - exitStart) * 0.3),
          endFrame: exitStart,
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: el.x,
              top: el.y,
              transform: `translate(${fgPrl.x}px, ${fgPrl.y}px)`,
              opacity: elOpacity * fgExit.opacity,
            }}
          >
            {renderFgElement(el, props.accentColor, scale)}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
