import { HumanMessage, SystemMessage } from "langchain";
import { qianWenModel, googleModel, googleImageModel } from "../../llm";
import type { TTask } from "../../schema";
import { getToolByName, getTools } from "@/lib/mcp";

/**
 * Worker 智能体
 * 一个通用的执行单元，根据 Supervisor 分配的任务和角色进行工作
 */
export const workerNode = async (state: { task: TTask; threadId?: string }) => {
  const { task } = state;
  console.log(`[Worker:${task.id}] Using model: ${task.modelType}`);
  
  try {
    const prompt = `你是一位优秀的 ${task.role}。
你的当前任务是：${task.task}
如果你发现任务无法完成，请说明理由。`;

    // 根据 modelType 选择对应的模型
    let model;
    switch (task.modelType) {
      case "google":
        model = googleModel;
        break;
      case "qianwen":
      default:
        model = qianWenModel;
        break;
    }

    const response = await model
      .bindTools(await getTools())
      .invoke(
        [new SystemMessage(prompt), new HumanMessage("请开始你的工作。")],
        {
          configurable: { thread_id: state.threadId || "default" },
        },
      );

    const lastMessage = response.content;
    let content =
      typeof lastMessage === "string"
        ? lastMessage
        : JSON.stringify(lastMessage);

    // 调用工具
    for (const toolCall of response.tool_calls ?? []) {
      const tool = getToolByName(toolCall.name);
      const observation = await tool?.invoke(toolCall);
      content += observation?.content;
    }

    return {
      agent_outputs: {
        [task.id]: content,
      },
    };
  } catch (error) {
    console.error(`[Worker:${task.id}] Error:`, error);
    return {
      agent_outputs: {
        [task.id]: `[任务执行失败]：无法完成分配的任务。错误详情：${error instanceof Error ? error.message : String(error)}`,
      },
    };
  }
};
