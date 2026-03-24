"use client";

import { useState, useCallback, useRef } from "react";
import ProgressIndicator from "@/components/ProgressIndicator";
import SpecViewer from "@/components/SpecViewer";
import VideoPlayer from "@/components/VideoPlayer";
import LiveUpdater from "./LiveUpdater";
import type { Job, SSEEvent } from "@/lib/types";
import Link from "next/link";
import { getDisplayPrompt } from "@/lib/promptDisplay";

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
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <LiveUpdater jobId={job.id} initialJob={initialJob} onUpdate={handleUpdate} />

      {/* Header */}
      <div className="glass-strong rounded-[28px] p-6 sm:p-7">
        <Link
          href="/"
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors inline-flex items-center gap-1 mb-4"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to jobs
        </Link>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-neutral-300 font-medium">
            Job {job.id.slice(0, 8)}
          </span>
          {pipelineMode && (
            <span className={
              "text-[11px] px-2.5 py-1 rounded-full font-medium border " +
              (pipelineMode === "template"
                ? "border-indigo-400/20 bg-indigo-500/10 text-indigo-300"
                : "border-amber-400/20 bg-amber-500/10 text-amber-300")
            }>
              {pipelineMode === "template" ? "Template Pipeline" : "Legacy Pipeline"}
            </span>
          )}
          {job.template_id && (
            <span className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-neutral-400">
              {job.template_id}
            </span>
          )}
        </div>

        <h1 className="text-sm sm:text-base lg:text-lg font-medium text-white/85 leading-relaxed max-w-xl break-words">
          {getDisplayPrompt(job.prompt)}
        </h1>
        <p className="text-sm text-neutral-500 mt-2">
          Live render state, output preview, and pipeline debug details.
        </p>

        {job.detailed_prompt && (
          <details className="mt-4">
            <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors">
              View expanded prompt
            </summary>
            <p className="text-xs text-neutral-400 mt-2 whitespace-pre-wrap bg-white/5 rounded-lg p-3 border border-white/10">
              {job.detailed_prompt}
            </p>
          </details>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="flex flex-col gap-6">
          <div className="glass-strong rounded-[28px] p-5 sm:p-6">
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Pipeline Status</p>
              <p className="text-sm text-neutral-400 mt-1">Tracking analysis, render, and final delivery.</p>
            </div>
            <ProgressIndicator step={job.step} status={job.status} error={job.error} pipelineMode={pipelineMode} />
          </div>

          {job.status === "failed" ? (
            <div className="glass-strong rounded-[28px] p-8 flex flex-col items-center gap-3 text-center">
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
            <div className="glass-strong rounded-[28px] p-8 flex flex-col items-center gap-3 text-center">
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

          <SpecViewer spec={job.spec_json} />
        </div>

        <div className="glass-strong rounded-[28px] p-5 sm:p-6 xl:sticky xl:top-24">
          <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Debug</p>
          <p className="text-sm text-neutral-400 mt-1">
            Keep the low-level trace nearby without overpowering the final render.
          </p>

          <div className="mt-5 space-y-4">
            <details>
              <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors">
                Step trace (SSE/polling events)
              </summary>
              <div className="mt-3 text-xs text-neutral-400 whitespace-pre-wrap bg-white/5 rounded-lg p-3 border border-white/10 max-h-72 overflow-y-auto">
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

            {job.template_id && job.template_params && (
              <details>
                <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors">
                  Template params
                </summary>
                <pre className="mt-3 text-xs text-neutral-400 whitespace-pre-wrap bg-white/5 rounded-lg p-3 border border-white/10 max-h-80 overflow-y-auto">
                  {JSON.stringify(job.template_params, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
