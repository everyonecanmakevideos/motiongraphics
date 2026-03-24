import { NextResponse } from "next/server";
import { getJob, initDb } from "@/lib/db";

export async function GET(
  _req: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    await initDb();
    const { jobId } = await context.params;
    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      templateId: job.template_id,
      params: job.template_params,
    });
  } catch (err) {
    console.error("[GET /api/studio/props/:jobId]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

