"use client";

import { useState } from "react";
import SkeletonLoader from "./SkeletonLoader";

interface Props {
  videoKey: string | null;
}

export default function VideoPlayer({ videoKey }: Props) {
  const [ready, setReady] = useState(false);

  if (!videoKey) {
    return <SkeletonLoader variant="video" />;
  }

  // Use the assets proxy URL directly as src — the browser follows the 307
  // redirect to the Cloudflare R2 presigned URL natively, no pre-fetch needed.
  const src = "/api/assets?key=" + encodeURIComponent(videoKey);

  return (
    <div className="glass-strong rounded-2xl overflow-hidden animate-fade-in">
      <video
        src={src}
        controls
        autoPlay
        loop
        onCanPlay={() => setReady(true)}
        className={"w-full transition-opacity duration-500 " + (ready ? "opacity-100" : "opacity-80")}
      />
      <div className="px-4 py-2.5 flex justify-end border-t border-white/5">
        <a
          href={src}
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
