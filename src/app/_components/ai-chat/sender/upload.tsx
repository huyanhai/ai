import React, { useMemo, useRef, useState } from "react";
import { useNode } from "./hooks/useNode";
import { Popover, Space } from "antd";
import UserButton from "../../button";
import { Paperclip, Image, FileText, Film, FileMusic } from "lucide-react";
import { StatusType } from "../nodes/attachment-node";

const Upload = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [accept, setAccept] = useState<string>("image/*");

  const { insertAttachment, updateAttachment } = useNode();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. 创建本地预览 URL
    const localUrl = URL.createObjectURL(file);
    let nodeKey: string | null = null;

    try {
      // 2. 立即在编辑器中插入预览节点
      nodeKey = insertAttachment(file.name, localUrl, StatusType.uploading, 0);
      // 生成文件hash
      const arrayBuffer = await file.arrayBuffer();
      const hash = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hash));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("hash", hashHex);

      // 3. 使用 XMLHttpRequest 以便追踪进度
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && nodeKey) {
            const percent = Math.round((event.loaded / event.total) * 100);
            updateAttachment(nodeKey, { progress: percent });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const { data } = JSON.parse(xhr.responseText);
            if (nodeKey) {
              updateAttachment(nodeKey, {
                url: data.url,
                hash: hashHex,
                status: StatusType.success,
              });
            }
            resolve(data);
          } else {
            reject(new Error("上传失败"));
          }
        };

        xhr.onerror = () => reject(new Error("网络错误"));
        xhr.send(formData);
      });
    } catch (error) {
      console.error("Upload failed:", error);
      if (nodeKey) {
        updateAttachment(nodeKey, { status: StatusType.error });
      }
    } finally {
      e.target.value = "";
      // 注意：不要立即 URL.revokeObjectURL(localUrl)，因为编辑器可能还在显示它
      // 可以在上传成功并替换 URL 后再释放
    }
  };

  const uploadHandler = (accept: string) => {
    setAccept(accept);
    setTimeout(() => {
      fileInputRef.current?.click();
    });
  };

  const attachmentList = [
    {
      icon: <Image strokeWidth={2} size={14} />,
      label: "图片",
      accept: "image/*",
    },
    // {
    //   icon: <FileMusic strokeWidth={2} size={14} />,
    //   label: "音频",
    //   accept: "audio/*",
    // },
    // {
    //   icon: <Film strokeWidth={2} size={14} />,
    //   label: "视频",
    //   accept: "video/*",
    // },
    {
      icon: <FileText strokeWidth={2} size={14} />,
      label: "文档",
      accept: "application/pdf,text/plain,application/x-markdown,.md,.markdown",
    },
  ];

  return (
    <Popover
      content={
        <div>
          <Space vertical className="text-[12px]">
            {attachmentList.map((item) => (
              <Space
                key={item.label}
                onClick={() => uploadHandler(item.accept)}
                className="cursor-pointer rounded-sm bg-gray-50 px-2 py-1 text-[#191E26] hover:bg-[#191E26] hover:text-white"
              >
                {item.icon}
                {item.label}
              </Space>
            ))}
          </Space>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept={accept}
          />
        </div>
      }
      trigger="click"
    >
      <div>
        <UserButton>
          <Paperclip strokeWidth={2} size={14} />
        </UserButton>
      </div>
    </Popover>
  );
};

export default Upload;
