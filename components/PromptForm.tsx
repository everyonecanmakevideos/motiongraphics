"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PromptForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
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

  return (
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
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-600">{prompt.length} / 3000</span>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-400">{error}</span>}
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
  );
}
