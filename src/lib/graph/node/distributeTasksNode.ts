import { END, Send } from "@langchain/langgraph";
import type { TState } from "..";

export const distributeTasksNode = (state: TState) => {
  if (state.tasks.length === 0) {
    return END; // 直接结束，Supervisor 的 result 就是最终答案
  }
  return state.tasks.map((task) => {
    // 动态创建节点
    return new Send("workerNode", { task, threadId: state.threadId });
  });
};
