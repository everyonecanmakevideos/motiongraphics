"use client";

import { useState } from "react";
import type { JobProvider } from "@/lib/types";
import SkeletonLoader from "./SkeletonLoader";

interface Props {
  videoKey: string | null;
  videoUrl?: string | null;
  provider?: JobProvider | null;
}

export default function VideoPlayer({ videoKey, videoUrl, provider }: Props) {
  const [ready, setReady] = useState(false);

  if (!videoKey && !videoUrl) {
    return <SkeletonLoader variant="video" />;
  }

  // Use the assets proxy URL directly as src — the browser follows the 307
  // redirect to the Cloudflare R2 presigned URL natively, no pre-fetch needed.
  const src = videoUrl
    ? videoUrl
    : "/api/assets?key=" + encodeURIComponent(videoKey as string);
  const downloadHref = videoKey
    ? "/api/assets?key=" +
      encodeURIComponent(videoKey) +
      "&download=1&filename=" +
      encodeURIComponent((videoKey.split("/").pop() || "video.mp4").replace(/\s+/g, "-"))
    : src;
  const sourceLabel = provider === "hera" ? "Hera fallback output" : "Final MP4 from the pipeline";

  return (
    <div className="glass-strong rounded-[28px] overflow-hidden animate-fade-in border border-white/8">
      <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Rendered Output</p>
          <p className="text-sm text-neutral-300 mt-1">{sourceLabel}</p>
        </div>
        <div className="text-[11px] px-2.5 py-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
          Ready
        </div>
      </div>

      <div className="p-4 sm:p-5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="rounded-2xl overflow-hidden border border-white/6 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <video
            src={src}
            controls
            autoPlay
            loop
            onCanPlay={() => setReady(true)}
            className={"w-full transition-opacity duration-500 " + (ready ? "opacity-100" : "opacity-80")}
          />
        </div>
      </div>

      <div className="px-5 py-3 flex items-center justify-end gap-4 border-t border-white/5">
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-neutral-300 hover:text-white transition-colors inline-flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H19m0 0v5.5M19 6l-8.5 8.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H7a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3" />
          </svg>
          Preview
        </a>
        <a
          href={downloadHref}
          download
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download MP4
        </a>
      </div>
    </div>
  );
}
