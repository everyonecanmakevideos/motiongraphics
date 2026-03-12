"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Job, SSEEvent } from "@/lib/types";

interface Props {
  jobId: string;
  initialJob: Job;
  onUpdate: (event: SSEEvent) => void;
}

export default function LiveUpdater({ jobId, initialJob, onUpdate }: Props) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTerminalRef = useRef(
    initialJob.status === "done" || initialJob.status === "failed"
  );
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 10;
  const POLL_INTERVAL_MS = 3000;

  // Map a Job REST response → SSEEvent shape for onUpdate
  const applyJobSnapshot = useCallback(
    (job: Job) => {
      onUpdate({
        jobId: job.id,
        step: job.step,
        status: job.status,
        label: job.status,
        error: job.error ?? undefined,
        specJson: job.spec_json ?? undefined,
        videoKey: job.video_r2_key ?? undefined,
      });
    },
    [onUpdate]
  );

  // SSE connection with exponential-backoff reconnect
  const connect = useCallback(() => {
    if (isTerminalRef.current) return;

    const es = new EventSource("/api/jobs/" + jobId + "/stream");
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const event: SSEEvent = JSON.parse(e.data);
        onUpdate(event);
        if (event.status === "done" || event.status === "failed") {
          isTerminalRef.current = true;
          retryCountRef.current = 0;
          es.close();
          // Stop polling too — SSE delivered first
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      } catch {
        // malformed event — ignore
      }
    };

    es.onerror = () => {
      es.close();
      if (isTerminalRef.current) return;
      if (retryCountRef.current >= MAX_RETRIES) return;

      // Exponential backoff: 1s, 2s, 4s … capped at 16s
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 16000);
      retryCountRef.current += 1;
      retryTimerRef.current = setTimeout(connect, delay);
    };
  }, [jobId, onUpdate]);

  // Polling fallback — hits the database directly, so works even when SSE
  // can't reach the pipeline (serverless / multi-instance environments)
  const startPolling = useCallback(() => {
    if (isTerminalRef.current) return;

    pollIntervalRef.current = setInterval(async () => {
      if (isTerminalRef.current) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        return;
      }
      try {
        const res = await fetch("/api/jobs/" + jobId);
        if (!res.ok) return;
        const job: Job = await res.json();
        applyJobSnapshot(job);
        if (job.status === "done" || job.status === "failed") {
          isTerminalRef.current = true;
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      } catch {
        // network error — will retry on next tick
      }
    }, POLL_INTERVAL_MS);
  }, [jobId, applyJobSnapshot]);

  useEffect(() => {
    if (isTerminalRef.current) return;

    connect();
    startPolling();

    return () => {
      eventSourceRef.current?.close();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [connect, startPolling]);

  return null;
}
