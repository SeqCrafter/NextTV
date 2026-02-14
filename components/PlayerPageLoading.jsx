"use client";

import { useState, useEffect } from "react";

// 打字机消息列表（组件外部定义，避免重复创建）
const TYPEWRITER_MESSAGES = ["请等等等。。。。。。。。。。。。。。。。。。。。"];

// ============================================================================
// 加载状态组件 - 带打字机效果
// ============================================================================
export function LoadingSpinner() {
  const [textIndex, setTextIndex] = useState(0); // 当前显示哪段文字
  const [displayedText, setDisplayedText] = useState(""); // 当前已显示的文字
  const [isDeleting, setIsDeleting] = useState(false); // 是否在删除文字

  useEffect(() => {
    const currentMessage = TYPEWRITER_MESSAGES[textIndex];

    const timer = setTimeout(
      () => {
        if (!isDeleting) {
          // 打字阶段：逐字添加
          if (displayedText.length < currentMessage.length) {
            setDisplayedText(currentMessage.slice(0, displayedText.length + 1));
          } else {
            // 打完了，等待一会后开始删除
            setTimeout(() => setIsDeleting(true), 2000);
          }
        } else {
          // 删除阶段：逐字删除
          if (displayedText.length > 0) {
            setDisplayedText(displayedText.slice(0, -1));
          } else {
            // 删完了，切换到下一段文字
            setIsDeleting(false);
            setTextIndex((prev) => (prev + 1) % TYPEWRITER_MESSAGES.length);
          }
        }
      },
      isDeleting ? 50 : 100
    ); // 删除速度更快

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, textIndex]);

  return (
    <div className="w-full max-w-7xl pt-4 flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-6">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
        <div className="text-gray-600 text-lg font-medium min-h-[28px] flex items-center">
          <span>{displayedText}</span>
          <span className="inline-block w-0.5 h-5 bg-primary ml-1 animate-pulse"></span>
        </div>
      </div>
    </div>
  );
}
