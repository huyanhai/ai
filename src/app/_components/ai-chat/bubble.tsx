import React from "react";
import Image from "next/image";
import { Avatar, Timeline, Typography, Collapse } from "antd";
import { ChevronDown, ChevronRight } from "lucide-react";
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
        // 排除结构化节点和 Worker 节点，剩下的通常是具体的工具调用
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
          // 确保不显示 classifierNode
          step.name !== "classifierNode" &&
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
                            classNames={{
                              header: "!p-2",
                            }}
                            accordion={true}
                            expandIcon={(panelProps) => (
                              <ChevronRight
                                size={16}
                                className={
                                  panelProps.isActive ? "rotate-90" : "rotate-0"
                                }
                              />
                            )}
                            items={workerSteps.map((item, index) => {
                              return {
                                key: item.id,
                                label: `${item.name.replace("Worker:", "")} (${index + 1}/${workerSteps.length})`,
                                children: <Markdown content={item.content} />,
                              };
                            })}
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
