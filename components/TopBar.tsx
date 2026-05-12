"use client";

import { MODEL_LIST } from "@/lib/llm";

interface TopBarProps {
  model: string;
  onModelChange: (model: string) => void;
  onApiKeyClick: () => void;
  connected: boolean;
}

export default function TopBar({ model, onModelChange, onApiKeyClick, connected }: TopBarProps) {
  return (
    <div className="h-[46px] flex items-center justify-between px-4 bg-[#0f1929] border-b border-[#2a2a4a] shrink-0 gap-3">
      <div className="flex items-center gap-2.5">
        <span className="text-[15px] font-bold text-[#e0e0e0] tracking-[-0.3px]">
          Mini <span className="text-[#8bb4f9]">Design</span>
        </span>
        <div className="w-px h-5 bg-[#334466]" />
        <select
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          title="选择模型"
          className="bg-[#1a2744] border border-[#334466] text-[#e0e0e0] py-1.5 px-2.5 rounded-md font-mono text-xs cursor-pointer outline-none min-w-[170px] focus:border-[#8bb4f9]"
        >
          {MODEL_LIST.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          onClick={onApiKeyClick}
          className="bg-transparent border border-[#334466] text-[#aaa] py-1.5 px-3.5 rounded-md cursor-pointer font-mono text-xs transition-all hover:border-[#8bb4f9] hover:text-[#8bb4f9]"
        >
          API Key
        </button>
        <div
          className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
            connected ? "bg-[#7ec699]" : "bg-[#f56c6c]"
          }`}
        />
      </div>
    </div>
  );
}
