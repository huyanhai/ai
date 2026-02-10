import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { googleImageModel, googleModel, qianWenModel } from "./llm";
import { getTools } from "./mcp";

export const checkpointer = new MemorySaver();

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
