"use client";

import { useSyncExternalStore } from "react";

/**
 * 订阅 CSS 媒体查询，服务端渲染时返回 false
 * @param {string} query 例如 "(max-width: 767px)"
 */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** 与 Tailwind 的 md 断点（768px）对齐：小于 md 视为手机端 */
export const MOBILE_QUERY = "(max-width: 767px)";
