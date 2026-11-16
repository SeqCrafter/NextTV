"use client";

import { useEffect, useCallback, useRef } from "react";
import { DanmakuSearch } from "@/components/DanmakuSearch";

const NOOP = () => {};

export function DanmakuSearchModal({ isOpen, onClose, initialTitle, onEpisodeConfirm }) {
  const dialogRef = useRef(null);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    (dialog?.querySelector("input") || dialog?.querySelector("button") || dialog)?.focus({ preventScroll: true });

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key !== "Tab" || !dialog) return;
      const controls = [...dialog.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]')].filter((element) => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(closeTimerRef.current);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus?.({ preventScroll: true });
    };
  }, [isOpen, onClose]);

  const handleEpisodeSelect = useCallback((episodeId) => {
    onEpisodeConfirm?.(episodeId);
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 200);
  }, [onEpisodeConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="danmaku-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="手动搜索弹幕" tabIndex={-1} className="danmaku-modal-content outline-none" onClick={(e) => e.stopPropagation()}>
        {/* 关闭按钮 */}
        <button
          type="button"
          className="danmaku-modal-close"
          onClick={onClose}
          aria-label="关闭弹幕搜索"
        >
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* DanmakuSearch 复用 */}
        <div className="danmaku-modal-body">
          <DanmakuSearch
            initialTitle={initialTitle || ""}
            onEpisodeSelect={handleEpisodeSelect}
            onAnimeSelect={NOOP}
          />
        </div>
      </div>
    </div>
  );
}
