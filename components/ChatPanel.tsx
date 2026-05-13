"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ToolCard from "./ToolCard";

// 聊天消息类型
export interface ChatEntry {
  id: string;
  type: "user" | "assistant" | "system" | "done" | "error" | "tool-call" | "tool-result" | "thinking";
  content: string;
  toolName?: string;
}

interface ChatPanelProps {
  entries: ChatEntry[];
  streamingText: string;
  isRunning: boolean;
  onSend: (input: string) => void;
}

export default function ChatPanel({ entries, streamingText, isRunning, onSend }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const chatLogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [entries, streamingText]);

  // 自动调整 textarea 高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [inputValue]);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || isRunning) return;
    onSend(trimmed);
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [inputValue, isRunning, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="w-[420px] min-w-[320px] h-full flex flex-col border-r border-[#2a2a4a] bg-[#0f1219]">
      <div className="py-3.5 px-4.5 text-[13px] font-semibold text-[#8bb4f9] border-b border-[#1e2a3e] bg-[#141b2d] flex items-center gap-2 before:content-[''] before:w-[7px] before:h-[7px] before:bg-[#7ec699] before:rounded-full">
        对话
      </div>

      <div ref={chatLogRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {entries.map((entry) => (
          <EntryRenderer key={entry.id} entry={entry} />
        ))}

        {/* 流式输出 */}
        {streamingText && (
          <div className="flex justify-start w-full">
            <div className="max-w-[88%] py-2.5 px-3.5 rounded-2xl bg-[#1c2538] text-[#d4dce8] text-[13px] leading-[1.6] break-words whitespace-pre-wrap rounded-bl">
              {streamingText}
              <span className="inline-block w-[7px] h-[15px] bg-[#8bb4f9] ml-0.5 align-text-bottom animate-pulse" />
            </div>
          </div>
        )}
      </div>

      <div className="flex border-t border-[#1e2a3e] py-3.5 px-4 bg-[#0a0e17] gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="描述你想要的界面设计或功能需求，例如：帮我制作一个响应式的个人博客首页..."
          rows={1}
          disabled={isRunning}
          className="flex-1 bg-[#151c2c] border border-[#243049] text-[#e0e0e0] py-3 px-3.5 font-mono text-[13.5px] rounded-xl outline-none resize-none min-h-[48px] max-h-[160px] transition-[border-color,box-shadow] focus:border-[#4a7dcc] focus:shadow-[0_0_0_3px_rgba(74,125,204,0.15)] placeholder:text-[#3a4a5e]"
        />
        <button
          onClick={handleSend}
          disabled={isRunning}
          className="bg-gradient-to-br from-[#1a56db] to-[#1e40af] text-white py-3 px-5 font-mono text-[13.5px] font-semibold rounded-xl cursor-pointer whitespace-nowrap transition-[transform,box-shadow,opacity] hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(26,86,219,0.35)] active:translate-y-0 disabled:opacity-35 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {isRunning ? "思考中..." : "发送"}
        </button>
      </div>
    </div>
  );
}

/** 渲染单条消息 */
function EntryRenderer({ entry }: { entry: ChatEntry }) {
  switch (entry.type) {
    case "user":
      return (
        <div className="flex justify-end w-full">
          <div className="max-w-[88%] py-2.5 px-3.5 rounded-2xl bg-gradient-to-br from-[#1a56db] to-[#1e40af] text-white text-[13px] leading-[1.6] break-words font-medium rounded-br">
            {entry.content}
          </div>
        </div>
      );
    case "assistant":
      return (
        <div className="flex justify-start w-full">
          <div className="max-w-[88%] py-2.5 px-3.5 rounded-2xl bg-[#1c2538] text-[#d4dce8] text-[13px] leading-[1.6] break-words whitespace-pre-wrap rounded-bl">
            {entry.content}
          </div>
        </div>
      );
    case "system":
      return (
        <div className="text-[#4a5a6e] text-[11.5px] text-center py-0.5">{entry.content}</div>
      );
    case "done":
      return (
        <div className="text-[#58a6ff] text-[11.5px] text-center py-1 border-t border-dashed border-[#1e2a3e] mt-1">
          {entry.content}
        </div>
      );
    case "error":
      return (
        <div className="flex justify-start w-full">
          <div className="max-w-[88%] bg-[rgba(220,53,69,0.12)] text-[#f56c6c] border border-[rgba(220,53,69,0.2)] rounded-[10px] py-2 px-3.5 text-xs">
            {entry.content}
          </div>
        </div>
      );
    case "tool-call":
      return (
        <div className="flex justify-start w-full">
          <ToolCard type="call" name={entry.toolName || ""} content={entry.content} />
        </div>
      );
    case "tool-result":
      return (
        <div className="flex justify-start w-full">
          <ToolCard type="result" name={entry.toolName || ""} content={entry.content} />
        </div>
      );
    case "thinking":
      return (
        <div className="flex justify-start w-full">
          <div className="max-w-[200px] bg-transparent text-[#5a6a7e] text-xs py-1.5 px-3 rounded-xl italic">
            💡 {entry.content}
          </div>
        </div>
      );
    default:
      return null;
  }
}
