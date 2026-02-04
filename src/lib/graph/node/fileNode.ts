import { SystemMessage, HumanMessage } from "langchain";
import type z from "zod";
import { chatAgent } from "../../agent";
import type { TState } from "..";
import { queryVectorStore } from "../../vector-store";

export const fileNode = async (state: TState) => {
  const userQuery =
    [...state.message].reverse().find((m) => m.type === "text")?.text ||
    "请总结文件内容";

  const currentFileHashes = state.message.filter(
    (m) => m.type === "file" && m.hash,
  );

  // 提取所有涉及到的文件 hash 并去重
  const hashes = Array.from(
    new Set(currentFileHashes.map((m) => m.hash as string)),
  );

  // 支持多个 hash 过滤
  const filter = hashes.length > 0 ? { hash: hashes } : undefined;

  try {
    // 降低阈值为 0.1 以确保能搜到东西（调试用）
    let searchResults = await queryVectorStore(userQuery, 5, filter, 0.5);
    console.log(
      `[fileNode] Search with filter yielded ${searchResults.length} results`,
    );

    if (searchResults.length === 0 && filter) {
      console.log(
        "[fileNode] Debug: No results with filter, trying without filter...",
      );
      searchResults = await queryVectorStore(userQuery, 5, undefined, 0.1);
    }

    if (searchResults.length === 0) {
      return {
        result:
          "抱歉，我没有在当前的文件中找到与您的提问相关的信息。请确保文件内容包含相关概念，或者尝试换个问法。",
      };
    }

    const context = searchResults
      .map(
        (
          res: { metadata: { fileName: string }; text: string; score: number },
          i: number,
        ) =>
          `[文档片段 ${i + 1} 来自文件: ${res.metadata.fileName} (相关度: ${res.score.toFixed(2)})]\n内容: ${res.text}`,
      )
      .join("\n\n");

    const agent = await chatAgent();
    const response = await agent.invoke(
      {
        messages: [
          new SystemMessage(
            `你是一位专业的文档分析专家。请根据以下提供的文档片段内容，准确且详尽地回答用户的问题。
      如果文档中没有提到相关信息，请直接告知用户，不要捏造事实。
      
      参考文档内容：
      ${context}`,
          ),
          new HumanMessage(userQuery),
        ],
      },
      {
        configurable: { thread_id: state.threadId || "default" },
        recursionLimit: 50,
      },
    );

    return {
      result: response.messages[response.messages.length - 1]
        ?.content as string,
    };
  } catch (error) {
    console.error("Error in fileNode:", error);
    return {
      result:
        "抱歉，我没有在当前的文件中找到与您的提问相关的信息。请确保文件内容包含相关概念，或者尝试换个问法。",
    };
  }
};
