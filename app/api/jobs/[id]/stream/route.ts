import { NextRequest } from "next/server";
import { getJob } from "@/lib/db";
import { subscribe, unsubscribe } from "@/lib/queue";
import type { SSEEvent } from "@/lib/types";
import { STEP_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;

  const job = await getJob(jobId);
  if (!job) {
    return new Response("Job not found", { status: 404 });
  }

  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
      subscribe(jobId, controller);

      // Send the current job state immediately so the client has something to render
      const currentEvent: SSEEvent = {
        jobId,
        step: job.step,
        status: job.status,
        label: STEP_LABELS[job.step] ?? job.status,
        specJson: job.spec_json ?? undefined,
        videoKey: job.video_r2_key ?? undefined,
      };
      const encoded = new TextEncoder().encode(
        "data: " + JSON.stringify(currentEvent) + "\n\n"
      );
      c.enqueue(encoded);

      // If already terminal, close immediately
      if (job.status === "done" || job.status === "failed") {
        unsubscribe(jobId, controller);
        c.close();
      }
    },
    cancel() {
      unsubscribe(jobId, controller);
    },
  });

  req.signal.addEventListener("abort", () => {
    try {
      unsubscribe(jobId, controller);
    } catch {
      // already closed
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
