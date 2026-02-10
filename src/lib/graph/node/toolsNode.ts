import { ToolNode } from "@langchain/langgraph/prebuilt";
import { getTools } from "@/lib/mcp";

export const toolNode = new ToolNode(await getTools());
