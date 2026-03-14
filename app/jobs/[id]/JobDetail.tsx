"use client";

import { useState, useCallback } from "react";
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

  const handleUpdate = useCallback((event: SSEEvent) => {
    setJob((prev) => ({
      ...prev,
      step: event.step > 0 ? event.step : prev.step,
      status: event.status,
      error: event.error ?? prev.error,
      detailed_prompt: event.detailedPrompt ?? prev.detailed_prompt,
      spec_json: event.specJson ?? prev.spec_json,
      video_r2_key: event.videoKey ?? prev.video_r2_key,
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
        <ProgressIndicator step={job.step} status={job.status} error={job.error} />
      </div>

      {/* Video */}
      <VideoPlayer videoKey={job.video_r2_key} />

      {/* Spec */}
      <SpecViewer spec={job.spec_json} />
    </div>
  );
}
