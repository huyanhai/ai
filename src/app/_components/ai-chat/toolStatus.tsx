import { useMemo, useState } from "react";

import { Search } from "lucide-react";
import { Avatar, Popover, Typography } from "antd";
import type { IStep } from "./bubble";

const { Link } = Typography;
interface ISource {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

const ToolStatus = ({ steps }: { steps: IStep[] }) => {
  const info = useMemo(() => {
    const sources: ISource[] = [];
    const details: string[] = [];

    steps.forEach((s) => {
      if (
        s.status === "running" &&
        s.content &&
        !s.content.includes("调用工具")
      ) {
        details.push(s.content);
      }

      if (s.status === "completed" && s.content) {
        try {
          const data = JSON.parse(s.content);
          const items = Array.isArray(data) ? data : data.results || [];
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              if (item.url && item.title) {
                try {
                  const domain = new URL(item.url).hostname;
                  sources.push({
                    title: item.title,
                    url: item.url,
                    snippet: item.snippet || "",
                    domain,
                  });
                } catch {}
              }
            });
          }
        } catch (e) {
          // Regex fallback if needed (only for basic link detection)
          const urlRegex = /(https?:\/\/[^\s"']+)/g;
          const matches = s.content.match(urlRegex);
          if (matches) {
            matches.forEach((url) => {
              try {
                sources.push({
                  title: new URL(url).hostname,
                  url,
                  snippet: "",
                  domain: new URL(url).hostname,
                });
              } catch {}
            });
          }
        }
      }
    });

    // Deduplicate by URL
    const uniqueSources = Array.from(
      new Map(sources.map((s) => [s.url, s])).values(),
    );

    return {
      sources: uniqueSources,
      details: Array.from(new Set(details)),
    };
  }, [steps]);

  const allCompleted = steps.every((s) => s.status === "completed");

  const renderTooltip = (source: ISource, index: number) => (
    <div className="flex max-w-72 flex-col gap-2">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 p-2">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <img
            src={`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${source.url}&size=32`}
            alt={source.domain}
            className="h-4 w-4 shrink-0 rounded-sm"
          />
          <span className="truncate text-[10px] font-medium text-black/60">
            {source.domain}
          </span>
        </div>
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] text-black/80">
          {index + 1}
        </span>
      </div>
      <div className="flex flex-col gap-1 px-2 pb-2">
        <h4 className="line-clamp-2 text-xs leading-relaxed font-bold text-[#191E26]">
          {source.title}
        </h4>
        {source.snippet && (
          <p className="line-clamp-3 text-[11px] leading-relaxed text-[#86909C]">
            {source.snippet}
          </p>
        )}
      </div>
    </div>
  );

  const content = (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-1">
        <span className="text-sm text-[#86909C]">
          {allCompleted
            ? info.sources.length > 0
              ? `已阅读 ${info.sources.length} 个来源`
              : "已完成搜索"
            : info.details[info.details.length - 1] || "正在联网搜索..."}
        </span>
        <Avatar.Group size={18}>
          {info.sources.slice(0, 3).map((source, i) => (
            <Avatar
              key={i}
              src={`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${source.url}&size=16`}
              alt={source.domain}
            />
          ))}
        </Avatar.Group>
      </div>
    </div>
  );

  const popperContent = useMemo(() => {
    if (allCompleted && info.sources.length > 0) {
      return (
        <Popover
          align={{
            offset: [-10, -5],
          }}
          classNames={{
            container: "!px-0 !py-3",
          }}
          placement="leftTop"
          content={
            <div className="flex max-h-96 flex-col gap-3 overflow-y-auto px-3">
              {info.sources.map((source, i) => (
                <div
                  className="block flex-none overflow-hidden rounded-sm bg-gray-50"
                  key={i}
                >
                  <a href={source.url} target="_blank">
                    {renderTooltip(source, i)}
                  </a>
                </div>
              ))}
            </div>
          }
          trigger="hover"
        >
          {content}
        </Popover>
      );
    }
    return content;
  }, [allCompleted]);

  return popperContent;
};

export default ToolStatus;
