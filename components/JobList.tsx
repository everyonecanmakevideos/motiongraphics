import Link from "next/link";
import type { Job, JobStatus } from "@/lib/types";

function StatusBadge({ status }: { status: JobStatus }) {
  // Simplified: map 8 internal statuses to 5 user-facing labels
  const map: Record<string, { label: string; cls: string }> = {
    queued: { label: "Queued", cls: "bg-white/5 text-neutral-400 border border-white/10" },
    generating: {
      label: "Generating",
      cls: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20",
    },
    rendering: {
      label: "Rendering",
      cls: "bg-violet-500/10 text-violet-300 border border-violet-500/20 animate-pulse",
    },
    done: { label: "Done", cls: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" },
    failed: { label: "Failed", cls: "bg-red-500/10 text-red-300 border border-red-500/20" },
  };

  let key = "queued";
  if (status === "done") key = "done";
  else if (status === "failed") key = "failed";
  else if (status === "rendering") key = "rendering";
  else if (
    status === "spec_generating" ||
    status === "spec_ready" ||
    status === "code_generating" ||
    status === "code_ready"
  )
    key = "generating";

  const { label, cls } = map[key];
  return (
    <span className={"inline-block px-2.5 py-0.5 rounded-full text-xs font-medium " + cls}>
      {label}
    </span>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  if (h > 0) return h + "h ago";
  if (m > 0) return m + "m ago";
  return "just now";
}

export default function JobList({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) {
    return (
      <div className="text-sm text-neutral-500 py-8 text-center glass rounded-2xl">
        No jobs yet. Submit a prompt above to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl glass-strong">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium w-28">ID</th>
            <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Prompt</th>
            <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium w-32">Status</th>
            <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium w-24">When</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
            >
              <td className="px-4 py-3.5 font-mono text-xs text-neutral-500">
                <Link
                  href={"/jobs/" + job.id}
                  className="hover:text-indigo-400 transition-colors"
                >
                  {job.id.slice(0, 8)}
                </Link>
              </td>
              <td className="px-4 py-3.5 text-neutral-300 max-w-xs">
                <Link
                  href={"/jobs/" + job.id}
                  className="hover:text-white transition-colors line-clamp-1"
                >
                  {job.prompt}
                </Link>
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={job.status} />
              </td>
              <td className="px-4 py-3.5 text-xs text-neutral-600">{timeAgo(job.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
