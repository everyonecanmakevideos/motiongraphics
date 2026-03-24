"use client";

import { useState, useCallback, useRef } from "react";
import ProgressIndicator from "@/components/ProgressIndicator";
import SpecViewer from "@/components/SpecViewer";
import VideoPlayer from "@/components/VideoPlayer";
import LiveUpdater from "./LiveUpdater";
import type { Job, SSEEvent } from "@/lib/types";
import Link from "next/link";

interface Props {
  initialJob: Job;
}

export default function JobDetail({ initialJob }: Props) {
  const [job, setJob] = useState<Job>(initialJob);
  const [trace, setTrace] = useState<Array<SSEEvent & { at: number }>>([]);
  const studioUrl = process.env.NEXT_PUBLIC_REMOTION_STUDIO_URL ?? "http://localhost:3002";
  const [pipelineMode, setPipelineMode] = useState<"template" | "legacy" | undefined>(
    initialJob.template_id ? "template" : undefined
  );
  const lastTraceKeyRef = useRef<string>("");

  const handleUpdate = useCallback((event: SSEEvent) => {
    if (event.pipelineMode) setPipelineMode(event.pipelineMode);

    const traceKey = [event.step, event.status, event.templateId ?? "", event.error ?? ""].join("|");
    if (traceKey !== lastTraceKeyRef.current) {
      lastTraceKeyRef.current = traceKey;
      setTrace((prev) => {
        const next = [...prev, { ...event, at: Date.now() }];
        return next.slice(-25);
      });
    }

    setJob((prev) => ({
      ...prev,
      step: event.step > 0 ? event.step : prev.step,
      status: event.status,
      error: event.error ?? prev.error,
      detailed_prompt: event.detailedPrompt ?? prev.detailed_prompt,
      spec_json: event.specJson ?? prev.spec_json,
      video_r2_key: event.videoKey ?? prev.video_r2_key,
      template_id: event.templateId ?? prev.template_id,
      template_params: event.templateParams ?? prev.template_params,
    }));
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <LiveUpdater jobId={job.id} initialJob={initialJob} onUpdate={handleUpdate} />

      {/* Header */}
      <div>
        <Link
          href="/"
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors inline-flex items-center gap-1 mb-3"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to jobs
        </Link>
        <h1 className="text-lg font-semibold text-white">Job {job.id.slice(0, 8)}</h1>
        <p className="text-sm text-neutral-400 mt-1 line-clamp-2">{job.prompt}</p>
        {job.detailed_prompt && (
          <details className="mt-2">
            <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors">
              View expanded prompt
            </summary>
            <p className="text-xs text-neutral-400 mt-1 whitespace-pre-wrap bg-white/5 rounded-lg p-3 border border-white/10">
              {job.detailed_prompt}
            </p>
          </details>
        )}
      </div>

      {/* Progress */}
      <div className="glass-strong rounded-2xl p-5">
        {pipelineMode && (
          <div className="flex items-center gap-2 mb-3">
            <span className={
              "text-xs px-2 py-0.5 rounded-full font-medium " +
              (pipelineMode === "template"
                ? "bg-indigo-500/20 text-indigo-300"
                : "bg-amber-500/20 text-amber-300")
            }>
              {pipelineMode === "template" ? "Template" : "Legacy"}
            </span>
            {job.template_id && (
              <span className="text-xs text-neutral-500">
                {job.template_id}
              </span>
            )}
          </div>
        )}
        <ProgressIndicator step={job.step} status={job.status} error={job.error} pipelineMode={pipelineMode} />

        <div className="mt-4">
          <details>
            <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors">
              Step trace (SSE/polling events)
            </summary>
            <div className="mt-3 text-xs text-neutral-400 whitespace-pre-wrap bg-white/5 rounded-lg p-3 border border-white/10">
              {trace.length === 0
                ? "No events yet."
                : trace
                    .map((e) => {
                      const t = new Date(e.at).toLocaleTimeString();
                      return `[${t}] step=${e.step} status=${e.status} label=${e.label}${e.templateId ? ` template=${e.templateId}` : ""}${e.error ? ` error=${e.error}` : ""}`;
                    })
                    .join("\n")}
            </div>
          </details>
        </div>

        {job.template_id && job.template_params && (
          <div className="mt-4">
            <details>
              <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors">
                Template params (creativeEnhancer output + resolution)
              </summary>
              <pre className="mt-3 text-xs text-neutral-400 whitespace-pre-wrap bg-white/5 rounded-lg p-3 border border-white/10">
                {JSON.stringify(job.template_params, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      {/* Video */}
      {job.status === "failed" ? (
        <div className="glass-strong rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
          <svg className="w-10 h-10 text-red-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-neutral-300 font-medium">Video generation failed</p>
          {job.error && (
            <p className="text-xs text-neutral-500 max-w-md">
              {job.error.length > 200 ? job.error.slice(0, 200) + "..." : job.error}
            </p>
          )}
        </div>
      ) : job.status === "done" && !job.video_r2_key ? (
        <div className="glass-strong rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-neutral-200 font-medium">Preview is ready</p>
          <p className="text-xs text-neutral-500 max-w-md">
            This job was created in preview mode, so rendering was skipped. Open Remotion Studio to inspect animation without rendering.
          </p>
          <a
            href={studioUrl + "?jobId=" + job.id}
            target="_blank"
            rel="noreferrer"
            className="mt-1 px-4 py-2 text-xs rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-neutral-200 transition-colors"
          >
            Open Remotion Studio
          </a>
        </div>
      ) : (
        <VideoPlayer videoKey={job.video_r2_key} />
      )}

      {/* Spec */}
      <SpecViewer spec={job.spec_json} />
    </div>
  );
}
