import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { StreamStartProps } from "./schema";
import { Background } from "../../primitives/Background";
import { phaseFrames, fadeIn, slideUp, slideLeft, slideRight, scalePop, blurReveal } from "../../primitives/animations";
import { resolveStylePreset } from "../../primitives/useStylePreset";
import { resolveTypography } from "../../primitives/useTypography";
import { resolveEffects } from "../../primitives/useEffects";
import { DecorativeLayer } from "../../primitives/DecorativeLayer";
import { useResponsiveConfig } from "../../primitives/useResponsiveConfig";

function applyEntrance(
  frame: number,
  preset: string,
  range: { startFrame: number; endFrame: number },
): { opacity: number; x: number; y: number; scale: number; blur: number } {
  if (preset === "none") return { opacity: 1, x: 0, y: 0, scale: 1, blur: 0 };
  const dur = range.endFrame - range.startFrame;
  if (dur <= 0) return { opacity: 1, x: 0, y: 0, scale: 1, blur: 0 };

  if (preset === "fade-in") {
    const f = fadeIn(frame, range);
    return { opacity: f.opacity, x: 0, y: 0, scale: f.scale, blur: 0 };
  }
  if (preset === "slide-up") {
    const s = slideUp(frame, range, 50);
    return { opacity: s.opacity, x: 0, y: s.y, scale: 1, blur: 0 };
  }
  if (preset === "slide-left") {
    const s = slideLeft(frame, range, 70);
    return { opacity: s.opacity, x: s.x, y: 0, scale: 1, blur: 0 };
  }
  if (preset === "slide-right") {
    const s = slideRight(frame, range, 70);
    return { opacity: s.opacity, x: s.x, y: 0, scale: 1, blur: 0 };
  }
  if (preset === "scale-pop") {
    const p = scalePop(frame, range, 1.12);
    return { opacity: p.opacity, x: 0, y: 0, scale: p.scale, blur: 0 };
  }
  if (preset === "blur-reveal") {
    const b = blurReveal(frame, range, 10);
    return { opacity: b.opacity, x: 0, y: 0, scale: b.scale, blur: b.blur };
  }
  return { opacity: 1, x: 0, y: 0, scale: 1, blur: 0 };
}

export const StreamStart: React.FC<StreamStartProps> = (props) => {
  const frame = useCurrentFrame();
  const { scale } = useResponsiveConfig();

  const resolved = resolveStylePreset(
    props.stylePreset,
    props.typography,
    props.motionStyle,
    props.effects,
  );
  const typo = resolveTypography(resolved.typography);
  // Use badgeColor as a reasonable accent for glow/shadow.
  const fx = resolveEffects(resolved.effects, props.badgeColor);

  const phases = phaseFrames(props.duration, props.pacingProfile);
  const entranceDur = phases.entrance.endFrame;

  const bannerRange = { startFrame: 0, endFrame: entranceDur };
  const entrance = applyEntrance(frame, props.entranceAnimation, bannerRange);

  const blink = frame % 12 < 6 ? 1 : 0.35;

  const headlineOpacity = entrance.opacity;
  const headlineEStyle: React.CSSProperties = {
    opacity: headlineOpacity,
    transform: `translateX(${entrance.x}px) translateY(${entrance.y}px) scale(${entrance.scale})`,
    filter: entrance.blur > 0 ? `blur(${entrance.blur}px)` : undefined,
  };

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background config={props.background} frame={frame} />
      <DecorativeLayer
        theme={props.decorativeTheme ?? "none"}
        accentColor={props.badgeColor}
        frame={frame}
        totalFrames={phases.total}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%)`,
          width: "92%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: Math.round(20 * scale),
          ...headlineEStyle,
        }}
      >
        {props.showLiveBadge && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: Math.round(10 * scale),
              padding: `${Math.round(10 * scale)}px ${Math.round(16 * scale)}px`,
              borderRadius: Math.round(9999 * scale),
              background: "rgba(0,0,0,0.55)",
              border: `2px solid ${props.badgeColor}`,
              color: "#FFFFFF",
              fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
              fontWeight: 900,
              letterSpacing: "0.06em",
              boxShadow: fx.boxShadow,
              filter: fx.glowFilter !== "none" ? fx.glowFilter : undefined,
              opacity: blink,
            }}
          >
            <span
              style={{
                width: Math.round(10 * scale),
                height: Math.round(10 * scale),
                borderRadius: 9999,
                background: props.badgeColor,
                boxShadow: `0 0 ${Math.round(18 * scale)}px ${props.badgeColor}`,
              }}
            />
            {props.badgeText}
          </div>
        )}

        <div
          style={{
            fontSize: Math.round(88 * scale),
            fontFamily: typo.fontFamily ?? "Arial, Helvetica, sans-serif",
            fontWeight: typo.fontWeight ?? 800,
            letterSpacing: typo.letterSpacing ?? "normal",
            lineHeight: 1.02,
            color: props.headlineColor,
            textTransform: "uppercase",
            textShadow: `0 0 ${Math.round(18 * scale)}px ${props.badgeColor}55`,
          }}
        >
          {props.headline}
        </div>
      </div>
    </AbsoluteFill>
  );
};

