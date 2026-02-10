import { HumanMessage, SystemMessage } from "langchain";
import { qianWenModel } from "../../llm";
import type { TTask } from "../../schema";
import { getToolByName, getTools, mcpTools } from "@/lib/mcp";

/**
 * Worker 智能体
 * 一个通用的执行单元，根据 Supervisor 分配的任务和角色进行工作
 */
export const workerNode = async (state: { task: TTask; threadId?: string }) => {
  const { task } = state;
  try {
    const prompt = `你是一位优秀的 ${task.role}。
你的当前任务是：${task.task}
如果你发现任务无法完成，请说明理由。`;

    const response = await qianWenModel
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
