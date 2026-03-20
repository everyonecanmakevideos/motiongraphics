"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { ensureFontsLoaded } from "@/src/primitives/fonts";
import { TemplateRouter } from "@/src/TemplateRouter";
import { SceneSequencer } from "@/src/SceneSequencer";
import type { ResolvedScene } from "@/lib/templates/sceneTypes";

const ASPECT_RATIO_PRESETS: Record<string, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "4:3": { width: 1440, height: 1080 },
  "3:4": { width: 1080, height: 1440 },
};

export type PreviewModel =
  | {
      mode: "single";
      aspectRatio: string;
      durationSec: number;
      templateId: string;
      templateParams: Record<string, unknown>;
    }
  | {
      mode: "multi";
      aspectRatio: string;
      scenes: ResolvedScene[];
      totalDurationFrames: number;
    };

export default function RemotionTemplatePreview({ model }: { model: PreviewModel }) {
  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  // Start muted so browsers allow autoplay without a manual interaction.
  const [isMuted, setIsMuted] = useState(true);
  const [frame, setFrame] = useState(0);
  const [openFullscreen, setOpenFullscreen] = useState(false);

  useEffect(() => {
    // Fonts are used by typography rendering inside templates.
    ensureFontsLoaded();
  }, []);

  const { width, height, durationInFrames, component, inputProps } = useMemo(() => {
    const preset = ASPECT_RATIO_PRESETS[model.aspectRatio] ?? ASPECT_RATIO_PRESETS["16:9"];
    const fps = 30;

    if (model.mode === "single") {
      return {
        width: preset.width,
        height: preset.height,
        durationInFrames: Math.round(model.durationSec * fps),
        component: TemplateRouter,
        inputProps: { templateId: model.templateId, params: model.templateParams },
      };
    }

    return {
      width: preset.width,
      height: preset.height,
      durationInFrames: model.totalDurationFrames,
      component: SceneSequencer,
      inputProps: { scenes: model.scenes },
    };
  }, [model]);

  useEffect(() => {
    // Reset timeline when model changes (avoids “stuck at end” feel).
    setFrame(0);
    setIsPlaying(true);
    // Keep muted on new previews to preserve autoplay.
    setIsMuted(true);
    // Try to kick the internal player once refs are ready.
    const id = window.setTimeout(() => {
      try {
        playerRef.current?.play?.();
      } catch {
        // If autoplay is still blocked, the UI controls + click-to-play will work.
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [model]);

  useEffect(() => {
    if (!openFullscreen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenFullscreen(false);
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openFullscreen]);

  const aspect = `${width}/${height}`;
  const fps = 30;
  const currentTimeSec = frame / fps;
  const totalTimeSec = durationInFrames / fps;

  return (
    <>
      <div className="glass-strong rounded-2xl overflow-hidden">
        {/* Controls */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/10">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white"
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>
          <div className="flex-1" />
          <div className="text-[11px] text-neutral-400 tabular-nums">
            {currentTimeSec.toFixed(1)}s / {totalTimeSec.toFixed(1)}s
          </div>
          <button
            type="button"
            onClick={() => setOpenFullscreen(true)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white"
          >
            Fullscreen
          </button>
        </div>

        {/* Timeline scrub */}
        <div className="px-3 py-2 border-b border-white/10 bg-black/5">
          <input
            type="range"
            min={0}
            max={Math.max(0, durationInFrames - 1)}
            value={frame}
            onChange={(e) => {
              const next = Number(e.target.value) || 0;
              setFrame(next);
              playerRef.current?.seekTo(next);
            }}
            className="w-full"
          />
        </div>

        {/* Player container: stays within viewport height */}
        <div
          className="w-full bg-black"
          style={{
            aspectRatio: aspect,
            maxHeight: "70vh",
            margin: "0 auto",
          }}
        >
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="w-full h-full cursor-pointer border-none p-0 bg-transparent"
          >
            <Player
              ref={playerRef}
              component={component}
              inputProps={inputProps}
              compositionWidth={width}
              compositionHeight={height}
              fps={fps}
              durationInFrames={durationInFrames}
              controls={false}
              loop
              playing={isPlaying}
              muted={isMuted}
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                backgroundColor: "#000000",
              }}
              // Keep state in sync for scrubber
              onFrameUpdate={(f) => setFrame(f)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </button>
        </div>
      </div>

      {/* Fullscreen modal */}
      {openFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm">
          <div className="absolute inset-0 p-4 sm:p-6 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="text-xs text-neutral-300">Preview</div>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white"
              >
                {isMuted ? "Unmute" : "Mute"}
              </button>
              <button
                type="button"
                onClick={() => setOpenFullscreen(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white"
              >
                Close
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div
                style={{
                  width: "min(96vw, 1100px)",
                  aspectRatio: aspect,
                  maxHeight: "86vh",
                  backgroundColor: "#000",
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className="w-full h-full cursor-pointer border-none p-0 bg-transparent"
                >
                  <Player
                    component={component}
                    inputProps={inputProps}
                    compositionWidth={width}
                    compositionHeight={height}
                    fps={fps}
                    durationInFrames={durationInFrames}
                    controls={false}
                    loop
                    playing={isPlaying}
                    muted={isMuted}
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      backgroundColor: "#000000",
                    }}
                    onFrameUpdate={(f) => setFrame(f)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={Math.max(0, durationInFrames - 1)}
                value={frame}
                onChange={(e) => {
                  const next = Number(e.target.value) || 0;
                  setFrame(next);
                  playerRef.current?.seekTo(next);
                }}
                className="w-full"
              />
              <div className="text-[11px] text-neutral-400 tabular-nums w-[92px] text-right">
                {currentTimeSec.toFixed(1)}s
              </div>
            </div>

            <div className="text-[11px] text-neutral-500">
              Tips: <span className="text-neutral-400">Space</span> to play/pause,{" "}
              <span className="text-neutral-400">Esc</span> to close.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

