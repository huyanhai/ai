import { HumanMessage, SystemMessage } from "langchain";
import { qianWenModel } from "../../llm";
import type { TState } from "..";

/**
 * Synthesizer 智能体
 * 负责汇总所有专家智能体的输出，并整理成最终回复给用户
 */
export const synthesizerNode = async (state: TState) => {
  try {
    console.log("state", state);
    const outputs = Object.entries(state.agent_outputs)
      .map(([id, content]) => `### 专家 [${id}] 的贡献：\n${content}`)
      .join("\n\n---\n\n");

    const res = await qianWenModel.invoke([
      new SystemMessage(`你是一个专业的任务结果整合专家。
你的任务是：
1. 深入分析多个智能体提供的子任务执行结果。
2. 将所有有价值的信息整合成一个逻辑严密、结构清晰、专业且易于阅读的最终回复。
3. 必须消除冗余，确保回复内容直接针对用户的原始问题。
4. **直接输出整合后的内容，不要包含任何开场白或解释性文字。**`),
      new HumanMessage(
        `用户原始问题：\n${state.message[state.message.length - 1]?.text}\n\n智能体执行结果如下：\n${outputs}`,
      ),
    ]);

    return {
      result: res.content as string,
    };
  } catch (error) {
    console.error("[Synthesizer] Error:", error);
    return {
      result: `抱歉，在汇总各专家意见时出现了问题：${error instanceof Error ? error.message : String(error)}。不过您仍然可以看到各专家的初步执行结果。`,
    };
  }
};
