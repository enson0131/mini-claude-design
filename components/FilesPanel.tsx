"use client";

import { useCallback } from "react";

interface FilesPanelProps {
  files: string[];
  activeFile: string | null;
  onSelectFile: (path: string) => void;
}

// 文件图标映射
const FILE_ICONS: Record<string, string> = {
  html: "🌐",
  htm: "🌐",
  css: "🎨",
  js: "📒",
  json: "📄",
  md: "📝",
  svg: "🎵",
};

function getFileIcon(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  return FILE_ICONS[ext] || "📄";
}

function getFileSize(files: Map<string, string>, path: string): string {
  const content = files.get(path) || "";
  return (new Blob([content]).size / 1024).toFixed(1);
}

export default function FilesPanel({ files, activeFile, onSelectFile }: FilesPanelProps) {
  const renderContent = useCallback(() => {
    if (files.length === 0) {
      return (
        <div className="text-[#555] text-[13px] text-center py-10 px-4 leading-relaxed">
          暂无文件
          <br />
          LLM 生成的代码将显示在这里
        </div>
      );
    }

    // 排序：HTML 文件优先
    const sorted = [...files].sort((a, b) => {
      const ah = a.endsWith(".html") || a.endsWith(".htm");
      const bh = b.endsWith(".html") || b.endsWith(".htm");
      if (ah && !bh) return -1;
      if (!ah && bh) return 1;
      return a.localeCompare(b);
    });

    return sorted.map((path) => (
      <div
        key={path}
        onClick={() => onSelectFile(path)}
        className={`flex items-center gap-2 py-2 px-2.5 cursor-pointer rounded-md text-[13px] transition-colors mb-0.5 ${
          path === activeFile
            ? "bg-[#0f3460] text-[#8bb4f9]"
            : "hover:bg-[#1a3050]"
        }`}
        title={path}
      >
        <span className="text-sm shrink-0 w-[18px] text-center">{getFileIcon(path)}</span>
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{path}</span>
      </div>
    ));
  }, [files, activeFile, onSelectFile]);

  return (
    <div className="w-[260px] min-w-[200px] flex flex-col border-r border-[#2a2a4a] bg-[#16213e]">
      <div className="py-3 px-4 text-[13px] font-semibold text-[#e6c07b] border-b border-[#2a2a4a] bg-[#0f3460] flex items-center gap-2 before:content-[''] before:w-[7px] before:h-[7px] before:bg-[#e6c07b] before:rounded-full">
        设计产物
      </div>
      <div className="flex-1 overflow-y-auto p-2">{renderContent()}</div>
    </div>
  );
}

export { getFileSize, getFileIcon };
