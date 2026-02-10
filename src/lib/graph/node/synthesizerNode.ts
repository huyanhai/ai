import { HumanMessage, SystemMessage } from "langchain";
import { qianWenModel } from "../../llm";
import type { TState } from "..";

/**
 * Synthesizer 智能体
 * 负责汇总所有专家智能体的输出，并整理成最终回复给用户
 */
export const synthesizerNode = async (state: TState) => {
  try {
    console.log("[Synthesizer] Combining outputs...");

    const outputs = Object.entries(state.agent_outputs)
      .map(([id, content]) => `### 专家 [${id}] 的贡献：\n${content}`)
      .join("\n\n---\n\n");

    const res = await qianWenModel.invoke([
      new SystemMessage(`你是一位优秀的首席报告官。
你的任务是：
1. 阅读多个专家智能体对同一用户问题的贡献。
2. 将这些片段整合成一个连贯、专业且易于阅读的最终回复。
3. 确保信息准确，消除冗余。
4. 保持友好的语气。`),
      new HumanMessage(`用户原始问题：\n${state.message[state.message.length - 1]?.text}\n\n专家们的贡献如下：\n${outputs}`),
    ]);

    return {
      result: res.content as string
    };
  } catch (error) {
    console.error("[Synthesizer] Error:", error);
    return {
      result: `抱歉，在汇总各专家意见时出现了问题：${error instanceof Error ? error.message : String(error)}。不过您仍然可以看到各专家的初步执行结果。`
    };
  }
};
