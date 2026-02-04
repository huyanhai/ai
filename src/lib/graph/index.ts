import { Annotation, START, StateGraph, END, MemorySaver } from "@langchain/langgraph";
import * as z from "zod";
import { ConfigScheme, MessageSchema, TypeScheme } from "../schema";

import { textNode } from "./node/textNode";
import { imageNode } from "./node/imageNode";
import { fileNode } from "./node/fileNode";
import { classifierNode } from "./node/classifierNode";

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
});

export type TState = typeof State.State;

export const InputState = z.object({
  message: MessageSchema,
  config: ConfigScheme,
  name: z.string().optional(),
  threadId: z.string().optional(),
});

const route = async (state: TState) => {
  if (state.shouldGenerate === "file") {
    return "fileNode";
  } else {
    return "textNode";
  }
};

// readNode 的后续路由：如果是生图任务，继续前往 imageNode
const readRoute = (state: TState) => {
  if (state.shouldGenerate === "image" && state.result) {
    return "imageNode";
  }
  return END;
};

const builder = new StateGraph(State);

const checkpointer = new MemorySaver();

export const graph = builder
  .addNode("classifierNode", classifierNode)
  .addNode("textNode", textNode)
  .addNode("imageNode", imageNode)
  .addNode("fileNode", fileNode)
  .addEdge(START, "classifierNode")
  .addConditionalEdges("classifierNode", route)
  .addConditionalEdges("textNode", readRoute)
  .addEdge("imageNode", END)
  .addEdge("fileNode", END)
  .compile({
    checkpointer,
  });
