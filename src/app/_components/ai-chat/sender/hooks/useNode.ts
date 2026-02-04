"use client";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import {
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $insertNodes,
  type LexicalNode,
  type NodeKey,
} from "lexical";
import {
  $createAttachmentNode,
  $isAttachmentNode,
  type StatusType,
} from "../../nodes/attachment-node";

export const useNode = () => {
  const [editor] = useLexicalComposerContext();

  function clear() {
    editor.update(() => {
      const root = $getRoot();
      root.clear();
    });
  }
  function focus() {
    editor.focus();
  }

  function insertAttachment(
    fileName: string,
    url: string,
    status?: StatusType,
    progress?: number,
  ) {
    let nodeKey: NodeKey = "";
    editor.update(() => {
      const attachmentNode = $createAttachmentNode(
        fileName,
        url,
        status,
        progress,
      );
      nodeKey = attachmentNode.getKey();
      const spaceNode = $createTextNode(" ");

      $insertNodes([attachmentNode, spaceNode] as LexicalNode[]);
      // 在前面一个dom添加一个空格
      const prevNode = attachmentNode.getPreviousSibling();
      if (prevNode) {
        prevNode.insertAfter($createTextNode(" "));
      }

      spaceNode.select();
    });
    return nodeKey;
  }

  function updateAttachment(
    key: NodeKey,
    payload: {
      url?: string;
      hash?: string;
      status?: StatusType;
      progress?: number;
    },
  ) {
    editor.update(() => {
      const node = $getNodeByKey(key);
      if ($isAttachmentNode(node)) {
        if (payload.url !== undefined) node.setURL(payload.url);
        if (payload.hash !== undefined) node.setHash(payload.hash);
        if (payload.status !== undefined) node.setStatus(payload.status);
        if (payload.progress !== undefined) node.setProgress(payload.progress);
      }
    });
  }

  return {
    clear,
    focus,
    insertAttachment,
    updateAttachment,
  };
};
