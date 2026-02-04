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

export type TConfigScheme = z.infer<typeof ConfigScheme>;
export type TTypeScheme = z.infer<typeof TypeScheme>;
