"use client";

import { useState, useCallback } from "react";

interface ApiKeyDialogProps {
  open: boolean;
  apiKey: string;
  onConfirm: (key: string) => void;
  onCancel: () => void;
}

export default function ApiKeyDialog({ open, apiKey, onConfirm, onCancel }: ApiKeyDialogProps) {
  const [inputValue, setInputValue] = useState(apiKey);

  const handleConfirm = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  }, [inputValue, onConfirm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleConfirm();
      if (e.key === "Escape") onCancel();
    },
    [handleConfirm, onCancel]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-[1000] flex justify-center items-center">
      <div className="bg-[#1a2744] border border-[#334466] rounded-xl p-7 w-[480px] max-w-[90vw] shadow-2xl">
        <h2 className="text-base text-[#e0e0e0] mb-2.5">设置智谱 AI API Key</h2>
        <p className="text-xs text-[#888] mb-3.5 leading-relaxed">
          请输入你的智谱 AI API Key。前往{" "}
          <a
            href="https://open.bigmodel.cn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8bb4f9]"
          >
            open.bigmodel.cn
          </a>{" "}
          注册并获取。Key 将保存在浏览器本地存储中。
        </p>
        <input
          type="password"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="请输入 API Key..."
          className="w-full bg-[#0f1929] border border-[#334466] text-[#e0e0e0] px-3 py-2.5 font-mono text-[13px] rounded-md outline-none focus:border-[#8bb4f9]"
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4.5">
          <button
            onClick={onCancel}
            className="px-4.5 py-1.5 rounded-md bg-[#334466] text-[#ccc] text-[13px] cursor-pointer hover:bg-[#445577] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4.5 py-1.5 rounded-md bg-[#8bb4f9] text-[#1a1a2e] text-[13px] font-bold cursor-pointer hover:bg-[#a0c4ff] transition-colors"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
