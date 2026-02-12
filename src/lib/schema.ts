import { z } from "zod";

export const ConfigScheme = z.object({
  aspect: z.enum(["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"]).default("16:9"),
});

export const TypeScheme = z
  .enum([
    "text",
    "image",
    "file",
    "decompose",
    "image_simple",
    "image_complex",
    "smart_home",
  ])
  .default("text")
  .describe(
    "对话意图分类或消息类型：text (纯对话/文本)、image (图片附件)、file (文件附件)、decompose (复杂任务拆分)、image_simple (简单逻辑生图)、image_complex (复杂逻辑拆分生图)、smart_home (3D智能家居控制)",
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
  role: z
    .string()
    .describe("Agent 的角色设定，例如 '资深程序员' 或 '资深文案策划'"),
  task: z.string().describe("分配给该 Agent 的具体工作内容"),
  dependencies: z.array(z.string()).describe("依赖的任务 ID 列表"),
  modelType: z
    .enum(["qianwen", "google"])
    .default("qianwen")
    .describe("该任务需要使用的大模型类型"),
});

export type TConfigScheme = z.infer<typeof ConfigScheme>;
export type TTypeScheme = z.infer<typeof TypeScheme>;
export type TTask = z.infer<typeof TaskSchema>;
