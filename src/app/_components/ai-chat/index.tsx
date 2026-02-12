"use client";
import { api, type RouterInputs } from "@/trpc/react";
import type { INode } from "@/types/node";
import React, { useState, useRef, useEffect, useMemo } from "react";
import Sender, { type ISubmit } from "./sender";
import Bubble, { type IMessage } from "./bubble";
import { getFileExtension } from "@/utils/file";
import { MessageCirclePlus } from "lucide-react";
import { Tooltip } from "antd";
import { ImageExts } from "@/constants/file";
import { useSmartHomeStore } from "@/store/smart-home";

function generateThreadId() {
  return Math.random().toString(36).substring(7);
}

const AiChat = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const { mutateAsync, isPending } = api.ai.flow.useMutation();
  const [threadId, setThreadId] = useState(() => generateThreadId());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const newChat = () => {
    setThreadId(generateThreadId());
    setMessages([]);
  };

  const title = useMemo(() => {
    return (
      messages?.[0]?.content?.filter((item) => item.type === "text")?.[0]
        ?.text ?? "AI Chat"
    );
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理流式数据
  const processStream = async (aiMsgId: string, response: any) => {
    for await (const chunk of response) {
      const event = chunk as INode;
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== aiMsgId) return msg;

          const currentSteps = msg.steps ? [...msg.steps] : [];

          if (event.type === "token") {
            const lastStepIndex = currentSteps.length - 1;
            if (lastStepIndex >= 0) {
              const lastStep = { ...currentSteps[lastStepIndex]! };
              if (lastStep.status === "running") {
                lastStep.content += event.content ?? "";
                currentSteps[lastStepIndex] = lastStep;
                return { ...msg, steps: currentSteps };
              }
            }
          } else if (
            event.type === "step_start" ||
            event.type === "tool_start"
          ) {
            return {
              ...msg,
              steps: [
                ...currentSteps,
                {
                  id: Math.random().toString(36).substring(7),
                  name: event.name,
                  content: event.content ?? "",
                  status: "running",
                },
              ],
            };
          } else if (event.type === "step_end" || event.type === "tool_end") {
            for (let i = currentSteps.length - 1; i >= 0; i--) {
              if (
                currentSteps[i]?.name === event.name &&
                currentSteps[i]?.status === "running"
              ) {
                const updatedStep = {
                  ...currentSteps[i]!,
                  status: "completed",
                };

                if (event.type === "tool_end") {
                  updatedStep.content = event.content ?? "";
                } else {
                  const output = event.data?.output ?? event.data;
                  if (output && typeof output === "object") {
                    const result = (output as any)?.result;
                    updatedStep.content =
                      typeof result === "string"
                        ? result
                        : JSON.stringify(output);

                    // 如果是智能家居节点，更新 3D 场景状态
                    if (event.name === "smartHomeNode") {
                      const actions = (output as any)?.smart_home_actions;
                      if (actions) {
                        useSmartHomeStore.getState().updateStates(actions);
                      }
                    }
                  } else if (typeof output === "string") {
                    updatedStep.content = output;
                  }
                }
                currentSteps[i] = updatedStep;
                return { ...msg, steps: currentSteps };
              }
            }
          }
          return msg;
        }),
      );
    }
  };

  const handleSubmit = async (
    { content, config }: ISubmit,
    cb?: () => void,
  ) => {
    if (content.length === 0) return;

    const userMsgId = Math.random().toString(36).substring(7);
    const aiMsgId = Math.random().toString(36).substring(7);

    cb?.();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content },
      { id: aiMsgId, role: "ai", steps: [] },
    ]);

    try {
      const message = await Promise.all(
        content
          .filter((item) => {
            return !(item.type !== "attachment" && !item.text?.trim());
          })
          .map(async (item) => {
            const ext = getFileExtension(item.fileName ?? "");
            if (item.type === "attachment" && ext) {
              const type = ImageExts.includes(ext) ? "image" : "file";
              return {
                hash: item.hash,
                type,
                url: item.url,
                source_type: "url",
              };
            }
            return {
              type: "text",
              text: item.text,
            };
          }),
      );

      const response = await mutateAsync({
        message: message as RouterInputs["ai"]["flow"]["message"],
        config,
        threadId,
      });

      await processStream(aiMsgId, response);
    } catch (error) {
      console.error("Error streaming data:", error);
    }
  };

  const handleResume = async (aiMsgId: string, val: string) => {
    try {
      const response = await mutateAsync({
        resumeValue: val,
        threadId,
      });

      await processStream(aiMsgId, response);
    } catch (error) {
      console.error("Error resuming:", error);
    }
  };

  return (
    <div className="mx-auto flex h-full w-full flex-col">
      <div className="m-2 flex items-center justify-between gap-6">
        <div className="flex-1 truncate text-[14px]">{title}</div>
        <Tooltip placement="top" title="新建对话">
          <div
            className="cursor-pointer rounded-full p-2 hover:bg-[#191E26] hover:text-white"
            onClick={newChat}
          >
            <MessageCirclePlus size={16} />
          </div>
        </Tooltip>
      </div>
      <div className="no-scrollbar mb-4 flex-1 space-y-6 overflow-y-auto px-2">
        {messages.map((msg) => (
          <Bubble
            key={msg.id}
            msg={msg}
            onResume={(val) => handleResume(msg.id, val)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <Sender submit={handleSubmit} disabled={isPending} />
    </div>
  );
};

export default AiChat;
