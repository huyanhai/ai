import { googleImageModel } from "../../llm";
import type z from "zod";
import { HumanMessage } from "langchain";
import type { TState } from "..";

export const imageNode = async (state: TState) => {
  try {
    // 此时 state.result 已经是 readNode 生成好的优化提示词
    const prompt = state.result || "生成一张精美的图片";

    const res = await googleImageModel.invoke([
      new HumanMessage({
        content: [
          {
            type: "text",
            text: `请直接根据以下提示词生成图片，不要返回任何文字描述，只返回图片数据：\n${prompt}`,
          },
        ],
      }),
    ]);

    const block = res.content[0] as any;

    if (!block) {
      console.error("[imageNode] Empty response from model");
      return { result: "图片生成失败：模型未返回任何内容" };
    }

    // 处理文本回复（通常是模型拒绝或报错）
    if (block.type === "text" && !block.image && !block.image_url) {
      console.error(
        "[imageNode] Model returned text instead of image:",
        block.text,
      );
      return { result: "图片生成失败：" + block.text };
    }

    // 尝试多种路径获取图像数据 (适配不同模型返回格式)
    const imageData =
      block.image || block.image_url || block[block.type] || block;

    // 1. 如果是 base64 数据
    if (imageData.data && imageData.mimeType) {
      const img = `data:${imageData.mimeType};base64,${imageData.data}`;
      return { result: img };
    }

    // 2. 如果是直接的 URL
    if (imageData.url) {
      return { result: imageData.url };
    }

    // 3. 最后的降级处理：如果 block 本身就是字符串且看起来像 data url
    if (typeof block === "string" && block.startsWith("data:image")) {
      return { result: block };
    }

    console.error(
      "[imageNode] Could not extract image from response:",
      JSON.stringify(block).slice(0, 200),
    );
    return { result: "图片生成失败：无法识别模型返回的数据格式" };
  } catch (error) {
    console.error("[imageNode] Fatal error during image generation:", error);
    return { result: "图片生成系统错误" };
  }
};
