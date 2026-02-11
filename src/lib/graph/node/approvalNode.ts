import { qianWenModel } from "@/lib/llm";
import type { TState } from "..";
import { Command, interrupt } from "@langchain/langgraph";
import { getTools } from "@/lib/mcp";

/**
 * 审批节点
 */
export const approvalNode = async (state: TState) => {
  console.log("state", state);
  // userInput获取用户的输入
  const userInput = interrupt("等待前台输入数据以继续...");
  qianWenModel.bindTools(await getTools());
  const res = await qianWenModel.invoke(userInput);

  return new Command({
    update: { result: res.content },
    goto: "textNode",
  });
};
