"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Job, JobStatus } from "@/lib/types";
import { STEP_LABELS, TEMPLATE_STEP_LABELS } from "@/lib/types";
import InlineRemotionPreview from "./InlineRemotionPreview";

export default function PromptForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [durationSec, setDurationSec] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [previewJobId, setPreviewJobId] = useState<string | null>(null);
  const [previewJob, setPreviewJob] = useState<Job | null>(null);
  const [trace, setTrace] = useState<Array<{ step: number; status: JobStatus; label: string; at: number }>>([]);
  const lastTraceKeyRef = useRef<string>("");
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const previewDurationSec = useMemo(() => {
    return typeof durationSec === "number" && Number.isFinite(durationSec) ? durationSec : 6;
  }, [durationSec]);

  async function submitJob(e: React.FormEvent, previewOnly: boolean) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          durationSec,
          previewOnly,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit");
        return;
      }

      if (previewOnly) {
        setPreviewJobId(data.id);
        setPreviewJob(null);
        setTrace([]);
        lastTraceKeyRef.current = "";
      } else {
        router.push("/jobs/" + data.id);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!previewJobId) return;

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/jobs/" + previewJobId);
        if (!res.ok) return;
        const job: Job = await res.json();
        setPreviewJob(job);

        const inferredMode: "template" | "legacy" = job.template_id ? "template" : "legacy";
        const label =
          inferredMode === "template"
            ? TEMPLATE_STEP_LABELS[job.step] ?? STEP_LABELS[job.step] ?? ""
            : STEP_LABELS[job.step] ?? "";
        const traceKey = [inferredMode, job.step, job.status].join("|");
        if (traceKey !== lastTraceKeyRef.current) {
          lastTraceKeyRef.current = traceKey;
          setTrace((prev) => {
            const next = [...prev, { step: job.step, status: job.status, label, at: Date.now() }];
            return next.slice(-25);
          });
        }

        if (job.status === "done" || job.status === "failed") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        }
      } catch {
        // ignore transient errors
      }
    }, 2000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [previewJobId]);

  return (
    <form onSubmit={(e) => submitJob(e, false)} className="flex flex-col gap-4">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={"Describe your animation in simple terms...\n\nExamples:\n- A rocket launches into space\n- Two circles merge into a square\n- Pie chart showing 60% vs 40%"}
        rows={5}
        maxLength={3000}
        disabled={loading}
        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-neutral-100 placeholder-neutral-600 resize-none focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 font-mono transition-all duration-200"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs text-neutral-400 flex flex-col gap-1.5">
          Aspect Ratio
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            disabled={loading}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
          >
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
            <option value="1:1">1:1 (Square)</option>
            <option value="4:5">4:5 (Social)</option>
          </select>
        </label>
        <label className="text-xs text-neutral-400 flex flex-col gap-1.5">
          Length
          <select
            value={durationSec}
            onChange={(e) => setDurationSec(Number(e.target.value))}
            disabled={loading}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
          >
            <option value={4}>4s</option>
            <option value={5}>5s</option>
            <option value={6}>6s</option>
            <option value={8}>8s</option>
            <option value={10}>10s</option>
            <option value={12}>12s</option>
            <option value={15}>15s</option>
          </select>
        </label>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-600">{prompt.length} / 3000</span>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-400">{error}</span>}
          <button
            type="button"
            onClick={(e) => submitJob(e, true)}
            disabled={loading || !prompt.trim()}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 disabled:bg-white/5 disabled:border-white/10 disabled:text-neutral-500 text-neutral-200 text-sm font-medium rounded-xl transition-all duration-200"
          >
            {loading ? "Working..." : "Preview (Instant)"}
          </button>
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 disabled:from-neutral-700 disabled:to-neutral-700 disabled:text-neutral-500 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 disabled:shadow-none flex items-center gap-2"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {loading ? "Submitting..." : "Generate Animation"}
          </button>
        </div>
      </div>

      {previewJobId && (
        <div className="mt-1">
          {previewJob?.status === "done" && previewJob?.template_id && previewJob?.template_params ? (
            <InlineRemotionPreview
              templateId={previewJob.template_id}
              params={previewJob.template_params ?? {}}
              aspectRatio={aspectRatio}
              durationSec={previewDurationSec}
            />
          ) : (
            <div className="glass rounded-2xl p-4 text-center">
              {previewJob?.status === "failed" ? (
                <>
                  <p className="text-sm text-red-400">Preview failed.</p>
                  {previewJob?.error && (
                    <p className="text-xs text-neutral-500 mt-2">{previewJob.error}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-neutral-400">Generating preview…</p>
                </>
              )}
            </div>
          )}

          <div className="mt-3">
            <details open>
              <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors">
                Debug (template, creativeEnhancer, step trace)
              </summary>

              <div className="mt-3 text-xs text-neutral-400 whitespace-pre-wrap bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="mb-2">
                  <span className="text-neutral-500">Job:</span>{" "}
                  <span className="text-neutral-300">{previewJobId}</span>
                </div>

                {previewJob ? (
                  <>
                    <div className="mb-2">
                      <span className="text-neutral-500">pipeline:</span>{" "}
                      <span className="text-neutral-300">
                        {previewJob.template_id ? "template" : "legacy"}
                      </span>
                    </div>

                    <div className="mb-2">
                      <span className="text-neutral-500">template_id:</span>{" "}
                      <span className="text-neutral-300">{previewJob.template_id ?? "(none)"}</span>
                    </div>

                    <div className="mb-2">
                      <span className="text-neutral-500">current step/status:</span>{" "}
                      <span className="text-neutral-300">
                        {previewJob.step}/{previewJob.status}
                      </span>
                    </div>

                    <div className="mb-2">
                      <span className="text-neutral-500">Step trace:</span>
                      {trace.length === 0 ? (
                        <div className="mt-1">Waiting for pipeline steps…</div>
                      ) : (
                        <div className="mt-1">
                          {trace
                            .slice()
                            .reverse()
                            .map((t, idx) => (
                              <div key={t.at + ":" + idx} className="leading-5">
                                • step {t.step}: {t.status} {t.label ? `(${t.label})` : ""}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <details open={false}>
                        <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors">
                          Template params (final output saved)
                        </summary>
                        <pre className="mt-3 whitespace-pre-wrap bg-white/5 rounded-lg p-3 border border-white/10">
                          {previewJob.template_params
                            ? JSON.stringify(previewJob.template_params, null, 2)
                            : "(no template_params yet)"}
                        </pre>
                      </details>
                    </div>

                    <div className="mt-3">
                      <details open={false}>
                        <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors">
                          Intent analyzer vs creativeEnhancer
                        </summary>
                        <div className="mt-3 space-y-3">
                          <div>
                            <div className="text-neutral-500 mb-1">debug_intent_analyzer (raw)</div>
                            <pre className="whitespace-pre-wrap bg-white/5 rounded-lg p-3 border border-white/10">
                              {previewJob.debug_intent_analyzer
                                ? JSON.stringify(previewJob.debug_intent_analyzer, null, 2)
                                : "(not available)"}
                            </pre>
                          </div>
                          <div>
                            <div className="text-neutral-500 mb-1">debug_intent_creative (after creativeEnhancer)</div>
                            <pre className="whitespace-pre-wrap bg-white/5 rounded-lg p-3 border border-white/10">
                              {previewJob.debug_intent_creative
                                ? JSON.stringify(previewJob.debug_intent_creative, null, 2)
                                : "(not available)"}
                            </pre>
                          </div>
                        </div>
                      </details>
                    </div>

                    {previewJob.detailed_prompt ? (
                      <div className="mt-3">
                        <details open={false}>
                          <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors">
                            detailed_prompt (legacy expand result)
                          </summary>
                          <pre className="mt-3 whitespace-pre-wrap bg-white/5 rounded-lg p-3 border border-white/10">
                            {previewJob.detailed_prompt}
                          </pre>
                        </details>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div>Waiting for job payload…</div>
                )}
              </div>
            </details>
          </div>
        </div>
      )}
    </form>
  );
}
