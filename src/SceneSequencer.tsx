import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { TemplateRouter } from "./TemplateRouter";
import { CompositeScene } from "./CompositeScene";
import type { BackgroundConfig } from "./templates/types";

// ── Types ─────────────────────────────────────────────────────────────────

interface RegionData {
  templateId: string;
  params: Record<string, unknown>;
}

interface SceneData {
  // Single template:
  templateId?: string;
  params?: Record<string, unknown>;

  // Composite:
  layout?: string;
  regions?: RegionData[];
  background?: BackgroundConfig;

  // Frame timing:
  durationFrames: number;
  startFrame: number;
  transition:
    | "cut"
    | "crossfade"
    | "fade-through-black"
    | "wipe-left"
    | "wipe-right"
    | "slide-left"
    | "slide-right"
    | "zoom"
    | "glitch-cut";
  transitionDurationFrames: number;
}

export interface SceneSequencerProps {
  scenes?: SceneData[];
}

// ── Transition Wrapper ────────────────────────────────────────────────────

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const SceneWithTransition: React.FC<{
  scene: SceneData;
  isLast: boolean;
  children: React.ReactNode;
}> = ({ scene, isLast, children }) => {
  const frame = useCurrentFrame(); // relative to this Sequence
  const dur = scene.durationFrames;
  const tFrames = scene.transitionDurationFrames;

  if (scene.transition === "cut") {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  if (scene.transition === "crossfade") {
    // Fade in over first tFrames, fade out over last tFrames
    const fadeIn = interpolate(frame, [0, tFrames], [0, 1], CLAMP);
    const fadeOut = isLast ? 1 : interpolate(frame, [dur - tFrames, dur], [1, 0], CLAMP);
    return (
      <AbsoluteFill style={{ opacity: fadeIn * fadeOut }}>
        {children}
      </AbsoluteFill>
    );
  }

  if (scene.transition === "fade-through-black") {
    // Fade in from black, fade out to black
    const fadeIn = interpolate(frame, [0, tFrames], [0, 1], CLAMP);
    const fadeOut = isLast ? 1 : interpolate(frame, [dur - tFrames, dur], [1, 0], CLAMP);
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{ backgroundColor: "#000000" }} />
        <AbsoluteFill style={{ opacity: fadeIn * fadeOut }}>
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  if (scene.transition === "wipe-left" || scene.transition === "wipe-right") {
    const fadeIn = interpolate(frame, [0, tFrames], [0, 1], CLAMP);
    const fadeOut = isLast ? 1 : interpolate(frame, [dur - tFrames, dur], [1, 0], CLAMP);
    const dir = scene.transition === "wipe-left" ? 1 : -1;
    const clipStart = interpolate(frame, [0, tFrames], [100, 0], CLAMP);
    const clipEnd = isLast ? 0 : interpolate(frame, [dur - tFrames, dur], [0, 100], CLAMP);
    const insetLeft = dir === 1 ? clipStart : 0;
    const insetRight = dir === 1 ? 0 : clipStart;
    const insetOutLeft = dir === 1 ? 0 : clipEnd;
    const insetOutRight = dir === 1 ? clipEnd : 0;
    return (
      <AbsoluteFill style={{ opacity: fadeIn * fadeOut }}>
        <AbsoluteFill
          style={{
            clipPath: `inset(0% ${insetRight + insetOutRight}% 0% ${insetLeft + insetOutLeft}%)`,
          }}
        >
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  if (scene.transition === "slide-left" || scene.transition === "slide-right") {
    const fadeIn = interpolate(frame, [0, tFrames], [0, 1], CLAMP);
    const fadeOut = isLast ? 1 : interpolate(frame, [dur - tFrames, dur], [1, 0], CLAMP);
    const dir = scene.transition === "slide-left" ? 1 : -1;
    const xIn = interpolate(frame, [0, tFrames], [dir * 140, 0], CLAMP);
    const xOut = isLast ? 0 : interpolate(frame, [dur - tFrames, dur], [0, -dir * 140], CLAMP);
    return (
      <AbsoluteFill
        style={{
          opacity: fadeIn * fadeOut,
          transform: `translateX(${xIn + xOut}px)`,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }

  if (scene.transition === "zoom") {
    const fadeIn = interpolate(frame, [0, tFrames], [0, 1], CLAMP);
    const fadeOut = isLast ? 1 : interpolate(frame, [dur - tFrames, dur], [1, 0], CLAMP);
    const sIn = interpolate(frame, [0, tFrames], [1.06, 1], CLAMP);
    const sOut = isLast ? 1 : interpolate(frame, [dur - tFrames, dur], [1, 0.98], CLAMP);
    return (
      <AbsoluteFill style={{ opacity: fadeIn * fadeOut, transform: `scale(${sIn * sOut})` }}>
        {children}
      </AbsoluteFill>
    );
  }

  if (scene.transition === "glitch-cut") {
    const fadeIn = interpolate(frame, [0, Math.max(1, Math.round(tFrames * 0.35))], [0, 1], CLAMP);
    const fadeOut = isLast ? 1 : interpolate(frame, [dur - tFrames, dur], [1, 0], CLAMP);
    const gate = frame % 9 === 0 || frame % 11 === 0;
    const x = gate ? (frame % 2 === 0 ? 10 : -10) : 0;
    const y = gate ? (frame % 3 === 0 ? 6 : -6) : 0;
    const hue = gate ? "hue-rotate(12deg) saturate(1.35)" : "none";
    return (
      <AbsoluteFill style={{ opacity: fadeIn * fadeOut, transform: `translate(${x}px, ${y}px)`, filter: hue }}>
        {children}
      </AbsoluteFill>
    );
  }

  // Fallback: no transition
  return <AbsoluteFill>{children}</AbsoluteFill>;
};

// ── Scene Content Renderer ────────────────────────────────────────────────

const SceneContent: React.FC<{ scene: SceneData }> = ({ scene }) => {
  // Composite scene
  if (scene.layout && scene.regions && scene.regions.length > 0) {
    return (
      <CompositeScene
        layout={scene.layout}
        regions={scene.regions}
        background={scene.background}
      />
    );
  }

  // Single template scene
  if (scene.templateId) {
    return (
      <TemplateRouter
        templateId={scene.templateId}
        params={scene.params ?? {}}
      />
    );
  }

  // Empty scene fallback
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }} />
  );
};

// ── Main Component ────────────────────────────────────────────────────────

export const SceneSequencer: React.FC<SceneSequencerProps> = ({ scenes }) => {
  if (!scenes || scenes.length === 0) {
    return <AbsoluteFill style={{ backgroundColor: "#000000" }} />;
  }

  return (
    <AbsoluteFill>
      {scenes.map((scene, i) => (
        <Sequence
          key={i}
          from={scene.startFrame}
          durationInFrames={scene.durationFrames}
        >
          <SceneWithTransition scene={scene} isLast={i === scenes.length - 1}>
            <SceneContent scene={scene} />
          </SceneWithTransition>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
