import React from "react";
import Image from "next/image";
import { Avatar, Timeline, Typography, Collapse } from "antd";
import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";

import { type IChatContent } from "./sender/msg-input";
import FileRender from "./sender/file-render";
import Markdown from "./markdown";
import ToolStatus from "./toolStatus";
import Approval from "./sender/approval";

export interface IStep {
  id: string;
  name: string;
  content: string;
  status: string;
  type?: "text" | "attachment";
}

export interface IMessage {
  id: string;
  role: "user" | "ai";
  content?: IChatContent[];
  steps?: IStep[];
}

const Bubble = ({
  msg,
  onResume,
}: {
  msg: IMessage;
  onResume?: (val: string) => void;
}) => {
  console.log("msg", msg);
  const toolSteps = React.useMemo(() => {
    return (
      msg.steps?.filter((step) => {
        const structuralNodes = [
          "textNode",
          "imageNode",
          "fileNode",
          "classifierNode",
          "supervisorNode",
          "synthesizerNode",
        ];
        return (
          !structuralNodes.includes(step.name) &&
          !step.name.startsWith("Worker:")
        );
      }) ?? []
    );
  }, [msg.steps]);

  const approvalNode = React.useMemo(() => {
    return msg.steps?.find((s) => s.name === "approvalNode") ?? null;
  }, [msg.steps]);

  const workerSteps = React.useMemo(() => {
    return msg.steps?.filter((s) => s.name.startsWith("Worker:")) ?? [];
  }, [msg.steps]);

  const normalSteps = React.useMemo(() => {
    return (
      msg.steps?.filter(
        (step) =>
          !toolSteps.includes(step) &&
          !step.name.startsWith("Worker:") &&
          [
            "supervisorNode",
            "synthesizerNode",
            "textNode",
            "imageNode",
            "fileNode",
          ].includes(step.name),
      ) ?? []
    );
  }, [msg.steps, toolSteps]);

  return (
    <div
      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
    >
      {msg.role === "user" ? (
        <div className="flex flex-col items-end gap-2">
          <div className="font-inter inline-block cursor-default rounded-xl bg-[#F7F7F7] p-3 text-sm leading-6 font-medium wrap-break-word whitespace-pre-wrap text-[#363636] select-none">
            <div className="flex flex-wrap items-center gap-x-1">
              {msg.content?.map((item, idx) => {
                if (item.type === "text") {
                  return <span key={idx}>{item.text}</span>;
                } else if (item.type === "attachment") {
                  return (
                    <span key={idx} className="inline-flex py-0.5">
                      <FileRender
                        fileName={item.fileName ?? ""}
                        url={item.url ?? ""}
                      />
                    </span>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-[90%] space-y-4">
          {approvalNode && (
            <Approval
              onApprove={onResume}
              isCompleted={approvalNode.status === "completed"}
            />
          )}
          <Timeline
            items={[
              ...(toolSteps.length > 0
                ? [
                    {
                      color: toolSteps.every((s) => s.status === "completed")
                        ? "#191E26"
                        : "gray",
                      content: <ToolStatus steps={toolSteps} />,
                    },
                  ]
                : []),
              ...normalSteps
                .map((step) => {
                  const timelineItem = {
                    color: step.status === "running" ? "gray" : "#191E26",
                    loading: step.status === "running",
                    content: (
                      <div className="flex flex-col gap-1">
                        <div>
                          {step.content ? (
                            step.name === "imageNode" ? (
                              <motion.div
                                variants={{
                                  hover: { scale: 1.2 },
                                }}
                                className="relative aspect-auto w-full max-w-75 overflow-hidden rounded-lg"
                              >
                                {step.content && (
                                  <Image
                                    src={step.content}
                                    alt="Generated Image"
                                    width={0}
                                    height={0}
                                    sizes="100vw"
                                    unoptimized
                                    className="h-auto w-full object-contain"
                                  />
                                )}
                              </motion.div>
                            ) : (
                              <Markdown
                                content={step.content}
                                className="text-[#363636]"
                              />
                            )
                          ) : step.status === "running" ? (
                            <span className="animate-pulse text-sm text-gray-400 not-italic">
                              思考中...
                            </span>
                          ) : (
                            ""
                          )}
                        </div>
                      </div>
                    ),
                  };

                  // If this is the supervisorNode, we can append the worker group right after it if they exist
                  if (
                    step.name === "supervisorNode" &&
                    workerSteps.length > 0
                  ) {
                    return [
                      timelineItem,
                      {
                        color: workerSteps.every(
                          (s) => s.status === "completed",
                        )
                          ? "#191E26"
                          : "gray",
                        content: (
                          <Collapse
                            ghost
                            size="small"
                            className="subtask-collapse"
                            expandIcon={({ isActive }) => (
                              <ChevronDown
                                size={14}
                                className={`transition-transform ${isActive ? "rotate-180" : ""}`}
                              />
                            )}
                            items={[
                              {
                                key: "workers",
                                label: (
                                  <span className="text-xs font-medium text-gray-500">
                                    查看子任务执行细节 (
                                    {
                                      workerSteps.filter(
                                        (s) => s.status === "completed",
                                      ).length
                                    }
                                    /{workerSteps.length})
                                  </span>
                                ),
                                children: (
                                  <div className="space-y-4 pt-2">
                                    {workerSteps.map((ws) => (
                                      <div
                                        key={ws.id}
                                        className="border-l-2 border-gray-100 pl-4"
                                      >
                                        <div className="mb-1 flex items-center gap-2">
                                          <span className="text-xs font-bold text-[#191E26]">
                                            {ws.name.replace("Worker:", "")}
                                          </span>
                                          {ws.status === "running" && (
                                            <span className="animate-pulse text-[10px] text-gray-400">
                                              运行中...
                                            </span>
                                          )}
                                        </div>
                                        <Markdown
                                          content={
                                            ws.content ||
                                            (ws.status === "running"
                                              ? "正在处理..."
                                              : "")
                                          }
                                          className="text-xs text-gray-600"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ),
                              },
                            ]}
                          />
                        ),
                      },
                    ];
                  }

                  return timelineItem;
                })
                .flat(),
            ]}
          ></Timeline>
        </div>
      )}
    </div>
  );
};

export default Bubble;
