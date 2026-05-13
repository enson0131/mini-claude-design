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
    <div className="h-[46px] flex items-center justify-between px-4 bg-white border-b border-[#e4e9f0] shrink-0 gap-3 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="text-[15px] font-bold text-[#2c3e50] tracking-[-0.3px]">
          Mini <span className="text-[#5b9bd5]">Design</span>
        </span>
        <div className="w-px h-5 bg-[#dce3ea]" />
        <select
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          title="选择模型"
          className="bg-[#f4f7fa] border border-[#dce3ea] text-[#3d4f5f] py-1.5 px-2.5 rounded-md font-mono text-xs cursor-pointer outline-none min-w-[170px] focus:border-[#5b9bd5] transition-colors"
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
          className="bg-transparent border border-[#dce3ea] text-[#6b7f8e] py-1.5 px-3.5 rounded-md cursor-pointer font-mono text-xs transition-all hover:border-[#5b9bd5] hover:text-[#5b9bd5]"
        >
          API Key
        </button>
        <div
          className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
            connected ? "bg-[#7cc4a8]" : "bg-[#e57373]"
          }`}
        />
      </div>
    </div>
  );
}
