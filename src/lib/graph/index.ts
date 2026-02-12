import {
  Annotation,
  START,
  StateGraph,
  END,
  MemorySaver,
} from "@langchain/langgraph";
import * as z from "zod";
import { ConfigScheme, MessageSchema, TypeScheme, type TTask } from "../schema";

import { textNode } from "./node/textNode";
import { supervisorNode } from "./node/supervisorNode";
import { workerNode } from "./node/workerNode";
import { synthesizerNode } from "./node/synthesizerNode";
import { toolNode } from "./node/toolsNode";
import { distributeTasksNode } from "./node/distributeTasksNode";
import { classifierNode } from "./node/classifierNode";
import { imageNode } from "./node/imageNode";
import { smartHomeNode } from "./node/smartHomeNode";

export const State = Annotation.Root({
  message: Annotation<z.infer<typeof MessageSchema>>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  config: Annotation<z.infer<typeof ConfigScheme>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({ aspect: "16:9" }),
  }),
  result: Annotation<string>({
    reducer: (x, y) => y ?? x,
  }),
  shouldGenerate: Annotation<z.infer<typeof TypeScheme>>({
    reducer: (x, y) => y ?? x,
    default: () => "text",
  }),
  name: Annotation<string | undefined>(),
  threadId: Annotation<string | undefined>(),
  tasks: Annotation<TTask[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  // 存储每个workerNode的输出
  agent_outputs: Annotation<Record<string, string>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
});

export type TState = typeof State.State;

export const InputState = z.object({
  message: MessageSchema,
  config: ConfigScheme,
  name: z.string().optional(),
  threadId: z.string().optional(),
});

const builder = new StateGraph(State)
  .addNode("classifierNode", classifierNode)
  .addNode("supervisorNode", supervisorNode)
  .addNode("distributeTasksNode", (state) => state) // 作为一个中转/分发节点
  .addNode("workerNode", workerNode)
  .addNode("synthesizerNode", synthesizerNode)
  .addNode("textNode", textNode)
  .addNode("imageNode", imageNode)
  .addNode("toolNode", toolNode)
  .addNode("smartHomeNode", smartHomeNode)
  .addEdge(START, "classifierNode")
  .addConditionalEdges("classifierNode", (state) => {
    switch (state.shouldGenerate) {
      case "text":
        return "textNode";
      case "image_simple":
        return "textNode";
      case "decompose":
      case "image_complex":
        return "supervisorNode";
      case "smart_home":
        return "smartHomeNode";
      default:
        return "textNode";
    }
  })
  // Supervisor 完成任务拆解后，进入分发器
  .addEdge("supervisorNode", "distributeTasksNode")
  // 分发器根据依赖关系判断下一步：并行执行 Worker 或 进入汇总
  .addConditionalEdges("distributeTasksNode", distributeTasksNode)
  // 每个 Worker 执行完后，重新回到分发器，检查是否有新的依赖项已满足
  .addEdge("workerNode", "distributeTasksNode")
  .addConditionalEdges("synthesizerNode", (state) => {
    if (state.shouldGenerate === "image_complex") {
      return "textNode";
    }
    return END;
  })
  .addConditionalEdges("textNode", (state) => {
    if (
      state.shouldGenerate === "image_simple" ||
      state.shouldGenerate === "image_complex"
    ) {
      return "imageNode";
    }
    return END;
  })
  .addEdge("imageNode", END)
  .addEdge("smartHomeNode", END);

const checkpointer = new MemorySaver();

export const graph = builder.compile({
  checkpointer,
});
