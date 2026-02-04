import { visionAgent, chatAgent } from "@/lib/agent";
import { HumanMessage } from "langchain";

import type z from "zod";
import type { TState } from "..";

export const textNode = async (state: TState) => {
  const isImageIntent = state.shouldGenerate === "image";
  const isImageTask = state.message.some((item) => item.type === "image");

  const agent = isImageTask ? visionAgent : await chatAgent();
  const prompt = isImageIntent
    ? `你是一位图片提示词生成专家。请根据用户需求生成一段精美的图片描述词。
    要求使用中文提示词，图片尺寸${state.config.aspect}。
    用户的输入是: `
    : `你是一位友好的 AI 助手。请直接回复用户的输入。
    用户的输入是: `;

  try {
    const res = await agent.invoke(
      {
        messages: [
          new HumanMessage({
            content: [
              {
                type: "text",
                text: prompt,
              },
              ...state.message.filter((item) => item.type !== "file"),
            ],
          }),
        ],
      },
      {
        configurable: { thread_id: state.threadId || "default" },
        recursionLimit: 50,
      },
    );
    const message = res.messages;
    const result = message[message.length - 1]?.content;
    return { result };
  } catch (error) {
    console.error("error", error);
    return { result: "生成失败" };
  }
};
