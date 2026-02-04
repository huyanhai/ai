import {
  DecoratorNode,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
} from "lexical";
import * as React from "react";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import FileRender from "../sender/file-render";

export enum NodeType {
  attachment = "attachment",
}

export enum StatusType {
  uploading = "uploading",
  success = "success",
  error = "error",
}

export interface SerializedAttachmentNode extends SerializedLexicalNode {
  fileName: string;
  url: string;
  status?: StatusType;
  progress?: number;
}

export interface IAttachmentNode {
  nodeKey: NodeKey;
  fileName: string;
  url: string;
  status: StatusType;
  progress: number;
}

function AttachmentComponent({
  nodeKey,
  fileName,
  url,
  status,
  progress,
}: IAttachmentNode) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);

  return (
    <FileRender
      fileName={fileName}
      url={url}
      isSelected={isSelected}
      status={status}
      progress={progress}
    />
  );
}

export class AttachmentNode extends DecoratorNode<React.ReactNode> {
  __fileName: string;
  __url: string;
  __hash: string;
  __status: StatusType;
  __progress: number;

  static getType(): string {
    return NodeType.attachment;
  }

  static clone(node: AttachmentNode): AttachmentNode {
    return new AttachmentNode(
      node.__fileName,
      node.__url,
      node.__hash,
      node.__status,
      node.__progress,
      node.__key,
    );
  }

  constructor(
    fileName: string,
    url: string,
    hash: string,
    status?: StatusType,
    progress?: number,
    key?: NodeKey,
  ) {
    super(key);
    this.__fileName = fileName;
    this.__url = url;
    this.__hash = hash;
    this.__status = status ?? StatusType.success;
    this.__progress = progress ?? 0;
  }

  static importJSON(serializedNode: SerializedAttachmentNode): AttachmentNode {
    const node = $createAttachmentNode(
      serializedNode.fileName,
      serializedNode.url,
      serializedNode.status,
      serializedNode.progress,
    );
    return node;
  }

  exportJSON(): SerializedAttachmentNode {
    return {
      type: NodeType.attachment,
      fileName: this.__fileName,
      url: this.__url,
      hash: this.__hash,
      status: this.__status,
      progress: this.__progress,
      version: 1,
    };
  }

  createDOM(): HTMLElement {
    const div = document.createElement("span");
    div.style.display = "inline-flex";
    div.style.verticalAlign = "middle";
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  setURL(url: string): void {
    const writable = this.getWritable();
    writable.__url = url;
  }

  setHash(hash: string): void {
    const writable = this.getWritable();
    writable.__hash = hash;
  }

  setStatus(status: StatusType): void {
    const writable = this.getWritable();
    writable.__status = status;
  }

  setProgress(progress: number): void {
    const writable = this.getWritable();
    writable.__progress = progress;
  }

  decorate(): React.ReactNode {
    return (
      <AttachmentComponent
        nodeKey={this.getKey()}
        fileName={this.__fileName}
        url={this.__url}
        status={this.__status}
        progress={this.__progress}
      />
    );
  }
}

export function $createAttachmentNode(
  fileName: string,
  url: string,
  status?: StatusType,
  progress?: number,
): AttachmentNode {
  return new AttachmentNode(fileName, url, status, progress);
}

export function $isAttachmentNode(
  node: LexicalNode | null | undefined,
): node is AttachmentNode {
  return node instanceof AttachmentNode;
}
