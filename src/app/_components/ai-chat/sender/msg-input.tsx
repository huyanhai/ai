"use client";
import React, { useEffect } from "react";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  type LexicalNode,
  type RootNode,
  ElementNode,
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_LOW,
} from "lexical";
import { $isAttachmentNode } from "../nodes/attachment-node";

export interface IChatContent {
  type: "text" | "attachment";
  text?: string;
  fileName?: string;
  url?: string;
  hash?: string;
  status?: "uploading" | "success" | "error";
}

interface IProps {
  onChange?: (val: IChatContent[]) => void;
  onSend?: () => void;
}

// Helper to generate a clean JSON structure of user content
function generateChatData(root: RootNode): IChatContent[] {
  const data: IChatContent[] = [];
  const children = root.getChildren();

  children.forEach((node: LexicalNode) => {
    if (node instanceof ElementNode && node.getType() === "paragraph") {
      node.getChildren().forEach((child: LexicalNode) => {
        if ($isAttachmentNode(child)) {
          data.push({
            type: "attachment",
            fileName: child.__fileName,
            hash: child.__hash,
            url: child.__url,
            status: child.__status,
          });
        } else {
          const text = child.getTextContent();
          if (text) {
            data.push({
              type: "text",
              text: text,
            });
          }
        }
      });
    }
  });

  return data;
}

const MsgInput = ({ onChange, onSend }: IProps) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const content = generateChatData(root);
        onChange?.(content);
      });
    });
  }, [editor, onChange]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        if (event?.shiftKey) {
          return false;
        }
        if (onSend) {
          event?.preventDefault();
          onSend();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, onSend]);

  return (
    <div className="relative w-full text-sm leading-[1.8] text-[#2F3640]">
      <RichTextPlugin
        contentEditable={
          <ContentEditable className="relative z-1 max-h-60 min-h-12 w-full cursor-text px-1 focus:outline-none" />
        }
        placeholder={
          <div className="pointer-events-none absolute top-0 left-1.5 flex items-center overflow-hidden align-baseline text-[#86909C] select-none">
            <span className="line-clamp-1 text-ellipsis whitespace-pre-wrap">
              请输入你的设计需求
            </span>
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <AutoFocusPlugin />
    </div>
  );
};

MsgInput.displayName = "MsgInput";

export default MsgInput;
