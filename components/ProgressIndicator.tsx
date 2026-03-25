"use client";

import { useState, useEffect } from "react";
import type { JobProvider, JobStatus } from "@/lib/types";

interface Props {
  step: number;
  status: JobStatus;
  error?: string | null;
  pipelineMode?: JobProvider;
}

const PHASE_1_MESSAGES = [
  "Understanding your prompt...",
  "Expanding into detailed description...",
  "Analyzing motion choreography...",
  "Building animation spec...",
  "Generating animation code...",
  "Almost there...",
];

const PHASE_2_MESSAGES = [
  "Rendering frames...",
  "Compositing video...",
  "Finalizing output...",
];

const TEMPLATE_PHASE_1_MESSAGES = [
  "Analyzing your prompt...",
  "Selecting template...",
  "Mapping parameters...",
];

const TEMPLATE_PHASE_2_MESSAGES = [
  "Rendering template...",
  "Compositing video...",
  "Finalizing output...",
];

type PhaseState = "pending" | "active" | "done" | "failed";

function getPhaseStates(step: number, status: JobStatus, isTemplate: boolean): [PhaseState, PhaseState] {
  if (status === "failed") {
    if (isTemplate) {
      return [step <= 2 ? "failed" : "done", step > 2 ? "failed" : "pending"];
    }
    return [step <= 6 ? "failed" : "done", step > 6 ? "failed" : "pending"];
  }
  if (status === "done") return ["done", "done"];

  if (isTemplate) {
    // Template: Phase 1 = analyzing_intent (step 2), Phase 2 = template_rendering (step 3+)
    const p1: PhaseState = step <= 2 ? "active" : "done";
    const p2: PhaseState = step <= 2 ? "pending" : "active";
    return [p1, p2];
  }

  // Deprecated legacy: Phase 1: steps 1-6 (expand + spec + code), Phase 2: steps 7-8 (render + done)
  const p1: PhaseState = step <= 6 ? "active" : "done";
  const p2: PhaseState = step <= 6 ? "pending" : "active";
  return [p1, p2];
}

function CyclingMessage({ messages }: { messages: string[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % messages.length);
        setVisible(true);
      }, 300);
    }, 3500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <span
      className={
        "transition-opacity duration-300 " + (visible ? "opacity-100" : "opacity-0")
      }
    >
      {messages[index]}
    </span>
  );
}

function PhaseSegment({
  label,
  state,
  position,
}: {
  label: string;
  state: PhaseState;
  position: "left" | "right";
}) {
  const roundedCls = position === "left" ? "rounded-l-full" : "rounded-r-full";

  let bgCls = "bg-white/5"; // pending
  if (state === "done") bgCls = "bg-emerald-500/20";
  else if (state === "active")
    bgCls = "bg-gradient-to-r from-indigo-500/30 to-violet-500/30 animate-gradient-sweep";
  else if (state === "failed") bgCls = "bg-red-500/20";

  let textCls = "text-neutral-600"; // pending
  if (state === "done") textCls = "text-emerald-400";
  else if (state === "active") textCls = "text-indigo-300";
  else if (state === "failed") textCls = "text-red-400";

  return (
    <div className={"flex-1 relative " + roundedCls + " " + bgCls + " h-11 flex items-center justify-center gap-2 transition-all duration-500"}>
      {state === "done" && (
        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {state === "active" && (
        <div className="w-3 h-3 rounded-full border-2 border-indigo-400/50 border-t-indigo-400 animate-spin" />
      )}
      {state === "failed" && (
        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span className={"text-sm font-medium " + textCls}>{label}</span>
    </div>
  );
}

export default function ProgressIndicator({ step, status, error, pipelineMode }: Props) {
  const isTemplate = pipelineMode === "template";
  const isHera = pipelineMode === "hera";
  const [p1, p2] = getPhaseStates(step, status, isTemplate);

  const activePhase = p1 === "active" ? 1 : p2 === "active" ? 2 : 0;

  const p1Label = isTemplate ? "Analyzing" : isHera ? "Fallback" : "Generating";
  const p1Messages = isTemplate
    ? TEMPLATE_PHASE_1_MESSAGES
    : isHera
      ? ["Falling back to Hera...", "Packaging prompt for external render...", "Preparing provider job..."]
      : PHASE_1_MESSAGES;
  const p2Messages = isTemplate
    ? TEMPLATE_PHASE_2_MESSAGES
    : isHera
      ? ["Rendering with Hera...", "Waiting for provider output...", "Finalizing external video..."]
      : PHASE_2_MESSAGES;

  return (
    <div className="flex flex-col gap-3">
      {/* Progress bar */}
      <div className="flex gap-1">
        <PhaseSegment label={p1Label} state={p1} position="left" />
        <PhaseSegment label="Rendering" state={p2} position="right" />
      </div>

      {/* Status message */}
      <div className="text-center h-5">
        {status === "done" && (
          <span className="text-sm text-emerald-400 animate-fade-in">
            Your video is ready!
          </span>
        )}
        {status === "failed" && error && (
          <span className="text-xs text-red-400 animate-fade-in">
            {error.length > 120 ? error.slice(0, 120) + "..." : error}
          </span>
        )}
        {activePhase === 1 && (
          <span className="text-sm text-neutral-400">
            <CyclingMessage messages={p1Messages} />
          </span>
        )}
        {activePhase === 2 && (
          <span className="text-sm text-neutral-400">
            <CyclingMessage messages={p2Messages} />
          </span>
        )}
      </div>
    </div>
  );
}
