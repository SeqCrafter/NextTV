"use client";

import { useCallback } from "react";
import dynamic from "next/dynamic";
import { AnimatedDialog } from "@/components/AnimatedDialog";

const DanmakuSearch = dynamic(() => import("@/components/DanmakuSearch").then((module) => module.DanmakuSearch), {
  ssr: false,
  loading: () => <div role="status" className="surface-panel p-8 text-center text-sm text-muted">正在加载弹幕搜索…</div>,
});

const NOOP = () => {};

export function DanmakuSearchModal({ isOpen, onClose, initialTitle, onEpisodeConfirm }) {
  const handleEpisodeSelect = useCallback((episodeId) => {
    onEpisodeConfirm?.(episodeId);
    onClose();
  }, [onEpisodeConfirm, onClose]);

  return (
    <AnimatedDialog
      isOpen={isOpen}
      onClose={onClose}
      label="手动搜索弹幕"
      initialFocusSelector="input"
      overlayClassName="danmaku-modal-overlay"
      className="danmaku-modal-content outline-none"
    >
      <button type="button" className="danmaku-modal-close" onClick={onClose} aria-label="关闭弹幕搜索">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <div className="danmaku-modal-body">
        <DanmakuSearch initialTitle={initialTitle || ""} onEpisodeSelect={handleEpisodeSelect} onAnimeSelect={NOOP} />
      </div>
    </AnimatedDialog>
  );
}
