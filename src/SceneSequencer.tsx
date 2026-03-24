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
  transition: "cut" | "crossfade" | "fade-through-black";
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
