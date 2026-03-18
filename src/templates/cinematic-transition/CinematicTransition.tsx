import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import {
  secToFrame,
  fadeIn,
  scalePop,
  springIn,
  microFloat,
} from "../../primitives/animations";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveEffects } from "../../primitives/useEffects";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { CinematicTransitionProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const SPEED_MAP: Record<string, number> = { slow: 0.9, normal: 1.0, fast: 0.7 };

export const CinematicTransition: React.FC<CinematicTransitionProps> = (props) => {
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
  const fx = resolveEffects(resolved.effects);

  const speedFactor = SPEED_MAP[props.speed] || 1.0;

  // ── Phase boundaries ───────────────────────────────────────────────────
  const wipeInEnd = Math.round(totalFrames * 0.4 * speedFactor * motion.durationMultiplier);
  const holdStart = wipeInEnd;
  const holdEnd = Math.round(totalFrames * 0.6);
  const wipeOutStart = holdEnd;
  const wipeOutEnd = Math.round(totalFrames * (0.6 + 0.4 * speedFactor));

  // ── Wipe progress ──────────────────────────────────────────────────────
  const wipeIn = interpolate(frame, [0, wipeInEnd], [0, 1], CLAMP);
  const wipeOut = interpolate(frame, [wipeOutStart, wipeOutEnd], [0, 1], CLAMP);

  // ── Label animation ────────────────────────────────────────────────────
  const labelStart = holdStart + Math.round((holdEnd - holdStart) * 0.1);
  const labelEnd = holdEnd - Math.round((holdEnd - holdStart) * 0.1);
  let labelScale = 1;
  let labelOpacity = 0;
  if (props.sectionLabel) {
    if (props.labelAnimation === "spring") {
      const sp = springIn(frame, { startFrame: labelStart, endFrame: labelEnd }, 2);
      labelScale = sp.scale;
      labelOpacity = sp.opacity;
    } else if (props.labelAnimation === "scale-pop") {
      const sp = scalePop(frame, { startFrame: labelStart, endFrame: labelEnd }, 1.2);
      labelScale = sp.scale;
      labelOpacity = sp.opacity;
    } else {
      labelOpacity = fadeIn(frame, { startFrame: labelStart, endFrame: labelEnd }).opacity;
    }
    // Fade label out before wipe exits
    const labelFade = interpolate(frame, [holdEnd - 5, holdEnd], [1, 0], CLAMP);
    labelOpacity *= labelFade;
  }

  // ── Compute wipe clip/transform ────────────────────────────────────────
  function getWipeStyle(): React.CSSProperties {
    const style = props.transitionStyle;

    if (style === "wipe-horizontal") {
      const enterRight = wipeIn * 100;
      const exitRight = wipeOut * 100;
      return {
        position: "absolute",
        top: 0,
        left: -exitRight + "%",
        width: "100%",
        height: "100%",
        clipPath: `inset(0 ${100 - enterRight}% 0 0)`,
      };
    }
    if (style === "wipe-vertical") {
      const enterBot = wipeIn * 100;
      const exitBot = wipeOut * 100;
      return {
        position: "absolute",
        left: 0,
        top: -exitBot + "%",
        width: "100%",
        height: "100%",
        clipPath: `inset(0 0 ${100 - enterBot}% 0)`,
      };
    }
    if (style === "diagonal") {
      const x = wipeIn * 200 - 50;
      const exitX = wipeOut * 100;
      return {
        position: "absolute",
        top: 0,
        left: -exitX + "%",
        width: "100%",
        height: "100%",
        clipPath: `polygon(${x - 30}% 0%, ${x + 30}% 0%, ${x}% 100%, ${x - 60}% 100%)`,
      };
    }
    if (style === "iris") {
      const radius = wipeIn * 80;
      const exitRadius = frame >= wipeOutStart ? 80 + wipeOut * 80 : radius;
      return {
        position: "absolute",
        inset: 0,
        clipPath: `circle(${exitRadius}% at 50% 50%)`,
      };
    }
    // split
    const half = (1 - wipeIn) * 50;
    const exitHalf = wipeOut * 50;
    return {
      position: "absolute",
      inset: 0,
      clipPath: `inset(0 ${half + exitHalf}% 0 ${half + exitHalf}%)`,
    };
  }

  // ── Trail lines ────────────────────────────────────────────────────────
  function renderTrails(): React.ReactNode {
    if (!props.trailEffect || frame > wipeOutEnd) return null;
    const count = 3;
    return Array.from({ length: count }, (_, i) => {
      const delay = (i + 1) * 3;
      const trailOpacity = interpolate(
        frame,
        [delay, wipeInEnd + delay],
        [0, 0.15 - i * 0.04],
        CLAMP
      );
      const trailFade = interpolate(
        frame,
        [wipeOutStart, wipeOutEnd],
        [1, 0],
        CLAMP
      );
      if (props.transitionStyle === "wipe-horizontal") {
        const x = interpolate(frame - delay, [0, wipeInEnd], [0, 100], CLAMP);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left: x - 1 + "%",
              width: "2px",
              height: "100%",
              backgroundColor: props.wipeColor,
              opacity: trailOpacity * trailFade,
            }}
          />
        );
      }
      return null;
    });
  }

  const wipeStyle = getWipeStyle();
  const isWipeCovering = frame >= wipeInEnd && frame < wipeOutStart;
  const labelFontSize = Math.round(32 * scale);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Background before */}
      <Background config={props.background} />

      {/* Background after (revealed when wipe exits) */}
      {frame >= wipeOutStart && (
        <div style={{ position: "absolute", inset: 0 }}>
          <Background config={props.backgroundAfter} />
        </div>
      )}

      {/* Wipe shape */}
      <div
        style={{
          ...wipeStyle,
          backgroundColor: props.wipeColor,
        }}
      />

      {/* Trail lines */}
      {renderTrails()}

      {/* Section label (during hold phase) */}
      {props.sectionLabel && isWipeCovering && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
            boxShadow: fx.boxShadow,
          }}
        >
          <span
            style={{
              fontSize: labelFontSize + "px",
              fontWeight: typo.fontWeight ?? "bold",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.labelColor,
              letterSpacing: typo.letterSpacing ?? "0.15em",
              textTransform: "uppercase",
              opacity: labelOpacity,
              transform: `scale(${labelScale})`,
            }}
          >
            {props.sectionLabel}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
