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
  .addNode("supervisorNode", supervisorNode)
  .addNode("workerNode", workerNode)
  .addNode("synthesizerNode", synthesizerNode)
  // 虽然暂时不用，但保留节点定义以便后续扩展
  .addNode("textNode", textNode)
  .addNode("toolNode", toolNode)
  // .addNode("imageNode", imageNode)
  // .addNode("fileNode", fileNode)
  // .addNode("approvalNode", approvalNode, {
  //   ends: ["textNode", "toolNode", END],
  // })
  .addEdge(START, "supervisorNode")
  .addConditionalEdges("supervisorNode", distributeTasksNode)
  .addEdge("workerNode", "synthesizerNode")
  .addEdge("synthesizerNode", END);

const checkpointer = new MemorySaver();

export const graph = builder.compile({
  checkpointer,
});
