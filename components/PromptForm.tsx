"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { PreviewModel } from "@/components/RemotionTemplatePreview";

const RemotionTemplatePreview = dynamic(() => import("@/components/RemotionTemplatePreview"), {
  ssr: false,
});

export default function PromptForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1" | "4:3" | "3:4">("16:9");
  const [durationSec, setDurationSec] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewModel, setPreviewModel] = useState<PreviewModel | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspect_ratio: aspectRatio, duration_sec: durationSec }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit");
        return;
      }
      router.push("/jobs/" + data.id);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  async function handlePreview() {
    if (!prompt.trim()) return;
    setPreviewLoading(true);
    setPreviewError("");

    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspect_ratio: aspectRatio, duration_sec: durationSec }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.error ?? "Preview failed");
        return;
      }

      if (data.mode === "single") {
        setPreviewModel({
          mode: "single",
          aspectRatio: data.aspectRatio,
          durationSec: data.durationSec,
          templateId: data.templateId,
          templateParams: data.templateParams,
        });
        return;
      }

      if (data.mode === "multi") {
        setPreviewModel({
          mode: "multi",
          aspectRatio: data.aspectRatio,
          scenes: data.scenes,
          totalDurationFrames: data.totalDurationFrames,
        });
        return;
      }

      setPreviewError(data.error ?? "Preview not supported for this prompt yet (legacy pipeline).");
      setPreviewModel(null);
    } catch (err) {
      setPreviewError((err as Error).message || "Preview failed");
      setPreviewModel(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Aspect ratio</span>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as typeof aspectRatio)}
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 transition-all duration-200"
          >
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
            <option value="1:1">1:1 (Square)</option>
            <option value="4:3">4:3</option>
            <option value="3:4">3:4</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Duration (seconds)</span>
          <input
            type="number"
            min={2}
            max={30}
            step={1}
            value={durationSec}
            onChange={(e) => setDurationSec(Math.max(2, Math.min(30, Number(e.target.value) || 0)))}
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 transition-all duration-200 font-mono"
          />
        </label>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-600">{prompt.length} / 3000</span>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-400">{error}</span>}
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewLoading || loading || !prompt.trim()}
            className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 disabled:bg-white/5 disabled:text-neutral-500 disabled:border-white/10 text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center gap-2"
          >
            {previewLoading && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Preview
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
      </form>

      {previewError && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-3">
          {previewError}
        </div>
      )}

      {previewModel && !previewError && (
        <RemotionTemplatePreview model={previewModel} />
      )}
    </div>
  );
}
