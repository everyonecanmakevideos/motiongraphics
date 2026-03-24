/**
 * Serial in-memory job queue with SSE subscriber broadcasting.
 * Jobs are processed one at a time — no concurrent renders — so
 * src/GeneratedMotion.tsx is never written by two jobs simultaneously.
 *
 * Module-level state persists across requests in Railway's Node.js process.
 */

import fs from "fs";
import path from "path";
import { getJob, updateJob } from "./db";
import { expandPrompt } from "./pipeline/promptExpander";
import { generateSpec } from "./pipeline/specGenerator";
import { generateAnimationCode, fixAnimationCode, wrapComponent } from "./pipeline/codeGenerator";
import { renderAndUpload, typeCheck } from "./pipeline/renderer";
import { analyzeIntent, isMultiSceneResult } from "./pipeline/intentAnalyzer";
import { resolveTemplate } from "./templates/resolver";
import { renderTemplate, renderMultiScene } from "./pipeline/templateRenderer";
import { resolveMultiScene } from "./templates/multiSceneResolver";
import { applyCreativeLayer } from "./templates/creativeEnhancer";
import { createHeraVideoJob, hasHeraConfig, waitForHeraVideo } from "./hera";
import type { JobStatus, SSEEvent } from "./types";
import { STEP_LABELS, TEMPLATE_STEP_LABELS } from "./types";

// ── State ──────────────────────────────────────────────────────────────────

interface QueueJob {
  jobId: string;
  previewOnly: boolean;
}

const jobQueue: QueueJob[] = [];
let isProcessing = false;
const subscribers = new Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>();

// ── SSE helpers ────────────────────────────────────────────────────────────

export function subscribe(
  jobId: string,
  controller: ReadableStreamDefaultController<Uint8Array>
): void {
  if (!subscribers.has(jobId)) subscribers.set(jobId, new Set());
  subscribers.get(jobId)!.add(controller);
}

export function unsubscribe(
  jobId: string,
  controller: ReadableStreamDefaultController<Uint8Array>
): void {
  subscribers.get(jobId)?.delete(controller);
}

function emit(jobId: string, event: SSEEvent): void {
  const data = "data: " + JSON.stringify(event) + "\n\n";
  const encoded = new TextEncoder().encode(data);
  const set = subscribers.get(jobId);
  if (!set) return;
  for (const controller of set) {
    try {
      controller.enqueue(encoded);
      if (event.status === "done" || event.status === "failed") {
        controller.close();
      }
    } catch {
      set.delete(controller);
    }
  }
}

// ── Queue public API ───────────────────────────────────────────────────────

export function enqueueJob(jobId: string, opts?: { previewOnly?: boolean }): void {
  jobQueue.push({ jobId, previewOnly: Boolean(opts?.previewOnly) });
  processNext();
}

function processNext(): void {
  if (isProcessing || jobQueue.length === 0) return;
  isProcessing = true;
  const queued = jobQueue.shift()!;
  runPipeline(queued.jobId, queued.previewOnly)
    .catch((err) => console.error("[queue] Unhandled error for", queued.jobId, err))
    .finally(() => {
      isProcessing = false;
      processNext();
    });
}

// ── Pipeline ───────────────────────────────────────────────────────────────

async function setStep(
  jobId: string,
  step: number,
  status: JobStatus,
  extra: Partial<SSEEvent> = {}
): Promise<void> {
  await updateJob(jobId, { status, step });
  emit(jobId, { jobId, step, status, label: STEP_LABELS[step] ?? "", ...extra });
}

async function failJob(jobId: string, step: number, error: string): Promise<void> {
  await updateJob(jobId, { status: "failed", step, error });
  emit(jobId, { jobId, step, status: "failed", label: "Failed: " + error.slice(0, 200), error });
}

async function runPipeline(jobId: string, previewOnly: boolean): Promise<void> {
  const job = await getJob(jobId);
  if (!job) return;

  // Broadcast step 1 for any SSE clients that connected early
  emit(jobId, { jobId, step: 1, status: "queued", label: STEP_LABELS[1] });

  try {
    // Preview mode: use template pipeline (so template params like `currentStep` exist),
    // but skip MP4 rendering/upload.
    if (previewOnly) {
      const usedTemplate = await tryTemplatePipeline(jobId, job.prompt, true);
      if (usedTemplate) return;
      // If template routing declined, fall back to legacy preview (generated code, no MP4).
      await runLegacyPipeline(jobId, job.prompt, true);
      return;
    }

    // ── Try template path first ───────────────────────────────────────────
    const templateResult = await tryTemplatePipeline(jobId, job.prompt, false);
    if (templateResult) return; // Template path succeeded
    if (hasHeraConfig()) {
      console.log("[queue] Template path declined for", jobId, "— using Hera fallback");
      await runHeraFallback(jobId, job.prompt);
      return;
    }

    // ── Fallback to legacy pipeline ───────────────────────────────────────
    console.log("[queue] Template path declined for", jobId, "— using legacy pipeline");
    await runLegacyPipeline(jobId, job.prompt);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await failJob(jobId, 7, msg);
  }
}

/**
 * Attempts the template-driven pipeline.
 * Returns true if the template path was used (success or failure).
 * Returns false if the system decided to fall back to legacy.
 */
async function tryTemplatePipeline(jobId: string, prompt: string, previewOnly: boolean): Promise<boolean> {
  try {
    // Step 2: Analyze intent
    await setStep(jobId, 2, "analyzing_intent");
    emit(jobId, { jobId, step: 2, status: "analyzing_intent", label: TEMPLATE_STEP_LABELS[2], pipelineMode: "template" });
    const rawIntent = await analyzeIntent(prompt);
    await updateJob(jobId, { debug_intent_analyzer: rawIntent });

    // ── Creative enhancement ──────────────────────────────────────────
    const intent = await applyCreativeLayer(prompt, rawIntent);
    await updateJob(jobId, { debug_intent_creative: intent });

    // ── Multi-scene path ────────────────────────────────────────────────
    if (isMultiSceneResult(intent)) {
      console.log("[queue] Multi-scene intent for", jobId, ":", intent.scenes.length, "scenes, confidence:", intent.confidence);

      const resolution = resolveMultiScene(intent);
      if (resolution.mode === "legacy") {
        console.log("[queue] Multi-scene resolution declined:", resolution.error);
        return false;
      }

      // Store template info
      const firstTemplateId = resolution.scenes![0].templateId ?? resolution.scenes![0].layout ?? "multi-scene";
      await updateJob(jobId, {
        provider: "template",
        template_id: "multi-scene:" + intent.scenes.length + "-scenes",
        template_params: { scenes: resolution.scenes },
      });

      // Step 3: Render
      await setStep(jobId, 3, "template_rendering");
      emit(jobId, {
        jobId, step: 3, status: "template_rendering",
        label: "Rendering " + intent.scenes.length + " scenes...",
        pipelineMode: "template", templateId: firstTemplateId,
      });

      if (previewOnly) {
        await updateJob(jobId, { status: "done", step: 8 });
        emit(jobId, {
          jobId, step: 8, status: "done",
          label: "Preview ready in Remotion Studio",
          pipelineMode: "template",
          templateId: firstTemplateId,
        });
        return true;
      }

      const aspectRatio = intent.aspect_ratio;
      const result = await renderMultiScene(jobId, resolution.scenes!, resolution.totalDurationFrames!, aspectRatio);

      // Done
      await updateJob(jobId, {
        status: "done",
        step: 8,
        video_r2_key: result.videoKey,
        spec_r2_key: result.specKey,
      });
      emit(jobId, {
        jobId, step: 8, status: "done",
        label: TEMPLATE_STEP_LABELS[4],
        videoKey: result.videoKey,
        pipelineMode: "template",
      });
      return true;
    }

    // ── Single-scene path ───────────────────────────────────────────────
    console.log("[queue] Intent for", jobId, ":", intent.templateId, "confidence:", intent.confidence);

    // Resolve template
    const resolution = resolveTemplate(intent);
    if (resolution.mode === "legacy") {
      console.log("[queue] Template resolution declined:", resolution.error);
      return false; // Fall back to legacy
    }

    const templateId = resolution.templateId!;
    const templateParams = resolution.params! as Record<string, unknown>;

    // Store template info in database
    await updateJob(jobId, {
      provider: "template",
      template_id: templateId,
      template_params: templateParams,
    });

    // Step 3: Render template
    await setStep(jobId, 3, "template_rendering");
    emit(jobId, {
      jobId, step: 3, status: "template_rendering",
      label: TEMPLATE_STEP_LABELS[3],
      pipelineMode: "template", templateId,
    });

    const durationSec = (templateParams.duration as number) ?? 6;
    const aspectRatio = intent.aspect_ratio;
    if (previewOnly) {
      await updateJob(jobId, { status: "done", step: 8 });
      emit(jobId, {
        jobId, step: 8, status: "done",
        label: "Preview ready in Remotion Studio",
        pipelineMode: "template",
        templateId,
      });
      return true;
    }

    const result = await renderTemplate(jobId, templateId, templateParams, durationSec, aspectRatio);

    // Step 4: Done
    await updateJob(jobId, {
      status: "done",
      step: 8,
      video_r2_key: result.videoKey,
      spec_r2_key: result.specKey,
    });
    emit(jobId, {
      jobId,
      step: 8,
      status: "done",
      label: TEMPLATE_STEP_LABELS[4],
      videoKey: result.videoKey,
      pipelineMode: "template",
      templateId,
    });
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[queue] Template pipeline error for", jobId, ":", msg.slice(0, 300));
    // On template error, fall back to legacy rather than failing the whole job
    return false;
  }
}

/** The original legacy pipeline (expand → spec → code → render). */
async function runLegacyPipeline(jobId: string, prompt: string, previewOnly = false): Promise<void> {
  await updateJob(jobId, { provider: "legacy" });
  // Step 2: Expand simple prompt into detailed prompt
  await setStep(jobId, 2, "expanding");
  const expandResult = await expandPrompt(prompt);
  if (!expandResult.result) {
    await failJob(jobId, 2, "Prompt expansion failed: " + expandResult.errors.join("; "));
    return;
  }
  const detailedPrompt = expandResult.result.prompt;
  await updateJob(jobId, { detailed_prompt: detailedPrompt });

  // Step 3: Generate spec from detailed prompt
  await setStep(jobId, 3, "spec_generating");
  const specResult = await generateSpec(detailedPrompt);
  if (!specResult.spec) {
    await failJob(jobId, 3, "Spec generation failed: " + specResult.errors.join("; "));
    return;
  }
  const specText = JSON.stringify(specResult.spec, null, 2);

  // Step 4: Spec ready
  await updateJob(jobId, { spec_json: specResult.spec });
  await setStep(jobId, 4, "spec_ready", { specJson: specResult.spec });

  // Step 5: Generate animation code
  await setStep(jobId, 5, "code_generating");
  const { code, fullComponent: initialComponent, issues } = await generateAnimationCode(specText, specResult.spec);
  let fullComponent = initialComponent;
  if (issues.length > 0) console.warn("[queue] Static issues for", jobId, issues.join(", "));

  // Step 6: Code ready — TypeScript check + fix loop
  await setStep(jobId, 6, "code_ready");
  const specObj = specResult.spec as Record<string, unknown>;
  const generatedPath = path.join(process.cwd(), "src", "GeneratedMotion.tsx");
  fs.writeFileSync(generatedPath, fullComponent, "utf-8");
  const tsResult = typeCheck();
  if (!tsResult.success && tsResult.error) {
    console.warn("[queue] TS errors for", jobId, "— retrying with error feedback");
    const fixedCode = await fixAnimationCode(specText, specResult.spec, code, tsResult.error);
    const hasAssets = Array.isArray(specObj.objects) &&
      (specObj.objects as Record<string, unknown>[]).some(
        (o: Record<string, unknown>) => o.shape === "asset"
      );
    fullComponent = wrapComponent(fixedCode, hasAssets);
    fs.writeFileSync(generatedPath, fullComponent, "utf-8");
    const recheck = typeCheck();
    if (!recheck.success) {
      console.warn("[queue] TS still failing after retry for", jobId, recheck.error?.slice(0, 200));
    } else {
      console.log("[queue] TS fixed on retry for", jobId);
    }
  }

  if (previewOnly) {
    await updateJob(jobId, { status: "done", step: 8 });
    emit(jobId, {
      jobId,
      step: 8,
      status: "done",
      label: "Preview ready in Remotion Studio",
      provider: "legacy",
      pipelineMode: "legacy",
    });
    return;
  }

  // Step 7: Render (with code-fix retry on failure)
  await setStep(jobId, 7, "rendering");
  try {
    const result = await renderAndUpload(
      jobId,
      fullComponent,
      specResult.spec as Record<string, unknown>,
      specText
    );

    // Step 8: Done
    await updateJob(jobId, {
      status: "done",
      step: 8,
      video_r2_key: result.videoKey,
      code_r2_key: result.codeKey,
      spec_r2_key: result.specKey,
    });
    emit(jobId, {
      jobId,
      step: 8,
      status: "done",
      label: STEP_LABELS[8],
      videoKey: result.videoKey,
      provider: "legacy",
      pipelineMode: "legacy",
    });
  } catch (renderErr) {
    const renderMsg = renderErr instanceof Error ? renderErr.message : String(renderErr);
    console.warn("[queue] Render failed for", jobId, "— attempting code fix...");
    console.warn("[queue] Render error:", renderMsg.slice(0, 500));

    const fixedCode = await fixAnimationCode(specText, specResult.spec, code, renderMsg);
    const hasAssets = Array.isArray(specObj.objects) &&
      (specObj.objects as Record<string, unknown>[]).some(
        (o: Record<string, unknown>) => o.shape === "asset"
      );
    fullComponent = wrapComponent(fixedCode, hasAssets);
    fs.writeFileSync(generatedPath, fullComponent, "utf-8");

    const result = await renderAndUpload(
      jobId,
      fullComponent,
      specResult.spec as Record<string, unknown>,
      specText
    );

    console.log("[queue] Render succeeded on retry for", jobId);
    await updateJob(jobId, {
      status: "done",
      step: 8,
      video_r2_key: result.videoKey,
      code_r2_key: result.codeKey,
      spec_r2_key: result.specKey,
    });
    emit(jobId, {
      jobId,
      step: 8,
      status: "done",
      label: STEP_LABELS[8],
      videoKey: result.videoKey,
      provider: "legacy",
      pipelineMode: "legacy",
    });
  }
}

async function runHeraFallback(jobId: string, prompt: string): Promise<void> {
  await updateJob(jobId, { provider: "hera" });

  await setStep(jobId, 2, "analyzing_intent");
  emit(jobId, {
    jobId,
    step: 2,
    status: "analyzing_intent",
    label: "Switching to Hera fallback...",
    provider: "hera",
    pipelineMode: "hera",
  });

  const created = await createHeraVideoJob(prompt);
  await updateJob(jobId, {
    external_video_id: created.video_id,
    external_project_url: created.project_url,
  });

  await setStep(jobId, 7, "rendering");
  emit(jobId, {
    jobId,
    step: 7,
    status: "rendering",
    label: "Rendering with Hera...",
    provider: "hera",
    pipelineMode: "hera",
    externalVideoId: created.video_id,
    externalProjectUrl: created.project_url,
  });

  const result = await waitForHeraVideo(created.video_id);

  await updateJob(jobId, {
    status: "done",
    step: 8,
    video_url: result.videoUrl,
    external_video_id: created.video_id,
    external_project_url: result.projectUrl ?? created.project_url,
  });

  emit(jobId, {
    jobId,
    step: 8,
    status: "done",
    label: STEP_LABELS[8],
    videoUrl: result.videoUrl,
    provider: "hera",
    pipelineMode: "hera",
    externalVideoId: created.video_id,
    externalProjectUrl: result.projectUrl ?? created.project_url,
  });
}
