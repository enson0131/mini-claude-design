"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import TopBar from "@/components/TopBar";
import ChatPanel, { type ChatEntry } from "@/components/ChatPanel";
import FilesPanel from "@/components/FilesPanel";
import PreviewPanel from "@/components/PreviewPanel";
import ResizeHandle from "@/components/ResizeHandle";
import ApiKeyDialog from "@/components/ApiKeyDialog";
import { runAgent, type AgentCallbacks } from "@/lib/agent";
import { getApiKey, setApiKey, hasApiKey, getModel, setModel } from "@/lib/llm";
import { getFileStore } from "@/lib/tools/filesystem";

let entryIdCounter = 0;
function nextId() {
  return `e${String(++entryIdCounter).padStart(5, "0")}`;
}

export default function HomePage() {
  // 聊天相关状态
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<
    import("@/lib/types").ChatMessage[]
  >([]);

  // 文件和预览状态
  const [files, setFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const blobUrlMap = useRef(new Map<string, string>());

  // API Key 弹窗
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [connected, setConnected] = useState(false);
  const streamingMessageRef = useRef("");
  // 模型
  const [model, setModelState] = useState("glm-4-flash");

  // 初始化
  useEffect(() => {
    setConnected(hasApiKey());
    setModelState(getModel());

    if (!hasApiKey()) {
      addEntry("system", "请先设置智谱 AI API Key（点击右上角 API Key 按钮）。");
    } else {
      addEntry("system", "就绪。描述你想要的设计，我会生成模块化的 HTML/CSS/JS 代码并实时预览。");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 添加聊天条目的辅助函数
  const addEntry = useCallback(
    (type: ChatEntry["type"], content: string, toolName?: string) => {
      const entry: ChatEntry = { id: nextId(), type, content, toolName };
      setEntries((prev) => [...prev, entry]);
    },
    []
  );

  // 刷新文件列表
  const refreshFiles = useCallback(() => {
    const store = getFileStore();
    setFiles([...store.keys()]);
  }, []);

  // 生成 blob URL（用于预览）
  const getOrCreateBlobUrl = useCallback(
    (path: string): string | null => {
      if (blobUrlMap.current.has(path)) return blobUrlMap.current.get(path)!;
      const store = getFileStore();
      const content = store.get(path);
      if (content === undefined) return null;

      const ext = path.split(".").pop()?.toLowerCase() || "";
      const mimeMap: Record<string, string> = {
        css: "text/css",
        js: "application/javascript",
        json: "application/json",
        svg: "image/svg+xml",
        html: "text/html",
        htm: "text/html",
      };
      const mime = mimeMap[ext] || "text/plain";
      const url = URL.createObjectURL(new Blob([content], { type: mime }));
      blobUrlMap.current.set(path, url);
      return url;
    },
    []
  );

  // 使 blob URL 缓存失效
  const invalidateBlobUrls = useCallback(() => {
    for (const url of blobUrlMap.current.values()) URL.revokeObjectURL(url);
    blobUrlMap.current.clear();
  }, []);

  // 选择文件
  const handleSelectFile = useCallback(
    (path: string) => {
      setActiveFile(path);
      const store = getFileStore();
      const content = store.get(path);
      if (content === undefined) return;
      setFileContent(content);
    },
    []
  );

  // 刷新预览
  const handleRefresh = useCallback(() => {
    if (activeFile) handleSelectFile(activeFile);
  }, [activeFile, handleSelectFile]);

  // 新窗口打开
  const handleOpenNewTab = useCallback(() => {
    if (!activeFile) return;
    const store = getFileStore();
    const content = store.get(activeFile);
    if (!content) return;

    invalidateBlobUrls();

    // 为所有资源文件创建 blob URL
    const dir = activeFile.substring(0, activeFile.lastIndexOf("/") + 1);
    let resolved = content;
    for (const [filePath, fileData] of store.entries()) {
      const url = getOrCreateBlobUrl(filePath);
      if (!url) continue;

      resolved = resolved.replace(
        new RegExp(
          `(href|src)=["']${dir ? dir : ""}${filePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
          "g"
        ),
        `$1="${url}"`
      );
    }

    window.open(
      URL.createObjectURL(new Blob([resolved], { type: "text/html" })),
      "_blank"
    );
  }, [activeFile, getOrCreateBlobUrl, invalidateBlobUrls]);

  // 发送消息处理
  const handleSend = useCallback(
    async (input: string) => {
      if (isRunning) return;
      if (!hasApiKey()) {
        setShowApiKeyDialog(true);
        return;
      }

      setIsRunning(true);
      addEntry("user", `\n${input}\n`);

      try {
        streamingMessageRef.current = "";

        const callbacks: AgentCallbacks = {
          onText(t) {
            setStreamingText("");
            addEntry("system", t);
          },
          onStreamText(chunk) {
            streamingMessageRef.current += chunk;
            setStreamingText((prev) => prev + chunk);
          },
          onAssistantMessage(text) {
            const content = text.trim();
            if (!content) return;
            addEntry("assistant", content);
            streamingMessageRef.current = "";
            setStreamingText("");
          },
          onToolCall(name, inputObj) {
            addEntry("tool-call", JSON.stringify(inputObj, null, 2), name);
          },
          onToolResult(name, result) {
            const d = typeof result === "string" ? result : JSON.stringify(result, null, 2);
            addEntry("tool-result", d, name);
            refreshFiles();

            // 自动选择文件预览
            if (name === "write_file") {
              const m = result.match(/Written (.+?) \(/);
              if (m) {
                const writtenPath = m[1];
                setTimeout(() => {
                  if (!activeFile) {
                    const store = getFileStore();
                    if (writtenPath === "index.html") {
                      handleSelectFile(writtenPath);
                    } else if (store.has("index.html")) {
                      handleSelectFile("index.html");
                    } else {
                      handleSelectFile(writtenPath);
                    }
                  } else {
                    handleSelectFile(activeFile);
                  }
                }, 100);
              }
            }
          },
          onDone(usage) {
            const t = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);
            setStreamingText("");
            streamingMessageRef.current = "";
            addEntry("done", `📊 tokens: ${t}`);
          },
          onSnip(before, after) {
            setStreamingText("");
            streamingMessageRef.current = "";
            addEntry("system", `✂️ 裁剪上下文: ${before}→${after}`);
          },
        };

        const msgs = await runAgent(input, callbacks, conversationMessages);
        setConversationMessages(msgs);
        addEntry("system", "--- 可以继续调整 ---");
      } catch (err) {
        setStreamingText("");
        streamingMessageRef.current = "";
        addEntry("error", `Error: ${(err as Error).message}`);
        if ((err as Error).message.includes("API Key")) {
          setShowApiKeyDialog(true);
        }
      }

      setIsRunning(false);
    },
    [
      isRunning,
      addEntry,
      refreshFiles,
      activeFile,
      handleSelectFile,
      conversationMessages,
    ]
  );

  // API Key 确认
  const handleApiKeyConfirm = useCallback(
    (key: string) => {
      setApiKey(key);
      setShowApiKeyDialog(false);
      setConnected(true);
      addEntry("system", "API Key 已设置。");
    },
    [addEntry]
  );

  // 模型切换
  const handleModelChange = useCallback((m: string) => {
    setModel(m);
    setModelState(m);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopBar
        model={model}
        onModelChange={handleModelChange}
        onApiKeyClick={() => setShowApiKeyDialog(true)}
        connected={connected}
      />

      <div className="flex flex-1 overflow-hidden">
        <div id="chat-panel">
          <ChatPanel
            entries={entries}
            streamingText={streamingText}
            isRunning={isRunning}
            onSend={handleSend}
          />
        </div>
        <ResizeHandle targetId="chat-panel" />

        <FilesPanel
          files={files}
          activeFile={activeFile}
          onSelectFile={handleSelectFile}
        />
        <ResizeHandle targetId="files-panel" />

        <PreviewPanel
          activeFile={activeFile}
          fileContent={fileContent}
          blobUrlMap={blobUrlMap.current}
          onRefresh={handleRefresh}
          onOpenNewTab={handleOpenNewTab}
        />
      </div>

      <ApiKeyDialog
        open={showApiKeyDialog}
        apiKey={getApiKey()}
        onConfirm={handleApiKeyConfirm}
        onCancel={() => setShowApiKeyDialog(false)}
      />
    </div>
  );
}
