"use client";

import React, { useState } from "react";
import { Button, Input, Space } from "antd";
import { CheckCircle2, Send, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ApprovalProps {
  onApprove?: (value: string) => void;
  onReject?: () => void;
  isLoading?: boolean;
  title?: string;
  defaultValue?: string;
  isCompleted?: boolean;
}

const Approval = ({
  onApprove,
  onReject,
  isLoading = false,
  title = "准备好继续执行了吗？",
  defaultValue = "",
  isCompleted = false,
}: ApprovalProps) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 rounded-xl bg-emerald-50/50 p-4 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400">
          <CheckCircle2 size={18} />
        </div>
        <div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">已确认继续</p>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-400/50">该任务已通过审查并继续执行</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl shadow-blue-500/5 dark:border-blue-900/30 dark:bg-[#191E26] dark:shadow-none"
    >
      <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center gap-3 text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            <CheckCircle2 size={18} />
          </div>
          <h3 className="font-semibold">{title}</h3>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-blue-600 uppercase tracking-wider dark:text-blue-400">
            附带信息 / 指令 (可选)
          </label>
          <Input.TextArea
            rows={3}
            placeholder="请输入任何需要补充的信息..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="rounded-xl border-blue-50 bg-blue-50/30 focus:border-blue-400 focus:ring-blue-100 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-200"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="text"
            icon={<XCircle size={16} />}
            onClick={onReject}
            disabled={isLoading}
            className="flex items-center gap-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            取消
          </Button>
          <Button
            type="primary"
            size="large"
            loading={isLoading}
            onClick={() => onApprove?.(inputValue)}
            icon={<Send size={16} />}
            className="flex items-center gap-1 rounded-xl bg-blue-600 px-6 font-medium shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
          >
            确认继续
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default Approval;
