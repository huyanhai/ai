import { z } from "zod";

export const ConfigScheme = z.object({
  aspect: z.enum(["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"]).default("16:9"),
});

export const TypeScheme = z
  .enum(["image", "file", "text"])
  .default("text")
  .describe(
    "对话意图分类：image (生成/绘画图片)、file (基于上传文件的分析/查询/RAG)、text (普通聊天/识图/其他)",
  );

export const MessageSchema = z.array(
  z.object({
    type: TypeScheme,
    text: z.string().optional(),
    url: z.string().optional(),
    hash: z.string().optional(),
    source_type: z.string().optional(),
  }),
);

export const TaskSchema = z.object({
  id: z.string().describe("任务唯一标识符，如 'researcher', 'writer' 等"),
  role: z.string().describe("Agent 的角色设定，例如 '资深程序员' 或 '资深文案策划'"),
  task: z.string().describe("分配给该 Agent 的具体工作内容"),
  dependencies: z.array(z.string()).describe("依赖的任务 ID 列表"),
});

export type TConfigScheme = z.infer<typeof ConfigScheme>;
export type TTypeScheme = z.infer<typeof TypeScheme>;
export type TTask = z.infer<typeof TaskSchema>;
