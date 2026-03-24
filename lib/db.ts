import { neon } from "@neondatabase/serverless";
import type { Job, JobProvider, JobStatus } from "./types";

function getSql() {
  const url = process.env.NEON_DATABASE_URL;
  if (!url) throw new Error("NEON_DATABASE_URL is not set");
  return neon(url);
}

export async function createJob(prompt: string): Promise<Job> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO jobs (prompt)
    VALUES (${prompt})
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
  provider?: JobProvider;
  detailed_prompt?: string;
  spec_r2_key?: string;
  code_r2_key?: string;
  video_r2_key?: string;
  video_url?: string;
  external_video_id?: string;
  external_project_url?: string;
  spec_json?: object;
  template_id?: string;
  template_params?: object;
  debug_intent_analyzer?: object;
  debug_intent_creative?: object;
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
    } else if (key === "provider") {
      await sql`UPDATE jobs SET provider = ${value as string}, updated_at = now() WHERE id = ${id}`;
    } else if (key === "detailed_prompt") {
      await sql`UPDATE jobs SET detailed_prompt = ${value as string}, updated_at = now() WHERE id = ${id}`;
    } else if (key === "spec_r2_key") {
      await sql`UPDATE jobs SET spec_r2_key = ${value as string}, updated_at = now() WHERE id = ${id}`;
    } else if (key === "code_r2_key") {
      await sql`UPDATE jobs SET code_r2_key = ${value as string}, updated_at = now() WHERE id = ${id}`;
    } else if (key === "video_r2_key") {
      await sql`UPDATE jobs SET video_r2_key = ${value as string}, updated_at = now() WHERE id = ${id}`;
    } else if (key === "video_url") {
      await sql`UPDATE jobs SET video_url = ${value as string}, updated_at = now() WHERE id = ${id}`;
    } else if (key === "external_video_id") {
      await sql`UPDATE jobs SET external_video_id = ${value as string}, updated_at = now() WHERE id = ${id}`;
    } else if (key === "external_project_url") {
      await sql`UPDATE jobs SET external_project_url = ${value as string}, updated_at = now() WHERE id = ${id}`;
    } else if (key === "spec_json") {
      await sql`UPDATE jobs SET spec_json = ${JSON.stringify(value)}::jsonb, updated_at = now() WHERE id = ${id}`;
    } else if (key === "template_id") {
      await sql`UPDATE jobs SET template_id = ${value as string}, updated_at = now() WHERE id = ${id}`;
    } else if (key === "template_params") {
      await sql`UPDATE jobs SET template_params = ${JSON.stringify(value)}::jsonb, updated_at = now() WHERE id = ${id}`;
    } else if (key === "debug_intent_analyzer") {
      await sql`UPDATE jobs SET debug_intent_analyzer = ${JSON.stringify(value)}::jsonb, updated_at = now() WHERE id = ${id}`;
    } else if (key === "debug_intent_creative") {
      await sql`UPDATE jobs SET debug_intent_creative = ${JSON.stringify(value)}::jsonb, updated_at = now() WHERE id = ${id}`;
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
      status       TEXT NOT NULL DEFAULT 'queued',
      step         INTEGER NOT NULL DEFAULT 1,
      error        TEXT,
      provider     TEXT,
      spec_r2_key  TEXT,
      code_r2_key  TEXT,
      video_r2_key TEXT,
      video_url    TEXT,
      external_video_id TEXT,
      external_project_url TEXT,
      spec_json    JSONB,
      created_at   TIMESTAMPTZ DEFAULT now(),
      updated_at   TIMESTAMPTZ DEFAULT now()
    )
  `;
  // Migration for existing tables
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS detailed_prompt TEXT`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS provider TEXT`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS template_id TEXT`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS template_params JSONB`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS debug_intent_analyzer JSONB`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS debug_intent_creative JSONB`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS video_url TEXT`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS external_video_id TEXT`;
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS external_project_url TEXT`;
}
