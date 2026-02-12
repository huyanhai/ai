import { HumanMessage, SystemMessage } from "langchain";
import z from "zod";
import { googleModel } from "../../llm";
import type { TState } from "..";

export const smartHomeNode = async (state: TState) => {
  const modelWithOutput = googleModel.withStructuredOutput(
    z.object({
      actions: z.object({
        lightIntensity: z.number().optional().describe("0 to 1"),
        lightColor: z.string().optional().describe("CSS color string, e.g., '#ff0000'"),
        isDoorOpen: z.boolean().optional(),
        temperature: z.number().optional().describe("Celsius"),
      }),
      response: z.string().describe("A conversational response to the user"),
    }),
  );

  const messages = state.message
    .map((m) => {
      if (m.type === "text") return m.text;
      return `[${m.type}]`;
    })
    .filter(Boolean)
    .join("\n");

  const res = await modelWithOutput.invoke([
    new SystemMessage(`# 3D 智能家居控制助手
你是一个智能家居管家，负责控制 3D 虚拟场景中的设备。
你可以控制：
- 灯光亮度 (lightIntensity): 0 到 1 之间的数字
- 灯光颜色 (lightColor): CSS 颜色字符串（建议使用十六进制）
- 门的状态 (isDoorOpen): 布尔值
- 室内温度 (temperature): 摄氏度数字

请根据用户的输入，决定需要调整哪些状态。如果用户没有提到某个设备，则不要返回该字段。
同时，给用户一个简短、友好的回应。`),
    new HumanMessage(messages),
  ]);

  return {
    result: res.response,
    // 我们将 actions 传递给前端，前端识别到该节点的输出后更新 Zustand
    smart_home_actions: res.actions,
  };
};
