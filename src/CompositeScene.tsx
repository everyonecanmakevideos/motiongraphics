import React from "react";
import { AbsoluteFill } from "remotion";
import { TemplateRouter } from "./TemplateRouter";
import { Background } from "./primitives/Background";
import type { BackgroundConfig } from "./templates/types";

// ── Layout Region Definitions ─────────────────────────────────────────────

interface LayoutRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

const LAYOUT_REGIONS: Record<string, LayoutRegion[]> = {
  "split-horizontal": [
    { x: 0, y: 0, w: 960, h: 1080 },
    { x: 960, y: 0, w: 960, h: 1080 },
  ],
  "split-vertical": [
    { x: 0, y: 0, w: 1920, h: 540 },
    { x: 0, y: 540, w: 1920, h: 540 },
  ],
  "main-sidebar": [
    { x: 0, y: 0, w: 1280, h: 1080 },
    { x: 1280, y: 0, w: 640, h: 1080 },
  ],
  "grid-2x2": [
    { x: 0, y: 0, w: 960, h: 540 },
    { x: 960, y: 0, w: 960, h: 540 },
    { x: 0, y: 540, w: 960, h: 540 },
    { x: 960, y: 540, w: 960, h: 540 },
  ],
};

// ── Props ─────────────────────────────────────────────────────────────────

interface RegionData {
  templateId: string;
  params: Record<string, unknown>;
}

export interface CompositeSceneProps {
  layout: string;
  regions: RegionData[];
  background?: BackgroundConfig;
}

// ── Component ─────────────────────────────────────────────────────────────

export const CompositeScene: React.FC<CompositeSceneProps> = ({
  layout,
  regions,
  background,
}) => {
  const layoutRegions = LAYOUT_REGIONS[layout];

  if (!layoutRegions) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#1A1A2E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#FF6B6B", fontSize: 36, fontFamily: "Arial, sans-serif" }}>
          {"Unknown layout: " + layout}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Shared background behind all regions */}
      {background && <Background config={background} />}

      {/* Render each region */}
      {layoutRegions.map((region, i) => {
        if (i >= regions.length) return null;
        const regionData = regions[i];

        // Scale factor: templates render at 1920x1080 internally
        const scaleX = region.w / 1920;
        const scaleY = region.h / 1080;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: region.x,
              top: region.y,
              width: region.w,
              height: region.h,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                transform: "scale(" + scaleX + ", " + scaleY + ")",
                transformOrigin: "top left",
                width: 1920,
                height: 1080,
              }}
            >
              <TemplateRouter
                templateId={regionData.templateId}
                params={regionData.params}
              />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
