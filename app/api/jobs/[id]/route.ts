import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await getJob(id);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    return NextResponse.json(job);
  } catch (err) {
    console.error("[GET /api/jobs/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
