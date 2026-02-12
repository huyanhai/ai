import { HumanMessage, SystemMessage } from "langchain";
import z from "zod";
import { qianWenModel } from "../../llm";
import { TypeScheme, type TTypeScheme } from "../../schema";
import type { TState } from "..";
import { Command } from "@langchain/langgraph";

const typeMap: Record<TTypeScheme, string> = {
  text: "[对话]",
  image: "[图片附件]",
  file: "[文件附件]",
  decompose: "[任务拆分]",
  image_simple: "[简单生图]",
  image_complex: "[复杂生图]",
  smart_home: "[智能家居控制]",
};

/**
 * 意图识别节点
 * 负责将用户输入分发到：基础对话 (text)、复杂拆分 (decompose)、简单生图 (image_simple)、复杂生图 (image_complex)
 */
export const classifierNode = async (state: TState) => {
  console.log("[Classifier] Analying user intent...");
  const modelWithOutput = qianWenModel.withStructuredOutput(
    z.object({
      shouldGenerate: TypeScheme,
    }),
  );

  const messages = state.message
    .map((m) => {
      if (m.type === "text") return m.text;
      return `[${m.type}]`;
    })
    .filter(Boolean)
    .join("\n");

  const res = await modelWithOutput.invoke([
    new SystemMessage(`# 意图识别与模型调度专家

你是一个极其专业的 AI 系统调度员。你的任务是分析用户的输入意图，并从以下四个核心执行逻辑中选择最匹配的路径。

## 核心执行路径定义

### 1. text (基础对话模式)
- **判定标准**：用户进行简单的问候、基础常识问答、闲聊。不需要调用复杂工具或分多个步骤。
- **示例**：“你好”、“今天天气怎么样”、“帮我写一段 Python 代码”。

### 2. decompose (多步任务规划模式)
- **判定标准**：用户需求具有高度复杂性，需要通过多个子任务配合才能完成（如：联网调研、多角度分析、多角色协作），或者涉及深度的文件处理。
- **示例**：“帮我对比最近三年的新能源汽车行业报告”、“分析我上传的文件”。

### 3. image_simple (视觉创作 - 简单模式)
- **判定标准**：用户明确表达了绘图需求，且需求描述清晰直观，无需前置调查。
- **示例**：“画一个戴墨镜的猫”、“生成一张赛博朋克风格的赛车图”。

### 4. image_complex (视觉创作 - 复杂模式)
- **判定标准**：需要基于特定事实、参考资料或多维度调研后再进行图片创作。
- **示例**：“根据我刚才上传的方案书，设计一张对应的宣传海报”、“对比分析这两家公司，然后画一张未来趋势图”。

### 5. smart_home (3D 智能家居控制)
- **判定标准**：用户想要控制 3D 场景中的设备（灯光、门、温度等）。
- **示例**：“把灯调成红色”、“开门”、“设置温度为 25 度”。

## 判定优先级
- 涉及控制 3D 场景、灯火、家电、门窗等，归类为 smart_home。
- 涉及绘图意愿，优先归类为 image_simple 或 image_complex。
- 若逻辑复杂、涉及多步分析或文件理解，归类为 decompose。
- 其余所有交互归类为 text。`),
    new HumanMessage(
      `【用户输入内容】
---
${messages}
---

请根据以上定义，直接给出最匹配的分类路径。`,
    ),
  ]);

  console.log(`[Classifier] Intent identified: ${res.shouldGenerate}`);

  return { shouldGenerate: res.shouldGenerate };
};
