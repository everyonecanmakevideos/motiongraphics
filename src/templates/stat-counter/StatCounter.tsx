import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import {
  phaseFrames,
  countUp,
  fadeIn,
  scalePop,
  choreograph,
} from "../../primitives/animations";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveEffects } from "../../primitives/useEffects";
import { resolveSecondaryMotion } from "../../primitives/useSecondaryMotion";
import { DecorativeLayer } from "../../primitives/DecorativeLayer";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { StatCounterProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const StatCounter: React.FC<StatCounterProps> = (props) => {
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
  const fx = resolveEffects(resolved.effects, props.accentColor ?? undefined);

  // ── Adaptive phase timing ──────────────────────────────────────────────
  const phases = phaseFrames(props.duration, props.pacingProfile);

  // ── Choreographed entrance ─────────────────────────────────────────────
  const entranceDur = phases.entrance.endFrame + Math.round((phases.main.endFrame - phases.main.startFrame) * 0.3);
  const seq = choreograph(0, [
    { id: "number", startOffset: 0, duration: entranceDur },
    { id: "label", startOffset: Math.round(entranceDur * 0.2), duration: Math.round(entranceDur * 0.5) },
  ]);

  const numberRange = seq.get("number")!;
  const labelRange = seq.get("label")!;

  const exitOpacity = interpolate(frame, [phases.exit.startFrame, phases.exit.endFrame], [1, 0], CLAMP);
  const exitBlur = fx.blurTransition
    ? interpolate(frame, [phases.exit.startFrame, phases.exit.endFrame], [0, 8], CLAMP)
    : 0;

  // ── Secondary motion during main phase ─────────────────────────────────
  const secondaryM = resolveSecondaryMotion(frame, phases.main, props.secondaryMotion);

  // Value size multiplier
  const valueSizeMultiplier = props.valueSize === "medium" ? 0.7 : props.valueSize === "xlarge" ? 1.4 : 1;

  // Number display
  let displayValue = props.value;
  let numberOpacity = 1;
  let numberScale = 1;

  if (props.entranceAnimation === "count-up") {
    displayValue = countUp(frame, numberRange, 0, props.value);
    numberOpacity = interpolate(frame, [0, Math.round(numberRange.endFrame * 0.1)], [0, 1], CLAMP);
  } else if (props.entranceAnimation === "fade-in") {
    const f = fadeIn(frame, { startFrame: 0, endFrame: Math.round(numberRange.endFrame * 0.4) });
    numberOpacity = f.opacity;
  } else if (props.entranceAnimation === "scale-pop") {
    const p = scalePop(frame, { startFrame: 0, endFrame: Math.round(numberRange.endFrame * 0.5) }, 1.15);
    numberOpacity = p.opacity;
    numberScale = p.scale;
  }

  // Label animation
  const labelOpacity = interpolate(frame, [labelRange.startFrame, labelRange.endFrame], [0, 1], CLAMP);
  const labelY = interpolate(frame, [labelRange.startFrame, labelRange.endFrame], [20, 0], CLAMP);

  // Format number
  const formatted = Math.abs(displayValue).toLocaleString("en-US");
  const sign = props.value < 0 && displayValue !== 0 ? "-" : "";
  const numberText = props.prefix + sign + formatted + props.suffix;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} frame={frame} />

      <DecorativeLayer
        theme={props.decorativeTheme ?? "none"}
        accentColor={props.accentColor ?? props.valueColor}
        frame={frame}
        totalFrames={phases.total}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translateY(${secondaryM.y}px) translateX(${secondaryM.x}px) scale(${secondaryM.scale}) rotate(${secondaryM.rotation}deg)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: exitOpacity,
          boxShadow: fx.boxShadow,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        <div
          style={{
            fontSize: Math.round(140 * scale * valueSizeMultiplier) + "px",
            fontWeight: typo.fontWeight ?? "bold",
            fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
            color: props.valueColor,
            lineHeight: typo.lineHeight ?? 1,
            opacity: numberOpacity,
            transform: "scale(" + numberScale + ")",
            letterSpacing: typo.letterSpacing ?? "-0.02em",
          }}
        >
          {numberText}
        </div>

        {props.accentColor && (
          <div
            style={{
              width: "80px",
              height: "4px",
              backgroundColor: props.accentColor,
              marginTop: "16px",
              borderRadius: "2px",
            }}
          />
        )}

        {props.label && (
          <div
            style={{
              fontSize: Math.round(36 * scale) + "px",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.labelColor,
              marginTop: "20px",
              opacity: labelOpacity,
              transform: "translateY(" + labelY + "px)",
            }}
          >
            {props.label}
          </div>
        )}

        {props.sublabel && (
          <div
            style={{
              fontSize: Math.round(22 * scale) + "px",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              color: props.labelColor,
              marginTop: "10px",
              opacity: labelOpacity * 0.7,
              transform: "translateY(" + labelY + "px)",
            }}
          >
            {props.sublabel}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
