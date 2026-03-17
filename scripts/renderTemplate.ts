/**
 * Local template render script.
 *
 * Usage:
 *   npx tsx scripts/renderTemplate.ts prompts/sample.json
 *   npx tsx scripts/renderTemplate.ts prompts/sample.json --id test-001
 *   npx tsx scripts/renderTemplate.ts --spec outputs/spec_test-001.json
 *
 * Flow:
 *   prompt JSON → intent analyzer (GPT-4o) → template spec → Remotion render → outputs/
 *
 * Output:
 *   outputs/video_<id>.mp4   — rendered video
 *   outputs/spec_<id>.json   — generated template spec (templateId + params)
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const PROJECT_ROOT = path.resolve(process.cwd());

// ── Dynamic imports to avoid pulling Remotion into this Node process ────────
async function loadPipeline() {
  const { analyzeIntent, isMultiSceneResult } = await import("../lib/pipeline/intentAnalyzer");
  const { resolveTemplate } = await import("../lib/templates/resolver");
  const { resolveMultiScene } = await import("../lib/templates/multiSceneResolver");
  return { analyzeIntent, isMultiSceneResult, resolveTemplate, resolveMultiScene };
}

// ── CLI arg parsing ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
let promptFile = "";
let onlyId = "";
let specFile = "";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--id" && args[i + 1]) {
    onlyId = args[i + 1];
    i++;
  } else if (args[i] === "--spec" && args[i + 1]) {
    specFile = args[i + 1];
    i++;
  } else if (!args[i].startsWith("--")) {
    promptFile = args[i];
  }
}

// ── Render a single spec to video ───────────────────────────────────────────
function renderToVideo(
  jobId: string,
  templateId: string,
  params: Record<string, unknown>,
  durationSec: number
): string {
  const durationFrames = Math.floor(durationSec * 30);
  const outputDir = path.join(PROJECT_ROOT, "outputs");
  fs.mkdirSync(outputDir, { recursive: true });

  const videoPath = path.join(outputDir, `video_${jobId}.mp4`);
  const propsPath = path.join(outputDir, `props_${jobId}.json`);

  const inputProps = { templateId, params };
  fs.writeFileSync(propsPath, JSON.stringify(inputProps, null, 2), "utf-8");

  console.log(`  Rendering ${durationFrames} frames (${durationSec}s) ...`);

  try {
    execSync(
      `npx remotion render src/index.ts TemplateScene "${videoPath}" --props="${propsPath}" --concurrency=1 --gl=swangle --disable-web-security`,
      {
        cwd: PROJECT_ROOT,
        stdio: "inherit",
        env: {
          ...process.env,
          REMOTION_APP_DURATION_FRAMES: String(durationFrames),
          REMOTION_APP_VIDEO_WIDTH: "1920",
          REMOTION_APP_VIDEO_HEIGHT: "1080",
        },
      }
    );
  } catch {
    console.error(`  ✗ Render failed for ${jobId}`);
    try { fs.unlinkSync(propsPath); } catch { /* */ }
    throw new Error(`Render failed for ${jobId}`);
  }

  // Clean up props file (spec file is the keeper)
  try { fs.unlinkSync(propsPath); } catch { /* */ }

  return videoPath;
}

function renderMultiSceneToVideo(
  jobId: string,
  scenes: unknown[],
  totalDurationFrames: number
): string {
  const outputDir = path.join(PROJECT_ROOT, "outputs");
  fs.mkdirSync(outputDir, { recursive: true });

  const videoPath = path.join(outputDir, `video_${jobId}.mp4`);
  const propsPath = path.join(outputDir, `props_${jobId}.json`);

  const inputProps = { scenes };
  fs.writeFileSync(propsPath, JSON.stringify(inputProps, null, 2), "utf-8");

  console.log(`  Rendering ${totalDurationFrames} frames (${scenes.length} scenes) ...`);

  try {
    execSync(
      `npx remotion render src/index.ts SceneSequence "${videoPath}" --props="${propsPath}" --concurrency=1 --gl=swangle --disable-web-security`,
      {
        cwd: PROJECT_ROOT,
        stdio: "inherit",
        env: {
          ...process.env,
          REMOTION_APP_DURATION_FRAMES: String(totalDurationFrames),
          REMOTION_APP_VIDEO_WIDTH: "1920",
          REMOTION_APP_VIDEO_HEIGHT: "1080",
        },
      }
    );
  } catch {
    console.error(`  ✗ Multi-scene render failed for ${jobId}`);
    try { fs.unlinkSync(propsPath); } catch { /* */ }
    throw new Error(`Multi-scene render failed for ${jobId}`);
  }

  try { fs.unlinkSync(propsPath); } catch { /* */ }
  return videoPath;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  // Mode 1: Render directly from a spec file (skip LLM)
  if (specFile) {
    const absSpec = path.resolve(specFile);
    if (!fs.existsSync(absSpec)) {
      console.error("Spec file not found:", absSpec);
      process.exit(1);
    }
    const spec = JSON.parse(fs.readFileSync(absSpec, "utf-8"));
    const jobId = path.basename(absSpec, ".json").replace("spec_", "");
    const duration = (spec.params?.duration as number) ?? 6;

    console.log(`\n▶ Rendering from spec: ${absSpec}`);
    const videoPath = renderToVideo(jobId, spec.templateId, spec.params, duration);
    console.log(`  ✓ Video saved: ${videoPath}\n`);
    return;
  }

  // Mode 2: Prompt file → intent analysis → spec → render
  if (!promptFile) {
    console.error("Usage:");
    console.error("  npx tsx scripts/renderTemplate.ts prompts/sample.json");
    console.error("  npx tsx scripts/renderTemplate.ts prompts/sample.json --id test-001");
    console.error("  npx tsx scripts/renderTemplate.ts --spec outputs/spec_test-001.json");
    process.exit(1);
  }

  const absPromptFile = path.resolve(promptFile);
  if (!fs.existsSync(absPromptFile)) {
    console.error("Prompt file not found:", absPromptFile);
    process.exit(1);
  }

  const prompts: Array<{ id: string; prompt: string }> = JSON.parse(
    fs.readFileSync(absPromptFile, "utf-8")
  );

  const toProcess = onlyId
    ? prompts.filter((p) => String(p.id) === onlyId)
    : prompts;

  if (toProcess.length === 0) {
    console.error(onlyId ? `No prompt found with id "${onlyId}"` : "No prompts in file");
    process.exit(1);
  }

  const { analyzeIntent, isMultiSceneResult, resolveTemplate, resolveMultiScene } = await loadPipeline();
  const outputDir = path.join(PROJECT_ROOT, "outputs");
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\nProcessing ${toProcess.length} prompt(s)...\n`);

  for (const entry of toProcess) {
    const jobId = String(entry.id);

    // Skip if both video and spec already exist
    const existingVideo = path.join(outputDir, `video_${jobId}.mp4`);
    const existingSpec = path.join(outputDir, `spec_${jobId}.json`);
    if (fs.existsSync(existingVideo) && fs.existsSync(existingSpec)) {
      console.log(`━━━ [${jobId}] Already rendered — skipping`);
      continue;
    }

    console.log(`━━━ [${jobId}] "${entry.prompt.slice(0, 60)}..." ━━━`);

    // Step 1: Intent analysis (LLM call)
    console.log("  → Analyzing intent...");
    const intent = await analyzeIntent(entry.prompt);

    if (isMultiSceneResult(intent)) {
      // ── Multi-scene path ──────────────────────────────────────────
      console.log(`  → Multi-scene: ${intent.scenes.length} scenes (confidence: ${intent.confidence})`);
      console.log(`  → Reasoning: ${intent.reasoning}`);

      if (intent.confidence === "low") {
        console.log("  ✗ Low confidence — skipping\n");
        continue;
      }

      const resolution = resolveMultiScene(intent);
      if (resolution.mode === "legacy") {
        console.log(`  ✗ Multi-scene resolution failed: ${resolution.error}`);
        console.log("  → Skipping (would need legacy pipeline)\n");
        continue;
      }

      // Save spec
      const specPath = path.join(outputDir, `spec_${jobId}.json`);
      fs.writeFileSync(specPath, JSON.stringify({ scenes: resolution.scenes }, null, 2), "utf-8");
      console.log(`  → Spec saved: ${specPath}`);

      // Render
      try {
        const videoPath = renderMultiSceneToVideo(jobId, resolution.scenes!, resolution.totalDurationFrames!);
        console.log(`  ✓ Video saved: ${videoPath}\n`);
      } catch {
        console.error(`  ✗ Multi-scene render failed for ${jobId}\n`);
      }
      continue;
    }

    // ── Single-scene path ──────────────────────────────────────────
    console.log(`  → Template: ${intent.templateId} (confidence: ${intent.confidence})`);
    console.log(`  → Reasoning: ${intent.reasoning}`);

    if (intent.confidence === "low") {
      console.log("  ✗ Low confidence — skipping (would need legacy pipeline)\n");
      continue;
    }

    // Step 2: Resolve & validate params
    const resolution = resolveTemplate(intent);
    if (resolution.mode === "legacy") {
      console.log(`  ✗ Template resolution failed: ${resolution.error}`);
      console.log("  → Skipping (would need legacy pipeline)\n");
      continue;
    }

    // Step 3: Save spec
    const specPath = path.join(outputDir, `spec_${jobId}.json`);
    const spec = { templateId: resolution.templateId, params: resolution.params };
    fs.writeFileSync(specPath, JSON.stringify(spec, null, 2), "utf-8");
    console.log(`  → Spec saved: ${specPath}`);

    // Step 4: Render video locally
    const duration = (resolution.params as Record<string, unknown>).duration as number ?? 6;
    try {
      const videoPath = renderToVideo(jobId, resolution.templateId!, resolution.params!, duration);
      console.log(`  ✓ Video saved: ${videoPath}\n`);
    } catch {
      console.error(`  ✗ Render failed for ${jobId}\n`);
    }
  }

  console.log("Done!");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
