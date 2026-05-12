"use client";

import { useCallback } from "react";

interface PreviewPanelProps {
  activeFile: string | null;
  fileContent: string | null;
  blobUrlMap: Map<string, string>;
  onRefresh: () => void;
  onOpenNewTab: () => void;
}

export default function PreviewPanel({
  activeFile,
  fileContent,
  blobUrlMap,
  onRefresh,
  onOpenNewTab,
}: PreviewPanelProps) {
  const isHtml = activeFile?.endsWith(".html") || activeFile?.endsWith(".htm");

  // 解析 HTML 中的资源引用，替换为 blob URL
  const resolveHtml = useCallback(
    (html: string, basePath: string): string => {
      let resolved = html;
      const dir = basePath.substring(0, basePath.lastIndexOf("/") + 1);

      resolved = resolved.replace(
        /<link\s[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
        (match, href: string) => {
          const fullPath = href.startsWith("/") ? href.slice(1) : dir + href;
          const url = blobUrlMap.get(fullPath);
          if (url) return match.replace(href, url);
          return match;
        }
      );

      resolved = resolved.replace(
        /<script\s[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi,
        (match, src: string) => {
          const fullPath = src.startsWith("/") ? src.slice(1) : dir + src;
          const url = blobUrlMap.get(fullPath);
          if (url) return match.replace(src, url);
          return match;
        }
      );

      return resolved;
    },
    [blobUrlMap]
  );

  const resolvedContent =
    isHtml && activeFile && fileContent ? resolveHtml(fileContent, activeFile) : null;

  if (!activeFile || !fileContent) {
    return (
      <div className="flex-1 flex flex-col bg-[#0d1117] min-w-[400px]">
        <div className="py-3 px-4 text-[13px] font-semibold text-[#7ec699] border-b border-[#2a2a4a] bg-[#0f3460] flex items-center gap-2 before:content-[''] before:w-[7px] before:h-[7px] before:bg-[#7ec699] before:rounded-full">
          预览
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-[#444] text-sm gap-3 bg-[#fafafa]">
          <div className="text-5xl opacity-30">📰</div>
          <div>选择左侧文件或等待 LLM 生成代码</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] min-w-[400px]">
      <div className="py-3 px-4 text-[13px] font-semibold text-[#7ec699] border-b border-[#2a2a4a] bg-[#0f3460] flex items-center justify-between">
        <div className="flex items-center gap-2 before:content-[''] before:w-[7px] before:h-[7px] before:bg-[#7ec699] before:rounded-full">
          预览
        </div>
        <span className="text-[#aaa] text-xs font-normal max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">
          {activeFile}
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={onRefresh}
            title="刷新预览"
            className="bg-[#1a2744] border border-[#334466] text-[#8bb4f9] py-1 px-2.5 rounded cursor-pointer font-mono text-[11px] hover:bg-[#243555] transition-colors"
          >
            刷新
          </button>
          <button
            onClick={onOpenNewTab}
            title="新窗口打开"
            className="bg-[#1a2744] border border-[#334466] text-[#8bb4f9] py-1 px-2.5 rounded cursor-pointer font-mono text-[11px] hover:bg-[#243555] transition-colors"
          >
            新窗口
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-white">
        {isHtml && resolvedContent ? (
          <iframe
            srcDoc={resolvedContent}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-none bg-white"
            title="预览"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#fafafa]">
            <div className="max-w-[90%] max-h-[80%] overflow-auto bg-[#1a1a2e] text-[#e0e0e0] p-5 rounded-lg text-xs leading-relaxed whitespace-pre break-all text-left">
              <div className="text-[#8bb4f9] mb-2 text-[13px]">{activeFile} (源码)</div>
              {fileContent.slice(0, 50000)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
