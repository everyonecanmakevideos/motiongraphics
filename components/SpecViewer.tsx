"use client";

import { useState } from "react";

interface Props {
  spec: object | null;
}

function syntaxHighlight(json: string): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = "text-yellow-300"; // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) cls = "text-indigo-300"; // key
          else cls = "text-emerald-300"; // string
        } else if (/true|false/.test(match)) {
          cls = "text-violet-300";
        } else if (/null/.test(match)) {
          cls = "text-red-300";
        }
        return '<span class="' + cls + '">' + match + "</span>";
      }
    );
}

export default function SpecViewer({ spec }: Props) {
  const [collapsed, setCollapsed] = useState(true);

  if (!spec) {
    return (
      <div className="glass rounded-2xl p-4">
        <p className="text-sm text-neutral-600">Spec will appear here after generation...</p>
      </div>
    );
  }

  const json = JSON.stringify(spec, null, 2);
  const highlighted = syntaxHighlight(json);

  return (
    <div className="glass-strong rounded-2xl overflow-hidden animate-fade-in">
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
          Motion Spec JSON
        </span>
        <button className="text-neutral-500 hover:text-neutral-300 transition-colors">
          <svg
            className={"w-4 h-4 transition-transform duration-200 " + (collapsed ? "" : "rotate-180")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {!collapsed && (
        <div className="overflow-x-auto max-h-80 overflow-y-auto border-t border-white/5">
          <pre
            className="p-5 text-xs leading-relaxed font-mono"
            style={{ contentVisibility: "auto", containIntrinsicSize: "auto 500px" }}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>
      )}
    </div>
  );
}
