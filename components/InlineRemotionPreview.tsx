"use client";

import dynamic from "next/dynamic";
import React from "react";
import type { ComponentType } from "react";
import type { PlayerProps } from "@remotion/player";
import { TemplateRouter } from "@/src/TemplateRouter";

const Player = dynamic(
  async () => {
    const mod = await import("@remotion/player");
    return mod.Player as unknown as ComponentType<PlayerProps>;
  },
  { ssr: false },
);

type AspectPreset = { width: number; height: number };

function getAspectPreset(aspectRatio: string): AspectPreset {
  switch (aspectRatio) {
    case "9:16":
      return { width: 540, height: 960 };
    case "1:1":
      return { width: 720, height: 720 };
    case "4:5":
      return { width: 720, height: 900 };
    case "16:9":
    default:
      return { width: 960, height: 540 };
  }
}

export default function InlineRemotionPreview({
  templateId,
  params,
  aspectRatio,
  durationSec,
}: {
  templateId: string;
  params: Record<string, unknown>;
  aspectRatio: string;
  durationSec: number;
}) {
  const { width, height } = getAspectPreset(aspectRatio);
  const fps = 30;
  const durationInFrames = Math.max(1, Math.floor(durationSec * fps));

  return (
    <div className="glass-strong rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
        <span className="text-xs text-neutral-500 uppercase tracking-wide">
          Preview (unrendered)
        </span>
        <span className="text-xs text-neutral-400 font-mono">
          {templateId}
        </span>
      </div>

      <Player
        component={TemplateRouter as unknown as ComponentType<any>}
        inputProps={{
          templateId,
          params,
        }}
        durationInFrames={durationInFrames}
        fps={fps}
        compositionWidth={width}
        compositionHeight={height}
        autoPlay
        loop
        controls
        style={{ width: "100%", maxWidth: 960, margin: "0 auto" }}
      />
    </div>
  );
}

