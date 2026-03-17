import { SERVER_TEMPLATE_REGISTRY } from "../../src/templates/registry-server";
import { normalizeAnimation } from "./animationFallback";
import type {
  SceneDefinition,
  MultiSceneResult,
  MultiSceneResolution,
  ResolvedScene,
  ResolvedRegion,
} from "./sceneTypes";
import { isCompositeScene } from "./sceneTypes";

const FPS = 30;
const CROSSFADE_FRAMES = 15;          // 0.5s overlap
const FADE_THROUGH_BLACK_FRAMES = 15; // 0.5s each side (no overlap)

// ── Layout Region Definitions ─────────────────────────────────────────────

const LAYOUT_REGIONS: Record<string, Array<{ x: number; y: number; w: number; h: number }>> = {
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

// ── Helpers ───────────────────────────────────────────────────────────────

function validateAndNormalizeSingleTemplate(
  templateId: string,
  params: Record<string, unknown>
): { params: Record<string, unknown>; errors: string[] } {
  const entry = SERVER_TEMPLATE_REGISTRY[templateId];
  if (!entry) {
    return { params, errors: ["Unknown template: " + templateId] };
  }

  // Normalize animation
  if (typeof params.entranceAnimation === "string") {
    const norm = normalizeAnimation(templateId, params.entranceAnimation);
    if (norm.wasNormalized) {
      params = { ...params, entranceAnimation: norm.animation };
    }
  }

  // Validate against Zod schema
  const result = entry.schema.safeParse(params);
  if (!result.success) {
    const errors = result.error.issues.map(
      (i) => templateId + "." + i.path.join(".") + ": " + i.message
    );
    return { params, errors };
  }

  return { params: result.data as Record<string, unknown>, errors: [] };
}

function getTransitionFrames(transition: string): number {
  if (transition === "crossfade") return CROSSFADE_FRAMES;
  if (transition === "fade-through-black") return FADE_THROUGH_BLACK_FRAMES;
  return 0; // cut
}

// ── Main Resolver ─────────────────────────────────────────────────────────

export function resolveMultiScene(result: MultiSceneResult): MultiSceneResolution {
  if (result.confidence === "low") {
    return { mode: "legacy", error: "Low confidence: " + result.reasoning };
  }

  if (!result.scenes || result.scenes.length === 0) {
    return { mode: "legacy", error: "No scenes provided" };
  }

  // Normalize: LLM may put duration inside params instead of at scene level
  for (const scene of result.scenes) {
    if (!scene.duration && scene.params?.duration) {
      scene.duration = scene.params.duration as number;
    }
    // Also check inside regions for composite scenes
    if (!scene.duration && scene.regions?.length) {
      // Default composite scene duration if not specified
      scene.duration = 6;
    }
  }

  const resolvedScenes: ResolvedScene[] = [];
  const allErrors: string[] = [];

  // Validate each scene
  for (let i = 0; i < result.scenes.length; i++) {
    const scene = result.scenes[i];
    const sceneErrors = validateScene(scene, i);
    if (sceneErrors.length > 0) {
      allErrors.push(...sceneErrors);
    }
  }

  // If any scene fails, fall back to legacy for the entire job
  if (allErrors.length > 0) {
    return {
      mode: "legacy",
      error: "Scene validation failed: " + allErrors.join("; "),
    };
  }

  // Compute frame layout
  let currentFrame = 0;

  for (let i = 0; i < result.scenes.length; i++) {
    const scene = result.scenes[i];
    const durationFrames = Math.round(scene.duration * FPS);
    const transitionFrames = getTransitionFrames(scene.transition);

    const resolved: ResolvedScene = {
      durationFrames,
      startFrame: currentFrame,
      transition: scene.transition,
      transitionDurationFrames: transitionFrames,
    };

    if (isCompositeScene(scene)) {
      // Composite scene: validate + resolve each region
      resolved.layout = scene.layout;
      resolved.background = scene.background;
      resolved.regions = resolveRegions(scene);
    } else {
      // Single template scene
      const entry = SERVER_TEMPLATE_REGISTRY[scene.templateId!];
      const normalizedParams = { ...scene.params! };
      if (typeof normalizedParams.entranceAnimation === "string") {
        const norm = normalizeAnimation(scene.templateId!, normalizedParams.entranceAnimation);
        normalizedParams.entranceAnimation = norm.animation;
      }
      const parseResult = entry.schema.safeParse(normalizedParams);
      resolved.templateId = scene.templateId;
      resolved.params = parseResult.success
        ? (parseResult.data as Record<string, unknown>)
        : normalizedParams;
    }

    resolvedScenes.push(resolved);

    // Advance frame pointer
    // For crossfade: next scene starts early (overlap)
    if (scene.transition === "crossfade" && i < result.scenes.length - 1) {
      currentFrame += durationFrames - transitionFrames;
    } else {
      currentFrame += durationFrames;
    }
  }

  const totalDurationFrames = currentFrame;

  return {
    mode: "template",
    scenes: resolvedScenes,
    totalDurationFrames,
  };
}

// ── Scene Validation ──────────────────────────────────────────────────────

function validateScene(scene: SceneDefinition, index: number): string[] {
  const errors: string[] = [];
  const prefix = "scene[" + index + "]";

  if (!scene.duration || scene.duration < 1) {
    errors.push(prefix + ": duration must be >= 1");
  }

  if (isCompositeScene(scene)) {
    // Validate composite scene
    const layoutRegions = LAYOUT_REGIONS[scene.layout!];
    if (!layoutRegions) {
      errors.push(prefix + ": unknown layout '" + scene.layout + "'");
      return errors;
    }
    if (scene.regions!.length > layoutRegions.length) {
      errors.push(
        prefix + ": layout '" + scene.layout + "' supports max " +
        layoutRegions.length + " regions, got " + scene.regions!.length
      );
    }

    // Validate each region's template
    for (let r = 0; r < scene.regions!.length; r++) {
      const region = scene.regions![r];
      const { errors: regionErrors } = validateAndNormalizeSingleTemplate(
        region.templateId,
        { ...region.params }
      );
      errors.push(...regionErrors.map((e) => prefix + ".region[" + r + "]." + e));
    }
  } else if (scene.templateId) {
    // Validate single template scene
    const { errors: templateErrors } = validateAndNormalizeSingleTemplate(
      scene.templateId,
      { ...scene.params! }
    );
    errors.push(...templateErrors.map((e) => prefix + "." + e));
  } else {
    errors.push(prefix + ": must have either templateId or layout+regions");
  }

  return errors;
}

// ── Composite Region Resolution ───────────────────────────────────────────

function resolveRegions(scene: SceneDefinition): ResolvedRegion[] {
  const layoutRegions = LAYOUT_REGIONS[scene.layout!];
  if (!layoutRegions) return [];

  return scene.regions!.map((region, i) => {
    const lr = layoutRegions[i];
    const entry = SERVER_TEMPLATE_REGISTRY[region.templateId];

    let resolvedParams = { ...region.params };
    if (entry && typeof resolvedParams.entranceAnimation === "string") {
      const norm = normalizeAnimation(region.templateId, resolvedParams.entranceAnimation);
      resolvedParams.entranceAnimation = norm.animation;
    }
    if (entry) {
      const parseResult = entry.schema.safeParse(resolvedParams);
      if (parseResult.success) {
        resolvedParams = parseResult.data as Record<string, unknown>;
      }
    }

    return {
      templateId: region.templateId,
      params: resolvedParams,
      x: lr.x,
      y: lr.y,
      width: lr.w,
      height: lr.h,
    };
  });
}
