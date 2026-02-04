import React, { useMemo } from "react";
import Image from "next/image";
import { StatusType } from "../nodes/attachment-node";
import { motion } from "motion/react";
import { FileText } from "lucide-react";
import { getFileExtension } from "@/utils/file";

interface IProps {
  fileName: string;
  url: string;
  isSelected?: boolean;
  status?: StatusType;
  progress?: number;
}

const FileRender = ({
  fileName,
  url,
  isSelected,
  status = StatusType.success,
}: IProps) => {
  const containerRef = React.useRef<HTMLSpanElement>(null);
  const [placement, setPlacement] = React.useState<"top" | "bottom">("top");

  // 获取文件后缀
  const file = useMemo(() => {
    const ext = getFileExtension(fileName);

    // 图片类型
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
      return {
        com: (
          <Image
            alt={fileName}
            src={url}
            className={`h-4 w-4 rounded object-cover transition-opacity ${status === StatusType.uploading ? "opacity-30" : "opacity-100"}`}
            width={16}
            height={16}
          />
        ),
        isImage: true,
      };
    } else {
      return {
        com: <FileText size={14} />,
        isImage: false,
      };
    }
  }, [status, fileName]);

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      // 预估图片预览高度约为 240px (w-60 左右配合比例)
      // 如果上方空间小于 240px，且下方空间更大，则显示在下方
      if (spaceAbove < 240) {
        setPlacement("bottom");
      } else {
        setPlacement("top");
      }
    }
  };

  return (
    <motion.span
      ref={containerRef}
      contentEditable={false}
      data-attachment
      initial="initial"
      whileHover="hover"
      onMouseEnter={handleMouseEnter}
      className={`group relative flex h-7 max-w-40 cursor-pointer items-center gap-2 rounded border px-2 transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
          : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
      }`}
    >
      <div className="relative flex-none">
        {file.com}
        {status === StatusType.uploading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
      </div>

      <div className="overflow-hidden text-[12px] text-ellipsis whitespace-nowrap">
        {fileName}
      </div>

      {status === StatusType.success && file.isImage && (
        <motion.div
          variants={{
            initial: {
              opacity: 0,
              y: placement === "top" ? 10 : -10,
              scale: 0.9,
              pointerEvents: "none",
            },
            hover: { opacity: 1, y: 0, scale: 1, pointerEvents: "auto" },
          }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`absolute left-0 z-50 w-full overflow-hidden rounded-xl shadow-2xl ${
            placement === "top"
              ? "bottom-10 origin-bottom-left"
              : "top-10 origin-top-left"
          }`}
        >
          <div className="relative aspect-auto w-full">
            <Image
              alt={fileName}
              src={url}
              width={0}
              height={0}
              sizes="100vw"
              className="h-auto w-full rounded-lg object-contain"
            />
          </div>
        </motion.div>
      )}
    </motion.span>
  );
};

export default FileRender;
