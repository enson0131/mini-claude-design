// 文件系统工具（write_file, read_file, list_files）
// 内存文件系统，模拟项目文件存储

import { registerTool, type ToolDefinition } from "./index";

const fileStore = new Map<string, string>();

export function getFileStore() {
  return fileStore;
}

const writeTool: ToolDefinition = {
  name: "write_file",
  description: `Write content to a file in the project. Creates parent directories automatically.
Supports all file types: HTML pages, CSS stylesheets, JavaScript modules, and any text files.
For modular projects: write index.html as entry point (referencing external CSS/JS via relative paths), then write styles/*.css and js/*.js separately.
Overwrites if file already exists.`,
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: 'File path relative to project root, e.g. "components/Button.html"',
      },
      content: { type: "string", description: "The file content to write" },
    },
    required: ["path", "content"],
  },
  async execute({ path, content }) {
    const p = path as string;
    const c = content as string;
    fileStore.set(p, c);
    return `Written ${p} (${c.length} chars)`;
  },
};

const readTool: ToolDefinition = {
  name: "read_file",
  description: `Read the content of a file. Returns the full text content.
If the file doesn't exist, returns an error message.`,
  input_schema: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path to read" },
    },
    required: ["path"],
  },
  async execute({ path }) {
    const p = path as string;
    const content = fileStore.get(p);
    if (content === undefined) {
      return `Error: file not found: ${p}`;
    }
    return content;
  },
};

const listTool: ToolDefinition = {
  name: "list_files",
  description: `List all files in the project. Returns a flat list of file paths.`,
  input_schema: {
    type: "object",
    properties: {},
  },
  async execute() {
    const files = [...fileStore.keys()];
    if (files.length === 0) {
      return "(empty project)";
    }
    return files.join("\n");
  },
};

export default { write_file: writeTool, read_file: readTool, list_files: listTool };

// 注册所有文件系统工具
for (const tool of Object.values({ write_file: writeTool, read_file: readTool, list_files: listTool })) {
  registerTool(tool);
}
