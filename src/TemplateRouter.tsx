import React from "react";
import { TEMPLATE_REGISTRY } from "./templates";
import { AbsoluteFill } from "remotion";

export const TemplateRouter: React.FC<{
  templateId?: string;
  params?: Record<string, unknown>;
}> = ({
  templateId = "hero-text",
  params = {},
}) => {
  const entry = TEMPLATE_REGISTRY[templateId];

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
          {"Template not found: " + templateId}
        </div>
      </AbsoluteFill>
    );
  }

  const Component = entry.component;
  return <Component {...params} />;
};
