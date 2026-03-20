"use client";

import PromptForm from "@/components/PromptForm";
import JobList from "@/components/JobList";
import type { Job } from "@/lib/types";

export default function HomeClient({ jobs }: { jobs: Job[] }) {
  return (
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <div className="text-center pt-4">
        <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-3">
          Generate Motion Graphics
        </h1>
        <p className="text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
          Describe your animation in plain English. The pipeline generates a motion spec,
          writes Remotion code, and renders your video.
        </p>
      </div>

      {/* Form card with glow */}
      <div className="relative max-w-2xl mx-auto w-full">
        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-3xl blur-2xl pointer-events-none" />
        <div className="relative glass-strong rounded-2xl p-6">
          <PromptForm />
        </div>
      </div>

      {/* Recent jobs */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
            Recent Jobs
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-neutral-700/50 to-transparent" />
        </div>
        <JobList jobs={jobs} />
      </div>
    </div>
  );
}

