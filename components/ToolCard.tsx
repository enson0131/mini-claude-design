"use client";

import { useState, useCallback } from "react";

interface ToolCardProps {
  type: "call" | "result";
  name: string;
  content: string;
}

export default function ToolCard({ type, name, content }: ToolCardProps) {
  const [expanded, setExpanded] = useState(false);

  const summaryText =
    type === "call"
      ? `${name}(${content.slice(0, 80)}${content.length > 80 ? "..." : ""})`
      : content.slice(0, 100) + (content.length > 100 ? "...(点击展开)" : "");

  const icon = type === "call" ? "⚡" : "✅";
  const nameColor = type === "call" ? "text-[#7ec699]" : "text-[#e6c07b]";

  const toggleExpand = useCallback(() => setExpanded((v) => !v), []);

  return (
    <div className={`msg-tool msg-tool-${type} ${expanded ? "expanded" : ""}`}>
      <div
        className="flex items-center gap-1.5 py-1.5 px-3 cursor-pointer select-none transition-colors text-xs hover:bg-[#1a2436]"
        onClick={toggleExpand}
      >
        <span className="shrink-0 text-[13px]">{icon}</span>
        <span className={`font-semibold ${nameColor}`}>{name}</span>
        <span className="text-[#8899aa] text-[11px] overflow-hidden text-ellipsis whitespace-nowrap flex-1 mr-2">
          {summaryText}
        </span>
        <span
          className={`text-[#556677] text-[11px] shrink-0 w-4 text-center transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </div>
      <div
        className={`overflow-hidden transition-[max-height] duration-300 ${
          expanded ? "max-h-[300px] overflow-y-auto" : "max-h-0"
        }`}
      >
        <div className="py-2 px-3 border-t border-[#1e2a3e] font-mono text-[11.5px] leading-[1.55] text-[#a8bccf] whitespace-pre-wrap break-all">
          {content}
        </div>
      </div>
    </div>
  );
}
