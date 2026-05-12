// 工具注册表 + 调度器

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  execute: (input: Record<string, unknown>, ctx: unknown) => Promise<string>;
  enabled?: () => boolean;
}

export const toolRegistry = new Map<string, ToolDefinition>();

export function registerTool(def: ToolDefinition) {
  toolRegistry.set(def.name, def);
}

export function getToolDefinitions() {
  return [...toolRegistry.values()]
    .filter((t) => !t.enabled || t.enabled())
    .map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema,
    }));
}

export async function dispatchTool(
  toolName: string,
  input: Record<string, unknown>,
  ctx: unknown
): Promise<string> {
  const tool = toolRegistry.get(toolName);
  if (!tool?.execute) {
    return `Unknown tool: ${toolName}`;
  }
  return await tool.execute(input, ctx);
}
