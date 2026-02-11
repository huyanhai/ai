import { Send } from "@langchain/langgraph";
import type { TState } from "..";

/**
 * 任务分发器 (Orchestrator Logic)
 * 核心逻辑：
 * 1. 检查 state.agent_outputs，确定哪些任务已完成。
 * 2. 找出未完成且所有依赖项都已完成的任务。
 * 3. 动态分发这些“就绪”的任务。
 * 4. 如果所有任务都已完成，则进入汇总阶段。
 */
export const distributeTasksNode = (state: TState) => {
  const completedTaskIds = Object.keys(state.agent_outputs);
  
  // 1. 如果没有任务，或者所有任务都已完成，直接去汇总
  if (state.tasks.length === 0 || state.tasks.every(t => completedTaskIds.includes(t.id))) {
    return "synthesizerNode";
  }

  // 2. 找到所有“未开始”且“依赖已满足”的任务
  const readyTasks = state.tasks.filter(task => {
    const isCompleted = completedTaskIds.includes(task.id);
    const dependenciesMet = task.dependencies.every(depId => completedTaskIds.includes(depId));
    return !isCompleted && dependenciesMet;
  });

  // 3. 如果有就绪任务，分发执行
  if (readyTasks.length > 0) {
    return readyTasks.map((task) => {
      return new Send("workerNode", { 
        task, 
        threadId: state.threadId,
        // 将之前任务的输出传递给 Worker，以便其作为上下文使用
        agent_outputs: state.agent_outputs 
      });
    });
  }

  // 4. 兜底逻辑：如果没有就绪任务但还有未完成任务（可能存在循环依赖或异常），进入汇总
  return "synthesizerNode";
};
