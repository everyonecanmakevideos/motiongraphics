type HeraOutputConfig = {
  aspect_ratio: "16:9" | "9:16" | "1:1" | "4:5";
  fps: 30;
  resolution: "1080p";
  format: "mp4";
};

type HeraCreateResponse = {
  video_id: string;
  project_url?: string;
};

type HeraOutputStatus = {
  status?: string;
  file_url?: string;
};

type HeraStatusResponse = {
  status: "in-progress" | "success" | "failed";
  project_url?: string;
  outputs?: HeraOutputStatus[];
  error?: string;
};

const DEFAULT_BASE_URL = "https://api.hera.video";

function getBaseUrl(): string {
  return (process.env.HERA_API_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function getApiKey(): string | null {
  return process.env.HERA_API_KEY ?? null;
}

export function hasHeraConfig(): boolean {
  return Boolean(getApiKey());
}

function parseAspectRatio(prompt: string): HeraOutputConfig["aspect_ratio"] {
  const match = prompt.match(/aspect ratio:\s*(16:9|9:16|1:1|4:5)/i);
  const ratio = match?.[1] as HeraOutputConfig["aspect_ratio"] | undefined;
  return ratio ?? "16:9";
}

function parseDurationSeconds(prompt: string): number | undefined {
  const match = prompt.match(/total duration:\s*(\d+)\s*s/i);
  if (!match) return undefined;
  const duration = Number(match[1]);
  if (!Number.isFinite(duration)) return undefined;
  return Math.min(15, Math.max(2, Math.round(duration)));
}

async function heraFetch<T>(pathname: string, init: RequestInit): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("HERA_API_KEY is not set");
  }

  const response = await fetch(getBaseUrl() + pathname, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Hera API ${response.status}: ${text.slice(0, 300)}`);
  }

  return response.json() as Promise<T>;
}

export async function createHeraVideoJob(prompt: string): Promise<HeraCreateResponse> {
  const payload = {
    prompt,
    duration_seconds: parseDurationSeconds(prompt),
    outputs: [
      {
        aspect_ratio: parseAspectRatio(prompt),
        fps: 30,
        resolution: "1080p",
        format: "mp4",
      } satisfies HeraOutputConfig,
    ],
  };

  return heraFetch<HeraCreateResponse>("/videos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getHeraVideoStatus(videoId: string): Promise<HeraStatusResponse> {
  return heraFetch<HeraStatusResponse>(`/videos/${encodeURIComponent(videoId)}`, {
    method: "GET",
  });
}

export async function waitForHeraVideo(videoId: string): Promise<{
  videoUrl: string;
  projectUrl?: string;
}> {
  const timeoutMs = Number(process.env.HERA_TIMEOUT_MS ?? "600000");
  const pollMs = Number(process.env.HERA_POLL_INTERVAL_MS ?? "5000");
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const status = await getHeraVideoStatus(videoId);

    if (status.status === "failed") {
      throw new Error(status.error ?? "Hera job failed");
    }

    if (status.status === "success") {
      const videoUrl = status.outputs?.find((output) => output.status === "success" && output.file_url)?.file_url
        ?? status.outputs?.find((output) => output.file_url)?.file_url;

      if (!videoUrl) {
        throw new Error("Hera job succeeded but no file_url was returned");
      }

      return {
        videoUrl,
        projectUrl: status.project_url,
      };
    }

    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  throw new Error("Timed out waiting for Hera video generation");
}
