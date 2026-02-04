export interface INodeData {
  input: Record<string, unknown>;
  output?: {
    result: string;
  };
}

export type INodeType =
  | "step_start"
  | "step_end"
  | "token"
  | "tool_start"
  | "tool_end"
  | "interrupt";

export interface INode {
  type: INodeType;
  name: string;
  content?: string;
  data?: INodeData;
}

export interface IImageNodeData {
  mimeType: string;
  data: string;
}
