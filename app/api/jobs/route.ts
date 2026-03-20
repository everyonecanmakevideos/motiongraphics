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
    const aspectRatio = typeof body.aspect_ratio === "string" ? body.aspect_ratio.trim() : "";
    const durationSecRaw = typeof body.duration_sec === "number" ? body.duration_sec : Number(body.duration_sec);

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (prompt.length > 3000) {
      return NextResponse.json({ error: "Prompt too long (max 3000 chars)" }, { status: 400 });
    }

    const allowedAspectRatios = new Set(["16:9", "9:16", "1:1", "4:3", "3:4"]);
    const finalAspectRatio = allowedAspectRatios.has(aspectRatio) ? aspectRatio : "16:9";
    const finalDurationSec = Number.isFinite(durationSecRaw)
      ? Math.max(2, Math.min(30, Math.round(durationSecRaw)))
      : 6;

    const job = await createJob(prompt, {
      aspect_ratio: finalAspectRatio as "16:9" | "9:16" | "1:1" | "4:3" | "3:4",
      duration_sec: finalDurationSec,
    });
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
