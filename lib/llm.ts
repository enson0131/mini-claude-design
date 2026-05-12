// 智谱 AI (GLM) API 客户端
// 通过 Next.js API 路由代理请求，解决 CORS 问题

import type { ChatMessage, ModelOption, StreamCallbacks, APIResponse, AccumulatedResponse } from "./types";

export const MODEL_LIST: ModelOption[] = [
  { id: "glm-4-flash", label: "GLM-4 Flash (快速)" },
  { id: "glm-4-air", label: "GLM-4 Air (轻量)" },
  { id: "glm-4-plus", label: "GLM-4 Plus (增强)" },
  { id: "glm-4", label: "GLM-4 (标准)" },
  { id: "glm-4-alltools", label: "GLM-4 AllTools" },
];

const STORAGE_KEY = "zhipu_api_key";
const MODEL_STORAGE_KEY = "zhipu_model";

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) || "";
}

export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key);
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

export function getModel(): string {
  if (typeof window === "undefined") return "glm-4-flash";
  return localStorage.getItem(MODEL_STORAGE_KEY) || "glm-4-flash";
}

export function setModel(model: string): void {
  localStorage.setItem(MODEL_STORAGE_KEY, model);
}

/** 调用智谱 AI API（流式 SSE），通过 API 路由代理 */
export async function callZhipuStream(
  messages: ChatMessage[],
  tools: { type: string; function: { name: string; description: string; parameters: Record<string, unknown> } }[],
  systemPrompt: string,
  callbacks: StreamCallbacks = {},
): Promise<APIResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("未设置智谱 AI API Key，请先在页面顶部设置");
  }

  const body = {
    apiKey,
    model: getModel(),
    messages: [{ role: "system" as const, content: systemPrompt }, ...messages],
    tools,
    stream: true,
  };

  const resp = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errorBody = await resp.text();
    let errorMsg = `API 请求失败 (${resp.status})`;
    try {
      const errJson = JSON.parse(errorBody);
      errorMsg = errJson.error?.message || errJson.message || errorMsg;
    } catch {
      // 忽略解析错误
    }
    throw new Error(errorMsg);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error("无法获取响应流");

  const decoder = new TextDecoder();
  let buffer = "";

  const accumulated: AccumulatedResponse = {
    content: "",
    tool_calls: [],
    usage: { prompt_tokens: 0, completion_tokens: 0 },
    finish_reason: null,
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (!trimmed.startsWith("data: ")) continue;

      try {
        const chunk = JSON.parse(trimmed.slice(6));
        const choice = chunk.choices?.[0];
        if (!choice) continue;

        const delta = choice.delta || {};

        // 文本内容
        if (delta.content) {
          accumulated.content += delta.content;
          callbacks.onTextChunk?.(delta.content);
        }

        // 工具调用
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!accumulated.tool_calls[idx]) {
              accumulated.tool_calls[idx] = {
                id: "",
                type: "function",
                function: { name: "", arguments: "" },
              };
            }
            if (tc.id) accumulated.tool_calls[idx].id = tc.id;
            if (tc.type) accumulated.tool_calls[idx].type = tc.type;
            if (tc.function?.name) {
              accumulated.tool_calls[idx].function.name += tc.function.name;
            }
            if (tc.function?.arguments) {
              accumulated.tool_calls[idx].function.arguments += tc.function.arguments;
            }
          }
        }

        if (choice.finish_reason) {
          accumulated.finish_reason = choice.finish_reason;
        }

        if (chunk.usage) {
          accumulated.usage.prompt_tokens = chunk.usage.prompt_tokens || 0;
          accumulated.usage.completion_tokens = chunk.usage.completion_tokens || 0;
        }
      } catch {
        // 忽略解析错误
      }
    }
  }

  callbacks.onDone?.(accumulated);

  return {
    choices: [
      {
        message: {
          role: "assistant",
          content: accumulated.content || null,
          tool_calls: accumulated.tool_calls.filter((tc) => tc.id),
        },
        finish_reason: accumulated.finish_reason || "stop",
      },
    ],
    usage: accumulated.usage,
  };
}
