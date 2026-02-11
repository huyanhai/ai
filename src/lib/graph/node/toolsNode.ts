import { ToolNode } from "@langchain/langgraph/prebuilt";
import { getTools } from "@/lib/mcp";

/**
 * 工具节点
 */
export const toolNode = new ToolNode(await getTools());
