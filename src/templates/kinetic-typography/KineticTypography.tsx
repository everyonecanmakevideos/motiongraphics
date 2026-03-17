import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../../primitives/Background";
import {
  secToFrame,
  staggerDelay,
  fadeIn,
  slideUp,
  scalePop,
  blurReveal,
  typewriter,
} from "../../primitives/animations";
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
  const totalFrames = secToFrame(props.duration);

  const entranceFrames = Math.round(totalFrames * 0.6);
  const exitStart = Math.round(totalFrames * 0.82);
  const exitOpacity = interpolate(frame, [exitStart, totalFrames], [1, 0], CLAMP);

  // Build items to animate (lines or words depending on staggerStyle)
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
      <Background config={props.background} />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: props.alignment === "center" ? "center" : props.alignment === "right" ? "flex-end" : "flex-start",
          maxWidth: "85%",
          opacity: exitOpacity,
        }}
      >
        {props.staggerStyle === "word-by-word" ? (
          // Word-by-word: render as wrapped flex lines
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
                    fontWeight: props.fontWeight === "black" ? 900 : props.fontWeight === "bold" ? 700 : 400,
                    fontFamily: "Arial, Helvetica, sans-serif",
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
          // Line-by-line or all-at-once
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
                  fontWeight: props.fontWeight === "black" ? 900 : props.fontWeight === "bold" ? 700 : 400,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  color: item.color,
                  lineHeight: props.lineSpacing,
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
