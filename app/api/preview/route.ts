import { NextRequest, NextResponse } from "next/server";
import { analyzeIntent, isMultiSceneResult } from "@/lib/pipeline/intentAnalyzer";
import { applyCreativeLayer } from "@/lib/templates/creativeEnhancer";
import { resolveTemplate } from "@/lib/templates/resolver";
import { resolveMultiScene } from "@/lib/templates/multiSceneResolver";

const allowedAspectRatios = new Set(["16:9", "9:16", "1:1", "4:3", "3:4"]);

function clampDurationSeconds(durationSecRaw: unknown): number {
  const durationSec = typeof durationSecRaw === "number" ? durationSecRaw : Number(durationSecRaw);
  if (!Number.isFinite(durationSec)) return 6;
  return Math.max(2, Math.min(30, Math.round(durationSec)));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = (body.prompt ?? "").trim();
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    if (prompt.length > 3000) return NextResponse.json({ error: "Prompt too long (max 3000 chars)" }, { status: 400 });

    const aspectRatioRaw = typeof body.aspect_ratio === "string" ? body.aspect_ratio.trim() : "";
    const aspectRatio = allowedAspectRatios.has(aspectRatioRaw) ? aspectRatioRaw : "16:9";
    const durationSec = clampDurationSeconds(body.duration_sec);

    // 1) Intent analysis → template choice + initial params
    const rawIntent = await analyzeIntent(prompt);

    // 2) Creative enhancement (style tokens → constrained template params)
    const intent = await applyCreativeLayer(prompt, rawIntent);

    // 3) Resolve template (fast path, no rendering)
    if (isMultiSceneResult(intent)) {
      const durationSecFinite =
        typeof durationSec === "number" && Number.isFinite(durationSec) && durationSec > 0 ? durationSec : undefined;

      // Match queue behavior: scale scene + region params durations so the *total* matches durationSec.
      if (durationSecFinite && intent.scenes && intent.scenes.length > 0) {
        const sum = intent.scenes.reduce((acc, s) => acc + (typeof s.duration === "number" ? s.duration : 0), 0);
        if (sum > 0) {
          const scale = durationSecFinite / sum;
          for (const scene of intent.scenes) {
            const nextDur = Math.max(2, Math.round((scene.duration ?? 0) * scale));
            scene.duration = nextDur;

            if (scene.params && typeof (scene.params as Record<string, unknown>).duration === "number") {
              (scene.params as Record<string, unknown>).duration = nextDur;
            }

            if (scene.regions?.length) {
              for (const region of scene.regions) {
                if (region.params && typeof (region.params as Record<string, unknown>).duration === "number") {
                  (region.params as Record<string, unknown>).duration = nextDur;
                }
              }
            }
          }
        }
      }

      const resolution = resolveMultiScene(intent);
      if (resolution.mode === "legacy") {
        return NextResponse.json(
          { mode: "legacy", error: resolution.error ?? "Template resolver declined" },
          { status: 200 },
        );
      }

      return NextResponse.json({
        mode: "multi",
        aspectRatio,
        scenes: resolution.scenes,
        totalDurationFrames: resolution.totalDurationFrames,
      });
    }

    const resolution = resolveTemplate(intent);
    if (resolution.mode === "legacy") {
      return NextResponse.json({ mode: "legacy", error: resolution.error ?? "Template resolver declined" }, { status: 200 });
    }

    const templateId = resolution.templateId!;
    const templateParams = resolution.params! as Record<string, unknown>;

    // Match queue behavior: override template duration with the user-selected total duration.
    templateParams.duration =
      typeof durationSec === "number" && Number.isFinite(durationSec) ? durationSec : (templateParams.duration as number) ?? 6;

    return NextResponse.json({
      mode: "single",
      aspectRatio,
      durationSec,
      templateId,
      templateParams,
    });
  } catch (err) {
    console.error("[POST /api/preview]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

