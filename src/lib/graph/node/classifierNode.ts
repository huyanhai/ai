import { HumanMessage, SystemMessage } from "langchain";
import z from "zod";
import { qianWenModel } from "../../llm";
import { TypeScheme, type TTypeScheme } from "../../schema";
import type { TState } from "..";
import { Command } from "@langchain/langgraph";

const typeMap: Record<TTypeScheme, string> = {
  image: "[图片]",
  file: "[文件]",
  text: "[文本]",
};

/**
 * 意图识别节点
 * 将用户输入分类为：生图 (image)、文件 RAG (file)、普通对话 (text)
 */
export const classifierNode = async (state: TState) => {
  console.log("[Classifier] state:", state);
  const modelWithOutput = qianWenModel.withStructuredOutput(
    z.object({
      shouldGenerate: TypeScheme,
    }),
  );

  // 格式化消息内容，让模型更清晰地看到用户输入了什么
  const messages = state.message
    .map((m) => {
      if (m.type === "text") return m.text;
      return typeMap[m.type];
    })
    .filter(Boolean)
    .join("\n");

  // 判断会话中是否存在文件
  const hasFile = state.message.some((m) => m.type === "file");

  const res = await modelWithOutput.invoke([
    new SystemMessage(`你是一个极其专业的意图识别专家。你的任务是分析用户的输入，将其精确分类为以下三类之一：

1. "image" (生图意图):
   - 用户明确表达了“想要生成、画、创作、设计、制作”一张新图片的需求。
   - 关键词：画一个、生成、绘制、设计Logo、创作一张图。
   - 示例："帮我画一只戴墨镜的猫" -> image
   - 示例："生成一个赛博朋克风格的背景图" -> image

2. "file" (文件处理/RAG意图):
   - 用户要求基于已上传的文件/文档进行总结、分析、提取信息或针对性提问。
   - **前提条件**：只有在【会话包含文件】为“是”时，才允许归为此类。
   - 如果用户表达了文件处理意图，但【会话包含文件】为“否”，则必须归为 "text"。
   - 关键词：根据文件、总结一下、这篇文章说了什么、提取合同细节。
   - 示例："总结一下我刚才传的文件" (会话包含文件：是) -> file

3. "text" (普通对话/识图/闲聊):
   - 简单的问候、基础常识（无需实时联网）、代码编写、文学创作、心理咨询。
   - 示例："你好" -> text
   - 示例："帮我写一段 Python 代码" -> text
   - 示例："你觉得人工智能的未来是什么？" -> text

优先级规则：
- 如果用户提到“画”、“生成”，优先归为 "image"。
- 否则，针对文件操作且有文件，归为 "file"。
- 其余简单的对话 and 问答一律归为 "text"。`),
    new HumanMessage(
      `【上下文信息】
- 会话包含文件：${hasFile ? "是" : "否"}

【用户输入内容】
---
${messages}
---

请直接给出分类结果。`,
    ),
  ]);

  console.log(
    `[Classifier] Intent identified: ${res.shouldGenerate} for input: "${messages.slice(0, 50)}..."`,
  );

  return { shouldGenerate: res.shouldGenerate };
};
