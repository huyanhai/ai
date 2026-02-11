import { visionAgent, chatAgent } from "@/lib/agent";
import { HumanMessage } from "langchain";

import type z from "zod";
import type { TState } from "..";

export const textNode = async (state: TState) => {
  const isImageIntent =
    state.shouldGenerate === "image_simple" ||
    state.shouldGenerate === "image_complex";
  const isImageTask = state.message.some((item) => item.type === "image");

  const agent = isImageTask ? visionAgent : await chatAgent();

  // 如果是生图意图，我们需要生成提示词
  // 如果 state.result 存在（来自 synthesizerNode），则基于汇总后的信息生成提示词
  // 否则基于用户原始消息生成提示词
  let promptText = "";
  if (isImageIntent) {
    const context = state.result ? `\n基于以下调研汇总信息：\n${state.result}` : "";
    promptText = `你是一位图片提示词生成专家。请根据用户需求${context}\n生成一段精美的图片描述词。
    要求使用中文提示词，图片尺寸${state.config.aspect}。
    用户的输入是: ${state.message[state.message.length - 1]?.text}`;
  } else {
    promptText = `你是一位友好的 AI 助手。请直接回复用户的输入。
    用户的输入是: `;
  }

  try {
    const res = await agent.invoke(
      {
        messages: [
          new HumanMessage({
            content: [
              {
                type: "text",
                text: promptText,
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
    return { result: "处理失败" };
  }
};
