import { useMemo, useState } from "react";

import { Search } from "lucide-react";
import { Avatar, Popover, Typography } from "antd";
import type { IStep } from "./bubble";

const { Link } = Typography;

const TaskItem = ({ step }: { step: IStep }) => {
  const content = useMemo(() => {
    const rawContent = step?.content || "";
    // 正则匹配最外层的方括号内容，通常这是工具返回的 JSON 数组（如搜索结果）
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);

    let text = rawContent;
    let json: any[] = [];

    if (jsonMatch) {
      const jsonStr = jsonMatch[0];
      // 提取非 JSON 部分作为纯文本描述
      text = rawContent.replace(jsonStr, "").trim();
      try {
        const parsed = JSON.parse(jsonStr);
        json = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        console.log("[TaskItem] JSON parse error, treating as plain text");
      }
    }

    return { text, json };
  }, [step?.content]);
  return (
    <div className="flex max-w-72 flex-col gap-2">
      {content.text && (
        <div className="mb-2 text-sm text-gray-600">{content.text}</div>
      )}
      {content.json?.map((item: any, index: number) => {
        const url = item.link || item.url;
        return (
          <div
            key={index}
            className="mb-2 overflow-hidden rounded-md border border-gray-100 bg-gray-50/50"
          >
            <div className="flex items-center justify-between gap-2 border-b border-black/5 bg-gray-100/30 p-2">
              <div className="flex items-center gap-1.5 overflow-hidden">
                {url && (
                  <img
                    src={`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=32`}
                    alt={item.title}
                    className="h-3.5 w-3.5 shrink-0 rounded-sm"
                  />
                )}
                <span className="truncate text-[10px] font-medium text-black/40">
                  {url ? new URL(url).hostname : "来源"}
                </span>
              </div>
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[9px] text-black/60">
                {index + 1}
              </span>
            </div>
            <div className="flex flex-col gap-1 p-2">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="line-clamp-2 text-xs font-semibold text-[#191E26] transition-colors hover:text-blue-600"
              >
                {item.title}
              </a>
              {(item.content || item.snippet) && (
                <p className="line-clamp-3 text-[11px] leading-relaxed text-[#86909C]">
                  {item.content || item.snippet}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskItem;
