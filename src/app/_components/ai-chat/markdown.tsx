"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";

interface MarkdownProps {
  content: string;
  className?: string;
}

const CodeBlock = ({ language, value }: { language: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-4 overflow-hidden rounded-xl border border-gray-200 bg-[#282c34] shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between border-b border-gray-700 bg-[#21252b] px-4 py-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {language ? language : "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "1.25rem",
            fontSize: "0.875rem",
            lineHeight: "1.5",
            backgroundColor: "transparent",
          }}
          codeTagProps={{
            style: {
              fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)",
            },
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const Markdown = ({ content, className = "" }: MarkdownProps) => {
  return (
    <div className={`markdown-body ${className} max-w-none`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed text-gray-700">{children}</p>,
          code: ({ className, children, ...props }: React.ComponentPropsWithoutRef<"code">) => {
            const match = /language-(\w+)/.exec(className ?? "");
            const childrenString = Array.isArray(children)
              ? children.join("")
              : typeof children === "string"
              ? children
              : "";
            const isInline = !match && !childrenString.includes("\n");

            if (isInline) {
              return (
                <code
                  className="mx-1 rounded bg-gray-100 px-1.5 py-0.5 text-[0.9em] font-medium text-pink-600 dark:bg-gray-800 dark:text-pink-400"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock
                language={match ? match[1] as string : ""}
                value={childrenString.replace(/\n$/, "")}
              />
            );
          },
          ul: ({ children }) => <ul className="mb-4 ml-6 list-disc space-y-2 text-gray-700">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal space-y-2 text-gray-700">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          h1: ({ children }) => <h1 className="mb-6 mt-8 text-2xl font-bold text-gray-900">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-4 mt-6 text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-3 mt-4 text-lg font-bold text-gray-900">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="my-6 border-l-4 border-primary/30 bg-primary/5 px-6 py-4 italic text-gray-600 rounded-r-lg">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full border-collapse text-sm text-left">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-50/50 text-gray-900">{children}</thead>,
          th: ({ children }) => <th className="border-b border-gray-200 px-4 py-3 font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-b border-gray-200 px-4 py-3 text-gray-700">{children}</td>,
          a: ({ children, href }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-blue-600 underline decoration-blue-500/30 underline-offset-4 transition-colors hover:text-blue-700 hover:decoration-blue-700"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="border-gray-200" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;

