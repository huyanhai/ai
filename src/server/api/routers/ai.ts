import { googleModel } from "@/lib/llm";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import { graph } from "@/lib/graph";
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
      }),
    )
    .mutation(async function* ({ input }) {
      const { message, config, threadId } = input;

      const stream = graph.streamEvents(
        { message, config, threadId },
        {
          version: "v2",
          recursionLimit: 50,
          configurable: { thread_id: threadId },
        },
      );
      for await (const chunk of stream) {
        const name = chunk.name;
        const hasNode = ["textNode", "imageNode", "fileNode"].includes(name);

        if (chunk.event === "on_chain_start" && hasNode) {
          yield {
            type: "step_start",
            name,
          };
        } else if (chunk.event === "on_chain_end" && hasNode) {
          yield {
            type: "step_end",
            name,
            data: {
              output: chunk.data.output,
            },
          };
        } else if (chunk.event === "on_tool_start") {
          let description = "";
          const toolInput = chunk.data.input as Record<string, any>;
          if (name === "bing-search" && toolInput.query) {
            description = `正在搜索: ${toolInput.query}`;
          } else {
            description = `正在调用工具: ${name}`;
          }

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
          const data = chunk.data as {
            chunk?: { content?: string };
            content?: string;
          };
          const content = data?.chunk?.content ?? data?.content;
          if (typeof content === "string" && content) {
            yield {
              type: "token",
              name,
              content,
            };
          }
        }
      }
    }),
});
