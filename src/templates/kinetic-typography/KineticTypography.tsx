import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import {
  phaseFrames,
  staggerDelay,
  fadeIn,
  slideUp,
  scalePop,
  blurReveal,
  typewriter,
} from "../../primitives/animations";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveMotionStyle } from "../../primitives/useMotionStyle";
import { resolveEffects } from "../../primitives/useEffects";
import { resolveSecondaryMotion } from "../../primitives/useSecondaryMotion";
import { DecorativeLayer } from "../../primitives/DecorativeLayer";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";
import type { KineticTypographyProps } from "./schema";

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

function applyAnimation(
  frame: number,
  preset: string,
  startFrame: number,
  endFrame: number,
  textLength: number
): { opacity: number; scale: number; y: number; blur: number; chars: number } {
  const range = { startFrame, endFrame };
  const result = { opacity: 1, scale: 1, y: 0, blur: 0, chars: textLength };

  if (preset === "fade-in") {
    result.opacity = fadeIn(frame, range).opacity;
  } else if (preset === "slide-up") {
    const s = slideUp(frame, range, 40);
    result.opacity = s.opacity;
    result.y = s.y;
  } else if (preset === "scale-pop") {
    const p = scalePop(frame, range, 1.12);
    result.opacity = p.opacity;
    result.scale = p.scale;
  } else if (preset === "blur-reveal") {
    const b = blurReveal(frame, range, 10);
    result.opacity = b.opacity;
    result.scale = b.scale;
    result.blur = b.blur;
  } else if (preset === "typewriter") {
    result.chars = typewriter(frame, range, textLength);
  }
  return result;
}

export const KineticTypography: React.FC<KineticTypographyProps> = (props) => {
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
  const fx = resolveEffects(resolved.effects);

  // ── Adaptive phase timing ──────────────────────────────────────────────
  const phases = phaseFrames(props.duration, props.pacingProfile);

  const entranceFrames = Math.round((phases.entrance.endFrame + phases.main.startFrame) * 0.8 * motion.durationMultiplier);
  const exitOpacity = interpolate(frame, [phases.exit.startFrame, phases.exit.endFrame], [1, 0], CLAMP);
  const exitBlur = fx.blurTransition
    ? interpolate(frame, [phases.exit.startFrame, phases.exit.endFrame], [0, 8], CLAMP)
    : 0;

  // ── Secondary motion during main phase ─────────────────────────────────
  const secondaryM = resolveSecondaryMotion(frame, phases.main, props.secondaryMotion);

  // Build items to animate
  const items: Array<{ text: string; color: string; lineIndex: number }> = [];

  if (props.staggerStyle === "word-by-word") {
    props.lines.forEach((line, li) => {
      const color = props.lineColors?.[li] ?? props.defaultColor;
      line.split(/\s+/).forEach((word) => {
        items.push({ text: word, color, lineIndex: li });
      });
    });
  } else {
    props.lines.forEach((line, li) => {
      const color = props.lineColors?.[li] ?? props.defaultColor;
      items.push({ text: line, color, lineIndex: li });
    });
  }

  const isAllAtOnce = props.staggerStyle === "all-at-once";

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} frame={frame} />

      <DecorativeLayer
        theme={props.decorativeTheme ?? "none"}
        accentColor={props.defaultColor}
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
          alignItems: props.alignment === "center" ? "center" : props.alignment === "right" ? "flex-end" : "flex-start",
          maxWidth: "85%",
          opacity: exitOpacity,
          boxShadow: fx.boxShadow,
          filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        }}
      >
        {props.staggerStyle === "word-by-word" ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: props.alignment === "center" ? "center" : props.alignment === "right" ? "flex-end" : "flex-start",
              gap: "0 " + Math.round(props.fontSize * 0.35) + "px",
              lineHeight: props.lineSpacing,
            }}
          >
            {items.map((item, i) => {
              const range = isAllAtOnce
                ? { startFrame: 0, endFrame: Math.round(entranceFrames * 0.5) }
                : staggerDelay(i, items.length, entranceFrames);
              const a = applyAnimation(frame, props.entranceAnimation, range.startFrame, range.endFrame, item.text.length);
              const displayText = props.entranceAnimation === "typewriter" ? item.text.slice(0, a.chars) : item.text;

              return (
                <span
                  key={i}
                  style={{
                    fontSize: Math.round(props.fontSize * scale) + "px",
                    fontWeight: typo.fontWeight ?? (props.fontWeight === "black" ? 900 : props.fontWeight === "bold" ? 700 : 400),
                    fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                    color: item.color,
                    opacity: a.opacity,
                    transform: "translateY(" + a.y + "px) scale(" + a.scale + ")",
                    filter: a.blur > 0 ? "blur(" + a.blur + "px)" : "none",
                    display: "inline-block",
                  }}
                >
                  {displayText}
                </span>
              );
            })}
          </div>
        ) : (
          items.map((item, i) => {
            const range = isAllAtOnce
              ? { startFrame: 0, endFrame: Math.round(entranceFrames * 0.4) }
              : staggerDelay(i, items.length, entranceFrames);
            const a = applyAnimation(frame, props.entranceAnimation, range.startFrame, range.endFrame, item.text.length);
            const displayText = props.entranceAnimation === "typewriter" ? item.text.slice(0, a.chars) : item.text;

            return (
              <div
                key={i}
                style={{
                  fontSize: Math.round(props.fontSize * scale) + "px",
                  fontWeight: typo.fontWeight ?? (props.fontWeight === "black" ? 900 : props.fontWeight === "bold" ? 700 : 400),
                  fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
                  color: item.color,
                  lineHeight: typo.lineHeight ?? props.lineSpacing,
                  letterSpacing: typo.letterSpacing ?? undefined,
                  opacity: a.opacity,
                  transform: "translateY(" + a.y + "px) scale(" + a.scale + ")",
                  filter: a.blur > 0 ? "blur(" + a.blur + "px)" : "none",
                }}
              >
                {displayText}
              </div>
            );
          })
        )}
      </div>
    </AbsoluteFill>
  );
};
