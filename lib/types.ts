// 类型定义

export interface ChatMessage {
  role: "user" | "assistant" | "tool" | "system";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ModelOption {
  id: string;
  label: string;
}

export interface StreamCallbacks {
  onTextChunk?: (chunk: string) => void;
  onDone?: (accumulated: AccumulatedResponse) => void;
}

export interface AccumulatedResponse {
  content: string;
  tool_calls: ToolCall[];
  usage: { prompt_tokens: number; completion_tokens: number };
  finish_reason: string | null;
}

export interface APIResponse {
  choices: {
    message: {
      role: string;
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}
