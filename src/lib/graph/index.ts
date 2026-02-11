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
  .addNode("workerNode", workerNode)
  .addNode("synthesizerNode", synthesizerNode)
  .addNode("textNode", textNode)
  .addNode("imageNode", imageNode)
  .addNode("toolNode", toolNode)
  .addEdge(START, "classifierNode")
  .addConditionalEdges("classifierNode", (state) => {
    switch (state.shouldGenerate) {
      case "text":
        return "textNode";
      case "image_simple":
        return "textNode"; // 先去 textNode 优化提示词
      case "decompose":
      case "image_complex":
        return "supervisorNode";
      default:
        return "textNode";
    }
  })
  .addConditionalEdges("supervisorNode", distributeTasksNode)
  .addEdge("workerNode", "synthesizerNode")
  .addConditionalEdges("synthesizerNode", (state) => {
    if (state.shouldGenerate === "image_complex") {
      return "textNode"; // 复杂生图：拆分执行汇总后，去 textNode 优化提示词
    }
    return END;
  })
  .addConditionalEdges("textNode", (state) => {
    if (
      state.shouldGenerate === "image_simple" ||
      state.shouldGenerate === "image_complex"
    ) {
      return "imageNode"; // 提示词优化完成后，去生图
    }
    return END;
  })
  .addEdge("imageNode", END);

const checkpointer = new MemorySaver();

export const graph = builder.compile({
  checkpointer,
});
