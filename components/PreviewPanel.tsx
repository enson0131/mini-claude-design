"use client";

import { useCallback } from "react";
import { getFileStore } from "@/lib/tools/filesystem";

type PreviewPanelProps = {
  activeFile?: string | null;
  fileContent?: string | null;
  blobUrlMap?: Map<string, string>;
  onRefresh: () => void;
  onOpenNewTab: () => void;
};

const blobUrlCache = new Map();

function getBlobUrl(path: string) {
  if (blobUrlCache.has(path)) return blobUrlCache.get(path);
  const store = getFileStore();
  const content = store.get(path);
  if (content === undefined) return null;
  const ext = path?.split?.('.')?.pop()?.toLowerCase() || 'text';
  const mime = {
      css: 'text/css',
      js: 'application/javascript',
      json: 'application/json',
      svg: 'image/svg+xml',
      html: 'text/html',
      htm: 'text/html',
      text: 'text/plain',
  }[ext];
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  blobUrlCache.set(path, url);
  return url;
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
    (htmlContent: string, basePath: string): string => {
      let resolved = htmlContent;
        const dir = basePath.substring(0, basePath.lastIndexOf('/') + 1);
        resolved = resolved.replace(
          /<link\s[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
          (match, href) => {
            const fullPath = href.startsWith('/') ? href.slice(1) : dir + href;
            const url = getBlobUrl(fullPath);
            if (url) return match.replace(href, url);
            return match;
          },
        );
        resolved = resolved.replace(/<script\s[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi, (match, src) => {
          const fullPath = src.startsWith('/') ? src.slice(1) : dir + src;
          const url = getBlobUrl(fullPath);
          if (url) return match.replace(src, url);
          return match;
        });
        return resolved;
    },
    [blobUrlMap]
  );

  const resolvedContent =
    isHtml && activeFile && fileContent ? resolveHtml(fileContent, activeFile) : null;

  if (!activeFile || !fileContent) {
    return (
      <div className="flex-1 flex flex-col bg-white min-w-[400px]">
        <div className="py-3 px-4 text-[13px] font-semibold text-[#7cc4a8] border-b border-[#e4e9f0] bg-white flex items-center gap-2 before:content-[''] before:w-[7px] before:h-[7px] before:bg-[#7cc4a8] before:rounded-full">
          预览
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-[#8e9eb0] text-sm gap-3 bg-[#fafbfc]">
          <div className="text-5xl opacity-30">📰</div>
          <div>选择左侧文件或等待 LLM 生成代码</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white min-w-[400px]">
      <div className="py-3 px-4 text-[13px] font-semibold text-[#7cc4a8] border-b border-[#e4e9f0] bg-white flex items-center justify-between">
        <div className="flex items-center gap-2 before:content-[''] before:w-[7px] before:h-[7px] before:bg-[#7cc4a8] before:rounded-full">
          预览
        </div>
        <span className="text-[#8e9eb0] text-xs font-normal max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">
          {activeFile}
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={onRefresh}
            title="刷新预览"
            className="bg-[#f4f7fa] border border-[#dce3ea] text-[#5b9bd5] py-1 px-2.5 rounded cursor-pointer font-mono text-[11px] hover:bg-[#e8f0f8] transition-colors"
          >
            刷新
          </button>
          <button
            onClick={onOpenNewTab}
            title="新窗口打开"
            className="bg-[#f4f7fa] border border-[#dce3ea] text-[#5b9bd5] py-1 px-2.5 rounded cursor-pointer font-mono text-[11px] hover:bg-[#e8f0f8] transition-colors"
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
          <div className="absolute inset-0 flex items-center justify-center bg-[#fafbfc]">
            <div className="max-w-[90%] max-h-[80%] overflow-auto bg-[#f4f7fa] text-[#3d4f5f] p-5 rounded-lg text-xs leading-relaxed whitespace-pre break-all text-left border border-[#e4e9f0]">
              <div className="text-[#5b9bd5] mb-2 text-[13px]">{activeFile} (源码)</div>
              {fileContent.slice(0, 50000)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
