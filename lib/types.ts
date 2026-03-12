export type JobStatus =
  | "queued"
  | "spec_generating"
  | "spec_ready"
  | "code_generating"
  | "code_ready"
  | "rendering"
  | "done"
  | "failed";

export interface Job {
  id: string;
  prompt: string;
  status: JobStatus;
  step: number;
  error: string | null;
  spec_r2_key: string | null;
  code_r2_key: string | null;
  video_r2_key: string | null;
  spec_json: object | null;
  created_at: string;
  updated_at: string;
}

export interface SSEEvent {
  jobId: string;
  step: number;
  status: JobStatus;
  label: string;
  error?: string;
  specJson?: object;
  videoKey?: string;
}

export const STEP_LABELS: Record<number, string> = {
  1: "Prompt received",
  2: "Generating spec (GPT-4o)...",
  3: "Spec ready",
  4: "Generating animation code...",
  5: "Code ready",
  6: "Rendering video...",
  7: "Video ready",
};
