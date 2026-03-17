import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { uploadBuffer, uploadText } from "../r2";
import type { ResolvedScene } from "../templates/sceneTypes";

const PROJECT_ROOT = path.resolve(process.cwd());

/**
 * Renders a template scene by passing inputProps to Remotion's TemplateScene composition.
 * No source file is overwritten — the template component is pre-compiled.
 */
export async function renderTemplate(
  jobId: string,
  templateId: string,
  params: Record<string, unknown>,
  durationSec: number
): Promise<{ videoKey: string; specKey: string }> {
  const durationFrames = Math.floor(durationSec * 30);
  const width = 1920;
  const height = 1080;

  const videoLocalPath = path.join(PROJECT_ROOT, "outputs", "video_" + jobId + ".mp4");
  const propsFilePath = path.join(PROJECT_ROOT, "outputs", "props_" + jobId + ".json");

  // Ensure outputs directory exists
  fs.mkdirSync(path.join(PROJECT_ROOT, "outputs"), { recursive: true });

  // Write inputProps to a temp JSON file
  const inputProps = { templateId, params };
  fs.writeFileSync(propsFilePath, JSON.stringify(inputProps, null, 2), "utf-8");

  // Remotion render using TemplateScene composition
  try {
    execSync(
      "npx remotion render src/index.ts TemplateScene " +
        videoLocalPath +
        " --props=" +
        propsFilePath +
        " --concurrency=1 --gl=swangle --disable-web-security",
      {
        stdio: "pipe",
        cwd: PROJECT_ROOT,
        env: {
          ...process.env,
          REMOTION_APP_DURATION_FRAMES: String(durationFrames),
          REMOTION_APP_VIDEO_WIDTH: String(width),
          REMOTION_APP_VIDEO_HEIGHT: String(height),
        },
      }
    );
  } catch (err) {
    const e = err as { stderr?: Buffer; stdout?: Buffer; message?: string };
    const stderr = e.stderr?.toString() ?? "";
    const stdout = e.stdout?.toString() ?? "";
    const detail = (stderr + "\n" + stdout).trim();
    // Clean up props file
    try { fs.unlinkSync(propsFilePath); } catch { /* non-fatal */ }
    throw new Error(
      "Template render failed: " +
        (detail || e.message || "Unknown error").slice(0, 1000)
    );
  }

  // Upload to R2
  const videoKey = "videos/video_" + jobId + ".mp4";
  const specKey = "specs/spec_" + jobId + ".json";

  const videoBuffer = fs.readFileSync(videoLocalPath);
  await uploadBuffer(videoKey, videoBuffer, "video/mp4");
  await uploadText(specKey, JSON.stringify(inputProps, null, 2), "application/json");

  // Clean up local files
  try { fs.unlinkSync(videoLocalPath); } catch { /* non-fatal */ }
  try { fs.unlinkSync(propsFilePath); } catch { /* non-fatal */ }

  return { videoKey, specKey };
}

/**
 * Renders a multi-scene video using the SceneSequence Remotion composition.
 * Supports both sequential scenes and composite (multi-template) scenes.
 */
export async function renderMultiScene(
  jobId: string,
  scenes: ResolvedScene[],
  totalDurationFrames: number
): Promise<{ videoKey: string; specKey: string }> {
  const width = 1920;
  const height = 1080;

  const videoLocalPath = path.join(PROJECT_ROOT, "outputs", "video_" + jobId + ".mp4");
  const propsFilePath = path.join(PROJECT_ROOT, "outputs", "props_" + jobId + ".json");

  fs.mkdirSync(path.join(PROJECT_ROOT, "outputs"), { recursive: true });

  const inputProps = { scenes };
  fs.writeFileSync(propsFilePath, JSON.stringify(inputProps, null, 2), "utf-8");

  try {
    execSync(
      "npx remotion render src/index.ts SceneSequence " +
        videoLocalPath +
        " --props=" +
        propsFilePath +
        " --concurrency=1 --gl=swangle --disable-web-security",
      {
        stdio: "pipe",
        cwd: PROJECT_ROOT,
        env: {
          ...process.env,
          REMOTION_APP_DURATION_FRAMES: String(totalDurationFrames),
          REMOTION_APP_VIDEO_WIDTH: String(width),
          REMOTION_APP_VIDEO_HEIGHT: String(height),
        },
      }
    );
  } catch (err) {
    const e = err as { stderr?: Buffer; stdout?: Buffer; message?: string };
    const stderr = e.stderr?.toString() ?? "";
    const stdout = e.stdout?.toString() ?? "";
    const detail = (stderr + "\n" + stdout).trim();
    try { fs.unlinkSync(propsFilePath); } catch { /* non-fatal */ }
    throw new Error(
      "Multi-scene render failed: " +
        (detail || e.message || "Unknown error").slice(0, 1000)
    );
  }

  const videoKey = "videos/video_" + jobId + ".mp4";
  const specKey = "specs/spec_" + jobId + ".json";

  const videoBuffer = fs.readFileSync(videoLocalPath);
  await uploadBuffer(videoKey, videoBuffer, "video/mp4");
  await uploadText(specKey, JSON.stringify(inputProps, null, 2), "application/json");

  try { fs.unlinkSync(videoLocalPath); } catch { /* non-fatal */ }
  try { fs.unlinkSync(propsFilePath); } catch { /* non-fatal */ }

  return { videoKey, specKey };
}
