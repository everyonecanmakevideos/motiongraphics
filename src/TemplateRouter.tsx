import React, { useEffect, useMemo, useState } from "react";
import { TEMPLATE_REGISTRY } from "./templates";
import { AbsoluteFill } from "remotion";

export const TemplateRouter: React.FC<{
  templateId?: string;
  params?: Record<string, unknown>;
}> = ({
  templateId = "hero-text",
  params = {},
}) => {
  const [resolvedTemplateId, setResolvedTemplateId] = useState(templateId);
  const [resolvedParams, setResolvedParams] = useState<Record<string, unknown>>(params);

  const apiBaseUrl = useMemo(() => {
    if (typeof window === "undefined") return null;
    // Studio typically runs on :3002 while Next runs on :3000 in this project.
    // We derive Next's origin by forcing port 3000.
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3000`;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!apiBaseUrl) return;

    const search = new URLSearchParams(window.location.search);
    const jobId = search.get("jobId");
    if (!jobId) return;

    // Only override when the Studio was opened with default TemplateScene props.
    const isDefaultInput =
      resolvedTemplateId === "hero-text" && Object.keys(resolvedParams ?? {}).length === 0;
    if (!isDefaultInput) return;

    (async () => {
      try {
        const res = await fetch(
          `${apiBaseUrl}/api/studio/props/${encodeURIComponent(jobId)}`
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          templateId?: string | null;
          params?: Record<string, unknown> | null;
        };
        if (data.templateId) setResolvedTemplateId(data.templateId);
        setResolvedParams(data.params ?? {});
      } catch {
        // Keep default props if Studio can't reach Next.
      }
    })();
  }, [apiBaseUrl, resolvedParams, resolvedTemplateId]);

  const entry = TEMPLATE_REGISTRY[resolvedTemplateId];

  if (!entry) {
    // Fallback: render an error card so the video is not blank
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#1A1A2E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            color: "#FF6B6B",
            fontSize: "36px",
            fontFamily: "Arial, sans-serif",
            textAlign: "center",
          }}
        >
          {"Template not found: " + resolvedTemplateId}
        </div>
      </AbsoluteFill>
    );
  }

  const Component = entry.component;
  return <Component {...resolvedParams} />;
};
