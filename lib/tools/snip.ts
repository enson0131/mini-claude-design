// 上下文裁剪工具
// 每条 user 消息携带 [id:mNNNN] 标签，snip 根据 from_id/to_id 标记要删除的范围
// 注册是延迟的：只标记不删除，当 token 超阈值时批量执行

import { registerTool, type ToolDefinition } from "./index";
import type { ChatMessage } from "../types";

let msgIdCounter = 0;

/** 给 user 消息附加 [id:mNNNN] 标签 */
export function tagUserMessage(content: string): string {
  const id = `m${String(++msgIdCounter).padStart(4, "0")}`;
  return `${content}\n[id:${id}]`;
}

/** 从消息内容中提取 [id:mNNNN] 标签 */
export function extractMsgId(content: string): string | null {
  const match = content.match(/\[id:(m\d+)\]/);
  return match ? match[1] : null;
}

interface SnipEntry {
  from_id: string;
  to_id: string;
  reason?: string;
}

const registeredSnips: SnipEntry[] = [];

const snipTool: ToolDefinition = {
  name: "snip",
  description: `Mark a range of conversation history for deferred removal.

Each user message ends with an [id:mNNNN] tag. Copy the exact tag values as from_id and to_id. Both IDs are inclusive.

Snips are a REGISTRATION system, not immediate deletion. Registering is cheap and non-destructive — messages stay visible until context pressure builds. Register aggressively and early.`,
  input_schema: {
    type: "object",
    properties: {
      from_id: {
        type: "string",
        description: "The [id:...] tag of the first user message to snip, inclusive",
      },
      to_id: {
        type: "string",
        description: "The [id:...] tag of the last user message to snip, inclusive",
      },
      reason: {
        type: "string",
        description: "Brief note on why this range is no longer needed",
      },
    },
    required: ["from_id", "to_id"],
  },
  async execute({ from_id, to_id, reason }) {
    registeredSnips.push({
      from_id: from_id as string,
      to_id: to_id as string,
      reason: reason as string | undefined,
    });
    return `Snip registered (${registeredSnips.length} queued).`;
  },
};

registerTool(snipTool);

/** 执行所有已注册的 snip，返回被裁剪的消息 ID 集合 */
export function executeSnips(messages: ChatMessage[]): Set<string> {
  if (registeredSnips.length === 0) {
    return new Set();
  }

  const idsToRemove = new Set<string>();
  for (const snip of registeredSnips) {
    let removing = false;
    for (const msg of messages) {
      if (msg.role !== "user") continue;
      const content = typeof msg.content === "string" ? msg.content : "";
      const id = extractMsgId(content);
      if (id === snip.from_id) {
        removing = true;
      }
      if (removing && id) {
        idsToRemove.add(id);
      }
      if (id === snip.to_id) {
        removing = false;
        break;
      }
    }
  }
  registeredSnips.length = 0;
  return idsToRemove;
}

/** 根据 ID 集合裁剪消息 */
export function trimMessages(
  messages: ChatMessage[],
  idsToRemove: Set<string>
): ChatMessage[] {
  if (idsToRemove.size === 0) return messages;

  let removedCount = 0;
  const result: ChatMessage[] = [];
  for (const msg of messages) {
    // 不是 user 消息直接保留
    if (msg.role !== "user") {
      result.push(msg);
      continue;
    }
    const content = typeof msg.content === "string" ? msg.content : "";
    const id = extractMsgId(content);
    if (id && idsToRemove.has(id)) {
      removedCount++;
      continue;
    }
    result.push(msg);
  }

  if (removedCount > 0) {
    result.unshift({
      role: "user",
      content: `<dropped_messages count="${removedCount}">The preceding ${removedCount} message(s) were removed from the transcript to fit the context window.</dropped_messages>`,
    });
  }
  return result;
}

export default snipTool;
