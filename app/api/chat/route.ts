// 智谱 AI API 流式代理路由
// 解决浏览器直接调用可能遇到的 CORS 问题

export const runtime = "edge";

const ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

export async function POST(request: Request) {
  const { apiKey, model, messages, tools, stream } = await request.json();

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "未提供 API Key" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body: Record<string, unknown> = {
    model: model || "glm-4-flash",
    messages,
    max_tokens: 64000,
    temperature: 0.7,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  // 流式请求
  if (stream) {
    body.stream = true;
    body.stream_options = { include_usage: true };

    const resp = await fetch(ZHIPU_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      return new Response(errorText, { status: resp.status });
    }

    // 直接转发 SSE 流
    return new Response(resp.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // 非流式请求
  const resp = await fetch(ZHIPU_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    return new Response(errorText, { status: resp.status });
  }

  const data = await resp.json();
  return Response.json(data);
}
