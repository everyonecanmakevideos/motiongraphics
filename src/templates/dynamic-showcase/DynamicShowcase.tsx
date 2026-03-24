import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import {
  secToFrame,
  fadeIn,
  fadeOut,
  slideUp,
  springIn,
  glowPulse,
  staggerCascade,
  microFloat,
  adaptiveEntranceWindow,
} from "../../primitives/animations";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveEffects } from "../../primitives/useEffects";
import { Asset } from "../../assets/Asset";
import type { DynamicShowcaseProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

function renderOrbitElement(
  index: number,
  style: string,
  accentColor: string,
  size: number
): React.ReactNode {
  if (style === "rings") {
    return (
      <div
        style={{
          width: size + "px",
          height: size + "px",
          borderRadius: "50%",
          border: `2px solid ${accentColor}60`,
        }}
      />
    );
  }
  if (style === "mixed") {
    return index % 2 === 0 ? (
      <div
        style={{
          width: size + "px",
          height: size + "px",
          borderRadius: "50%",
          backgroundColor: accentColor + "40",
        }}
      />
    ) : (
      <div
        style={{
          width: size + "px",
          height: size + "px",
          borderRadius: "50%",
          border: `1.5px solid ${accentColor}50`,
        }}
      />
    );
  }
  // dots
  return (
    <div
      style={{
        width: size + "px",
        height: size + "px",
        borderRadius: "50%",
        backgroundColor: accentColor + "50",
      }}
    />
  );
}

export const DynamicShowcase: React.FC<DynamicShowcaseProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, scale } = useResponsiveConfig();

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

  const isLeftFocus = props.layout === "left-focus";

  // ── Phase timing ───────────────────────────────────────────────────────
  const entranceWindow = adaptiveEntranceWindow(props.duration, totalFrames, motion.durationMultiplier, {
    startPct: 0.04,
    minSec: 1.6,
    maxSec: 4.0,
    maxEndPct: 0.7,
  });
  const entranceSpan = Math.max(1, entranceWindow.endFrame - entranceWindow.startFrame);
  const glowFadeEnd = Math.round(entranceWindow.startFrame + entranceSpan * 0.35);
  const iconStart = Math.round(entranceWindow.startFrame + entranceSpan * 0.05);
  const iconEnd = Math.round(entranceWindow.startFrame + entranceSpan * 0.52);
  const orbitEntrStart = Math.round(entranceWindow.startFrame + entranceSpan * 0.18);
  const orbitEntrEnd = Math.round(entranceWindow.startFrame + entranceSpan * 0.9);
  const glowPulseStart = Math.round(entranceWindow.endFrame);
  const glowPulseEnd = Math.round(totalFrames * 0.80);
  const titleStart = Math.round(entranceWindow.startFrame + entranceSpan * 0.82);
  const titleEnd = Math.round(entranceWindow.startFrame + entranceSpan * 0.98);
  const descStart = Math.round(entranceWindow.startFrame + entranceSpan * 0.9);
  const descEnd = Math.round(entranceWindow.endFrame + entranceSpan * 0.08);
  const exitStart = Math.round(totalFrames * 0.82);
  const exitEnd = totalFrames;

  // ── MicroFloat & exit blur ─────────────────────────────────────────────
  const entranceEnd = entranceWindow.endFrame;
  const isMainPhase = frame >= entranceEnd && frame < exitStart;
  const floatY = motion.microMotionEnabled && isMainPhase ? microFloat(frame).y : 0;

  const exitBlur = fx.blurTransition
    ? interpolate(frame, [exitStart, exitEnd], [0, 8], CLAMP)
    : 0;

  // ── Glow background ────────────────────────────────────────────────────
  const glowBgOpacity = fadeIn(frame, { startFrame: 0, endFrame: glowFadeEnd }).opacity;
  const glow = glowPulse(frame, { startFrame: glowPulseStart, endFrame: glowPulseEnd }, 2);
  const glowOp = frame < glowPulseStart ? glowBgOpacity * 0.5 : glow.opacity * 0.5;

  // ── Icon spring entrance ───────────────────────────────────────────────
  const icon = springIn(frame, { startFrame: iconStart, endFrame: iconEnd }, 2);

  // ── Title & description ────────────────────────────────────────────────
  const titleAnim = slideUp(frame, { startFrame: titleStart, endFrame: titleEnd }, 25);
  const descAnim = props.description
    ? fadeIn(frame, { startFrame: descStart, endFrame: descEnd })
    : null;

  // ── Exit ───────────────────────────────────────────────────────────────
  const exit = fadeOut(frame, { startFrame: exitStart, endFrame: exitEnd });

  // ── Orbit ──────────────────────────────────────────────────────────────
  const orbitRadius = Math.round(160 * scale);
  const orbitElementSize = Math.round(10 * scale);
  const orbitSweepDeg = 30; // slow 30-degree rotation over whole duration
  const angleOffset = interpolate(frame, [0, totalFrames], [0, orbitSweepDeg], CLAMP);

  // ── Layout ─────────────────────────────────────────────────────────────
  const focalCenterX = isLeftFocus ? width * 0.35 : width * 0.5;
  const focalCenterY = isLeftFocus ? height * 0.45 : height * 0.4;
  const iconSize = Math.round(120 * scale);
  const titleFontSize = Math.round(44 * scale);
  const descFontSize = Math.round(20 * scale);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} />

      {/* Glow behind focal element */}
      <div
        style={{
          position: "absolute",
          left: focalCenterX - orbitRadius + "px",
          top: focalCenterY - orbitRadius + "px",
          width: orbitRadius * 2 + "px",
          height: orbitRadius * 2 + "px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${props.glowColor}30, transparent 70%)`,
          opacity: glowOp * exit.opacity,
          boxShadow: `0 0 ${glow.spread * 2}px ${props.glowColor}20`,
        }}
      />

      {/* Orbiting accent elements */}
      {Array.from({ length: props.orbitCount }, (_, i) => {
        const baseAngle = (i * 360) / props.orbitCount;
        const angle = ((baseAngle + angleOffset) * Math.PI) / 180;
        const ox = focalCenterX + Math.cos(angle) * orbitRadius;
        const oy = focalCenterY + Math.sin(angle) * orbitRadius;

        const stagger = staggerCascade(i, props.orbitCount, orbitEntrEnd - orbitEntrStart, "center-out");
        const orbitOp = fadeIn(frame, {
          startFrame: orbitEntrStart + stagger.startFrame,
          endFrame: orbitEntrStart + stagger.endFrame,
        }).opacity;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: ox - orbitElementSize / 2 + "px",
              top: oy - orbitElementSize / 2 + "px",
              opacity: orbitOp * exit.opacity,
            }}
          >
            {renderOrbitElement(i, props.orbitStyle, props.accentColor, orbitElementSize)}
          </div>
        );
      })}

      {/* Focal icon */}
      <div
        style={{
          position: "absolute",
          left: focalCenterX - iconSize / 2 + "px",
          top: focalCenterY - iconSize / 2 + "px",
          width: iconSize + "px",
          height: iconSize + "px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: icon.opacity * exit.opacity,
          transform: `scale(${icon.scale})`,
        }}
      >
        <Asset
          id={props.iconId}
          width={Math.round(iconSize * 0.6)}
          height={Math.round(iconSize * 0.6)}
          color={props.accentColor}
        />
      </div>

      {/* Title and description */}
      <div
        style={{
          position: "absolute",
          left: isLeftFocus ? focalCenterX - iconSize + "px" : "50%",
          top: focalCenterY + iconSize * 0.8 + "px",
          transform: isLeftFocus ? `translateY(${floatY}px)` : `translateX(-50%) translateY(${floatY}px)`,
          textAlign: isLeftFocus ? "left" : "center",
          maxWidth: isLeftFocus ? "50%" : "70%",
          opacity: exit.opacity,
          boxShadow: fx.boxShadow,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        <div
          style={{
            opacity: titleAnim.opacity,
            transform: `translateY(${titleAnim.y}px)`,
          }}
        >
          <span
            style={{
              fontSize: titleFontSize + "px",
              fontWeight: typo.fontWeight ?? "bold",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.titleColor,
              lineHeight: typo.lineHeight ?? 1.2,
            }}
          >
            {props.title}
          </span>
        </div>

        {descAnim && props.description && (
          <div
            style={{
              marginTop: Math.round(12 * scale) + "px",
              opacity: descAnim.opacity,
            }}
          >
            <span
              style={{
                fontSize: descFontSize + "px",
                fontWeight: typo.fontWeight ?? "normal",
                fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                color: props.titleColor + "BB",
                lineHeight: typo.lineHeight ?? 1.5,
              }}
            >
              {props.description}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
