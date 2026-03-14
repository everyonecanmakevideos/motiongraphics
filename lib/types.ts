export type JobStatus =
  | "queued"
  | "expanding"
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
  detailed_prompt: string | null;
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
  detailedPrompt?: string;
}

export const STEP_LABELS: Record<number, string> = {
  1: "Prompt received",
  2: "Expanding prompt...",
  3: "Generating spec (GPT-4o)...",
  4: "Spec ready",
  5: "Generating animation code...",
  6: "Code ready",
  7: "Rendering video...",
  8: "Video ready",
};
