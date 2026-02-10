import { ZHIPU_API_KEY } from "@/constants/env";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

export let mcpTools: Awaited<
  ReturnType<MultiServerMCPClient["getTools"]>
> | null = null;

export const mcpClient = new MultiServerMCPClient({
  // "bing-search": {
  //   command: "npx",
  //   args: ["bing-cn-mcp"],
  // },
  "zhipu-web-search-sse": {
    transport: "http",
    url: `https://open.bigmodel.cn/api/mcp/web_search/sse?Authorization=${ZHIPU_API_KEY}`,
  },
});

export const getTools = async () => {
  if (!mcpTools) {
    mcpTools = await mcpClient.getTools();
  }
  return mcpTools;
};

export const getToolByName = (name: string) => {
  return mcpTools?.find((tool) => tool.name === name);
};
