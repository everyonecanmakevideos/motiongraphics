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

export async function POST(req: NextRequest) {
  try {
    await ensureDb();
    const body = await req.json();
    const prompt = (body.prompt ?? "").trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (prompt.length > 3000) {
      return NextResponse.json({ error: "Prompt too long (max 3000 chars)" }, { status: 400 });
    }

    const job = await createJob(prompt);
    enqueueJob(job.id);

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
