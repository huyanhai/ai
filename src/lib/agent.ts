import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";

import { googleImageModel, googleModel, qianWenModel } from "./llm";

import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ZHIPU_API_KEY } from "@/constants/env";

export const checkpointer = new MemorySaver();

let tools: Awaited<ReturnType<MultiServerMCPClient["getTools"]>> | null = null;

const mcpClient = new MultiServerMCPClient({
  // "bing-search": {
  //   command: "npx",
  //   args: ["bing-cn-mcp"],
  // },
  "zhipu-web-search-sse": {
    transport: "http",
    url: `https://open.bigmodel.cn/api/mcp/web_search/sse?Authorization=${ZHIPU_API_KEY}`,
  },
});

const getTools = async () => {
  if (!tools) {
    tools = await mcpClient.getTools();
  }
  return tools;
};

// --- 普通对话 Agent (No Tools) ---
export const chatAgent = async () => {
  return createAgent({
    model: qianWenModel,
    tools: await getTools(),
    checkpointer,
  });
};

// --- 视觉能力 Agent (Google Gemini) ---
export const visionAgent = createAgent({
  model: googleModel,
  tools: [], // 暂时不给视觉 Agent 加搜索，保持专注
  checkpointer,
});

// --- 专用于生图的 Agent ---
export const imageAgent = createAgent({
  model: googleImageModel,
  tools: [],
  checkpointer,
});

getTools();
