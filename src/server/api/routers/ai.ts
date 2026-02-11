import { googleModel } from "@/lib/llm";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import { graph } from "@/lib/graph";
import { Command } from "@langchain/langgraph";
import { ConfigScheme, MessageSchema } from "@/lib/schema";

export const aiRouter = createTRPCRouter({
  chat: publicProcedure
    .input(
      z.object({
        message: z.string(),
      }),
    )
    .mutation(async function* ({ input }) {
      const stream = await googleModel.stream(input.message);
      for await (const chunk of stream) {
        yield chunk.content;
      }
    }),
  flow: publicProcedure
    .input(
      z.object({
        message: MessageSchema.optional(),
        config: ConfigScheme.optional(),
        threadId: z.string().optional(),
        resumeValue: z.any().optional(),
      }),
    )
    .mutation(async function* ({ input }) {
      const { message, config, threadId, resumeValue } = input;

      // 立即发送一个初始状态，让前端显示“思考中”，改善响应感
      yield {
        type: "step_start",
        name: "AI",
      };

      const inputSignal = resumeValue !== undefined
        ? new Command({ resume: resumeValue }) 
        : { message, config, threadId };

      const stream = graph.streamEvents(
        inputSignal as any,
        {
          version: "v2",
          recursionLimit: 50,
          configurable: { thread_id: threadId },
        },
      );
      for await (const chunk of stream) {
        const name = chunk.name;
        const hasNode = [
          "textNode",
          "imageNode",
          "fileNode",
          "supervisorNode",
          "workerNode",
          "synthesizerNode",
          "approvalNode",
        ].includes(name);


        if (chunk.event === "on_chain_start" && hasNode) {
          let displayName = name;
          if (name === "workerNode") {
            const task = chunk.data.input?.task;
            if (task?.id) {
              displayName = `Worker:${task.id}`;
            }
          }
          yield {
            type: "step_start",
            name: displayName,
          };
        } else if (chunk.event === "on_chain_end" && hasNode) {
          let displayName = name;
          let output = chunk.data.output;

          if (name === "workerNode") {
            const task = chunk.data.input?.task;
            if (task?.id) {
              displayName = `Worker:${task.id}`;
              // Extract only the specific task output to avoid JSON wrapping
              if (output?.agent_outputs && output.agent_outputs[task.id]) {
                output = output.agent_outputs[task.id];
              }
            }
          }
          yield {
            type: "step_end",
            name: displayName,
            data: {
              output,
            },
          };
        } else if (chunk.event === "on_tool_start") {
          let description = "";
          // 移除正在搜索和正在调用工具的文字提示
          yield {
            type: "tool_start",
            name: chunk.name,
            content: description,
          };
        } else if (chunk.event === "on_tool_end") {
          let content = "";
          const output = chunk.data.output;

          if (output && typeof output === "object") {
            content =
              typeof output.content === "string"
                ? output.content
                : JSON.stringify(output.content || output);
          } else {
            content = String(output);
          }

          yield {
            type: "tool_end",
            name: chunk.name,
            content,
          };
        } else if (chunk.event === "on_chat_model_stream") {
          const currentNode = chunk.metadata?.langgraph_node;
          
          // 排除掉结构化输出节点的 Token 流（如 classifierNode, supervisorNode）
          // 这些节点流出的是 JSON 字符串，直接展示会造成界面闪烁代码
          const blockedNodes = ["classifierNode", "supervisorNode"];
          if (currentNode && blockedNodes.includes(currentNode)) {
            continue;
          }

          const data = chunk.data as {
            chunk?: { content?: string };
            content?: string;
          };
          const content = data?.chunk?.content ?? data?.content;
          if (typeof content === "string" && content) {
            yield {
              type: "token",
              name: currentNode || name,
              content,
            };
          }
        }
      }
    }),
});
