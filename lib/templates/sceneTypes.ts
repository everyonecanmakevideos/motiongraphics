import type { BackgroundConfig } from "../../src/templates/types";

// ── Transition Types ──────────────────────────────────────────────────────

export type TransitionType =
  | "cut"
  | "crossfade"
  | "fade-through-black"
  | "wipe-left"
  | "wipe-right"
  | "slide-left"
  | "slide-right"
  | "zoom"
  | "glitch-cut";

// ── Layout Strategies for Composite Scenes ────────────────────────────────

export type LayoutStrategy =
  | "split-horizontal"   // left | right (50/50)
  | "split-vertical"     // top / bottom (50/50)
  | "main-sidebar"       // 2/3 | 1/3
  | "grid-2x2";          // 4 quadrants

// ── Region within a Composite Scene ───────────────────────────────────────

export interface RegionIntent {
  templateId: string;
  params: Record<string, unknown>;
}

// ── Scene Definition (single-template OR composite) ───────────────────────

export interface SceneDefinition {
  // Single template scene:
  templateId?: string;
  params?: Record<string, unknown>;

  // Composite scene (multiple templates in one frame):
  layout?: LayoutStrategy;
  regions?: RegionIntent[];
  background?: BackgroundConfig;

  // Common:
  duration: number;
  transition: TransitionType;
}

// ── LLM Output Types ─────────────────────────────────────────────────────

export interface MultiSceneResult {
  scenes: SceneDefinition[];
  confidence: "high" | "medium" | "low";
  reasoning: string;
  aspect_ratio?: string;
}

// ── Resolved Scene (after validation + frame computation) ─────────────────

export interface ResolvedRegion {
  templateId: string;
  params: Record<string, unknown>;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResolvedScene {
  // Single template:
  templateId?: string;
  params?: Record<string, unknown>;

  // Composite:
  layout?: LayoutStrategy;
  regions?: ResolvedRegion[];
  background?: BackgroundConfig;

  // Frame timing:
  durationFrames: number;
  startFrame: number;
  transition: TransitionType;
  transitionDurationFrames: number;
}

export interface MultiSceneResolution {
  mode: "template" | "legacy";
  scenes?: ResolvedScene[];
  totalDurationFrames?: number;
  error?: string;
}

// ── Type Guards ──────────────────────────────────────────────────────────

export function isCompositeScene(scene: SceneDefinition): boolean {
  return !!scene.layout && Array.isArray(scene.regions) && scene.regions.length > 0;
}

export function isResolvedComposite(scene: ResolvedScene): boolean {
  return !!scene.layout && Array.isArray(scene.regions) && scene.regions.length > 0;
}
