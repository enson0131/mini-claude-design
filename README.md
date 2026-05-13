# Mini Claude Design

基于 Next.js + React + TypeScript + Tailwind CSS + 智谱 AI 大模型的网页设计助手。

## 功能

- 聊天驱动的 AI 设计助手，通过自然语言描述生成 HTML/CSS/JS 设计产物
- 实时文件管理和代码预览
- 支持多种智谱 AI 模型选择（GLM-4 Flash / Air / Plus 等）
- 流式输出，实时查看生成过程
- 工具调用可视化（文件读写、上下文裁剪）

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS 4
- **AI**: 智谱 AI (GLM) API + Function Calling
- **部署**: Vercel

## 开始使用

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)，点击右上角 "API Key" 按钮设置你的智谱 AI API Key。

## 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入仓库
3. 自动检测 Next.js 框架并部署

## 项目结构

```
├── app/
│   ├── api/chat/route.ts    # 智谱 AI API 流式代理
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 根布局
│   └── page.tsx              # 主页面
├── components/
│   ├── ApiKeyDialog.tsx      # API Key 设置弹窗
│   ├── ChatPanel.tsx         # 聊天面板
│   ├── FilesPanel.tsx        # 文件管理面板
│   ├── PreviewPanel.tsx      # 预览面板
│   ├── ResizeHandle.tsx      # 拖拽分隔条
│   ├── ToolCard.tsx          # 工具调用卡片
│   └── TopBar.tsx            # 顶部栏
├── lib/
│   ├── agent.ts              # Agent Loop 核心逻辑
│   ├── llm.ts                # 智谱 AI API 客户端
│   ├── types.ts              # 类型定义
│   └── tools/
│       ├── filesystem.ts     # 文件系统工具
│       ├── index.ts          # 工具注册表
│       └── snip.ts           # 上下文裁剪工具
└── package.json
```

