import { NextRequest, NextResponse } from "next/server";
import { createJob, listJobs } from "@/lib/db";
import { enqueueJob } from "@/lib/queue";
import { initDb } from "@/lib/db";

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

function normalizeAspectRatio(input: unknown): string {
  const allowed = new Set(["16:9", "9:16", "1:1", "4:5"]);
  const value = typeof input === "string" ? input : "16:9";
  return allowed.has(value) ? value : "16:9";
}

function normalizeDuration(input: unknown): number {
  const n = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(n)) return 6;
  return Math.min(15, Math.max(2, Math.round(n)));
}

export async function POST(req: NextRequest) {
  try {
    await ensureDb();
    const body = await req.json();
    const prompt = (body.prompt ?? "").trim();
    const aspectRatio = normalizeAspectRatio(body.aspectRatio);
    const durationSec = normalizeDuration(body.durationSec);
    const previewOnly = Boolean(body.previewOnly);

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (prompt.length > 3000) {
      return NextResponse.json({ error: "Prompt too long (max 3000 chars)" }, { status: 400 });
    }

    const decoratedPrompt =
      prompt +
      `\n\nConstraints:\n- Aspect ratio: ${aspectRatio}\n- Total duration: ${durationSec}s`;

    const job = await createJob(decoratedPrompt);
    enqueueJob(job.id, { previewOnly });

    return NextResponse.json({ id: job.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/jobs]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await ensureDb();
    const jobs = await listJobs(20);
    return NextResponse.json(jobs);
  } catch (err) {
    console.error("[GET /api/jobs]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
