import { HumanMessage, SystemMessage } from "langchain";
import { qianWenModel, googleModel, googleImageModel } from "../../llm";
import type { TTask } from "../../schema";
import { getToolByName, getTools } from "@/lib/mcp";

/**
 * Worker 智能体
 * 一个通用的执行单元，根据 Supervisor 分配的任务和角色进行工作
 */
export const workerNode = async (state: {
  task: TTask;
  threadId?: string;
  agent_outputs?: Record<string, string>;
}) => {
  const { task, agent_outputs = {} } = state;
  console.log(`[Worker:${task.id}] Using model: ${task.modelType}`);

  try {
    // 构造依赖任务的结果上下文
    let dependencyContext = "";
    if (task.dependencies.length > 0) {
      dependencyContext = "\n以下是你的任务所依赖的前序任务执行结果，请参考并在此基础上开展工作：\n";
      task.dependencies.forEach((depId) => {
        const output = agent_outputs[depId];
        if (output) {
          dependencyContext += `---
任务 ID: ${depId}
执行结果: ${output}
---
`;
        }
      });
    }

    const systemPrompt = `你是一位优秀的 ${task.role}。
你的当前任务是：${task.task}
${dependencyContext}
请利用可用的工具来完成任务。如果调用了工具，请根据工具返回的结果进行分析和总结，并给出最终的、专业的回答。
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

    const tools = await getTools();
    const modelWithTools = model.bindTools(tools);
    
    let messages: any[] = [
      new SystemMessage(systemPrompt),
      new HumanMessage("请开始你的工作。"),
    ];

    let response = await modelWithTools.invoke(messages, {
      configurable: { thread_id: state.threadId || "default" },
    });

    // 循环处理工具调用，直到模型不再需要调用工具
    let iterations = 0;
    while (response.tool_calls && response.tool_calls.length > 0 && iterations < 5) {
      messages.push(response); // 添加 AI 的工具调用消息

      for (const toolCall of response.tool_calls) {
        const tool = getToolByName(toolCall.name);
        if (tool) {
          const observation = await tool.invoke(toolCall);
          messages.push(observation); // 添加工具返回的结果消息
        }
      }

      // 再次调用模型，让它基于工具结果进行总结
      response = await modelWithTools.invoke(messages, {
        configurable: { thread_id: state.threadId || "default" },
      });
      iterations++;
    }

    const finalContent = typeof response.content === "string" 
      ? response.content 
      : JSON.stringify(response.content);

    return {
      agent_outputs: {
        [task.id]: finalContent,
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
