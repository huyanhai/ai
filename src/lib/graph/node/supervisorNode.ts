import { HumanMessage, SystemMessage } from "langchain";
import z from "zod";
import { qianWenModel } from "../../llm";
import { TaskSchema } from "../../schema";
import type { TState } from "..";

/**
 * Supervisor 智能体
 * 负责分析用户意图，并将任务拆解给多个 Expert Agents
 */
export const supervisorNode = async (state: TState) => {
  try {
    console.log("[Supervisor] Analyzing request...");

    const messages = state.message
      .map((m) => {
        if (m.type === "text") return m.text;
        return `[${m.type}]`;
      })
      .filter(Boolean)
      .join("\n");

    const res = await qianWenModel
      .withStructuredOutput(
        z.object({
          tasks: z.array(TaskSchema),
          plan_description: z.string().describe("对当前执行计划的简短描述"),
        }),
      )
      .invoke([
        new SystemMessage(`你是一个极其高效的任务调度专家 (Supervisor Agent)。
你的任务是：
1. 分析用户的需求。
2. **判断复杂性**：
   - 如果用户的问题简单（如：你好、1+1等于几、你是谁、简单的闲聊、或者一个非常简单的问题），**请不要拆解子任务**。此时，请将 \`tasks\` 数组保持为空 \`[]\`，并在 \`plan_description\` 中直接给出你的完整回答。
   - 如果用户的问题复杂（如：多步骤分析、需要联网搜索、文件深度分析），请将其拆解为多个子任务并指派专家。
3. 为每个子任务指派对应的专家智能体 (Expert Agent) 并选择适当的模型 (modelType)。

模型选择指南 (modelType)：
- qianwen: 默认模型，适用于大多数文本处理、逻辑分析任务。
- google: 适用于需要更强推理能力、长上下文处理或文件深度分析任务。

配置建议：
- WebResearcher: 联网搜索任务，建议 modelType: qianwen。
- DataAnalyzer: 文件深度分析或向量数据库查询，建议 modelType: google。
- GeneralAssistant: 复杂逻辑处理。

请优先判断是否可以直接回答。`),
        new HumanMessage(`用户需求：\n${messages}`),
      ]);

    console.log(`[Supervisor] Created ${res.tasks.length} tasks.`);

    if (res.tasks.length === 0) {
      return {
        tasks: [],
        result: res.plan_description, // 直接给出回答
      };
    }

    return {
      tasks: res.tasks,
      result: `### 📋 执行计划\n${res.plan_description}`,
    };
  } catch (error) {
    console.error("[Supervisor] Error:", error);
    return {
      tasks: [
        {
          id: "fallback",
          role: "GeneralAssistant",
          task: "处理用户的基本请求",
          dependencies: [],
        },
      ],
      result: "任务调度出现异常，已指派通用助手为您处理。",
    };
  }
};
