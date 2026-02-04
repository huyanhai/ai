import React, { useState, useMemo } from "react";
import { ArrowUp } from "lucide-react";
import MsgInput, { type IChatContent } from "./msg-input";
import { useNode } from "./hooks/useNode";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { AttachmentNode } from "../nodes/attachment-node";
import Setting, { type IConfigProps } from "./setting";
import Upload from "./upload";

const initialConfig = {
  namespace: "AiChat",
  theme: {
    paragraph: "text-sm leading-[1.8] text-[#363636]",
    text: {
      base: "align-middle",
    },
  },
  onError: (error: Error) => {
    console.error(error);
  },
  nodes: [AttachmentNode],
};

export interface ISubmit {
  content: IChatContent[];
  config: IConfigProps["config"];
}

interface IProps {
  disabled?: boolean;
  submit: (val: ISubmit, cb?: () => void) => void;
}

const SenderInner = ({ submit, disabled }: IProps) => {
  const [content, setContent] = useState([] as IChatContent[]);
  const [config, setConfig] = useState<ISubmit["config"]>({
    aspect: "16:9",
  });

  const { clear } = useNode();

  const btnDisabled = useMemo(() => {
    return (
      content.length < 1 ||
      content
        .filter((item) => item.text !== "\n" && item.text?.trim())
        .some((item) => item.status === "uploading") ||
      disabled
    );
  }, [content, disabled]);

  async function send() {
    if (btnDisabled) return;
    submit(
      {
        content,
        config,
      },
      () => {
        clear();
        setContent([]);
      },
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-solid border-[#e7e7e7] bg-white p-2">
      <MsgInput onChange={(val) => setContent(val)} onSend={() => send()} />
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Upload />
        </div>
        <div className="flex items-center gap-2">
          <Setting config={config} changeConfig={setConfig} />
          <button
            className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[#2F3640] enabled:cursor-pointer enabled:hover:bg-[#4A535F] enabled:active:bg-[#191E26] disabled:cursor-not-allowed disabled:opacity-30"
            data-testid="agent-send-button"
            disabled={btnDisabled}
            onClick={() => send()}
          >
            <ArrowUp className="text-white" strokeWidth={2} size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const Sender = (props: IProps) => {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <SenderInner {...props} />
    </LexicalComposer>
  );
};

export default Sender;
