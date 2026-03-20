import { neon } from "@neondatabase/serverless";
import type { Job, JobStatus } from "./types";

function getSql() {
  const url = process.env.NEON_DATABASE_URL;
  if (!url) throw new Error("NEON_DATABASE_URL is not set");
  return neon(url);
}

export async function createJob(
  prompt: string,
  opts?: { aspect_ratio?: Job["aspect_ratio"]; duration_sec?: number }
): Promise<Job> {
  const sql = getSql();
  const aspectRatio = opts?.aspect_ratio ?? null;
  const durationSec = typeof opts?.duration_sec === "number" ? opts.duration_sec : null;
  const rows = await sql`
    INSERT INTO jobs (prompt, aspect_ratio, duration_sec)
    VALUES (${prompt}, ${aspectRatio}, ${durationSec})
    RETURNING *
  `;
  return rows[0] as Job;
}

export async function getJob(id: string): Promise<Job | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM jobs WHERE id = ${id}
  `;
  return (rows[0] as Job) ?? null;
}

export interface UpdateJobFields {
  status?: JobStatus;
  step?: number;
  error?: string;
  detailed_prompt?: string;
  spec_r2_key?: string;
  code_r2_key?: string;
  video_r2_key?: string;
  spec_json?: object;
  template_id?: string;
  template_params?: object;
}

export async function updateJob(id: string, fields: UpdateJobFields): Promise<void> {
  const sql = getSql();
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;

  // Build SET clause dynamically using tagged template would require dynamic SQL.
  // Use individual updates to keep it simple and safe.
  for (const [key, value] of entries) {
    if (key === "status") {
      await sql`UPDATE jobs SET status = ${value as string}, updated_at = now() WHERE id = ${id}`;
    } else if (key === "step") {
      await sql`UPDATE jobs SET step = ${value as number}, updated_at = now() WHERE id = ${id}`;
    } else if (key === "error") {
      await sql`UPDATE jobs SET error = ${value as string}, updated_at = now() WHERE id = ${id}`;
    } else if (key === "detailed_prompt") {
      await sql`UPDATE jobs SET detailed_prompt = ${value as string}, updated_at = now() WHERE id = ${id}`;
    } else if (key === "spec_r2_key") {
      await sql`UPDATE jobs SET spec_r2_key = ${value as string}, updated_at = now() WHERE id = ${id}`;
    } else if (key === "code_r2_key") {
      await sql`UPDATE jobs SET code_r2_key = ${value as string}, updated_at = now() WHERE id = ${id}`;
    } else if (key === "video_r2_key") {
      await sql`UPDATE jobs SET video_r2_key = ${value as string}, updated_at = now() WHERE id = ${id}`;
    } else if (key === "spec_json") {
      await sql`UPDATE jobs SET spec_json = ${JSON.stringify(value)}::jsonb, updated_at = now() WHERE id = ${id}`;
    } else if (key === "template_id") {
      await sql`UPDATE jobs SET template_id = ${value as string}, updated_at = now() WHERE id = ${id}`;
    } else if (key === "template_params") {
      await sql`UPDATE jobs SET template_params = ${JSON.stringify(value)}::jsonb, updated_at = now() WHERE id = ${id}`;
    }
  }
}

export async function listJobs(limit = 20): Promise<Job[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM jobs
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows as Job[];
}

export async function initDb(): Promise<void> {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      prompt       TEXT NOT NULL,
      detailed_prompt TEXT,
      aspect_ratio TEXT,
      duration_sec DOUBLE PRECISION,
      status       TEXT NOT NULL DEFAULT 'queued',
      step         INTEGER NOT NULL DEFAULT 1,
      error        TEXT,
      spec_r2_key  TEXT,
      code_r2_key  TEXT,
      video_r2_key TEXT,
      spec_json    JSONB,
      template_id  TEXT,
      template_params JSONB,
      created_at   TIMESTAMPTZ DEFAULT now(),
      updated_at   TIMESTAMPTZ DEFAULT now()
    )
  `;
  // Migration for existing tables
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS detailed_prompt TEXT`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS aspect_ratio TEXT`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS duration_sec DOUBLE PRECISION`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS template_id TEXT`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS template_params JSONB`;
}
