"use client";

import { useEffect, useRef, useState } from "react";
import { formatTimeShort } from "@/lib/util";
import {
  MaterialSymbolsHistoryRounded,
  MaterialSymbolsFavoriteOutlineRounded,
  MaterialSymbolsDeleteOutlineRounded,
  MaterialSymbolsCloseRounded,
  MaterialSymbolsPlayArrowRounded,
  MaterialSymbolsSearchRounded,
} from "@/components/icons";

const TABS = [
  { key: "history", label: "观看历史", Icon: MaterialSymbolsHistoryRounded },
  { key: "favorites", label: "我的收藏", Icon: MaterialSymbolsFavoriteOutlineRounded },
];

function formatRelativeTime(timestamp) {
  if (!timestamp) return "";
  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function Poster({ src, children }) {
  return (
    <div className="relative w-14 aspect-[2/3] shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-black/5">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
      ) : null}
      {children}
    </div>
  );
}

function EmptyState({ tab }) {
  const isHistory = tab === "history";
  const Icon = isHistory ? MaterialSymbolsHistoryRounded : MaterialSymbolsFavoriteOutlineRounded;
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary-dark">
        <Icon className="text-[28px]" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-gray-800">
        {isHistory ? "还没有观看记录" : "还没有收藏内容"}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">
        {isHistory ? "播放过的影片会出现在这里，方便继续观看" : "在播放页点击收藏按钮，就能在这里快速找到"}
      </p>
    </div>
  );
}

export function LibraryPanel({
  activeTab,
  onTabChange,
  onClose,
  playHistory,
  favorites,
  onHistoryClick,
  onDeleteHistory,
  onClearHistory,
  onFavoriteClick,
  onDeleteFavorite,
  onClearFavorites,
}) {
  // 记录处于“确认清空”状态的标签，切换标签后自然失效
  const [confirmingTab, setConfirmingTab] = useState(null);
  const confirmTimerRef = useRef(null);
  const listRef = useRef(null);

  const isHistory = activeTab === "history";
  const items = isHistory ? playHistory : favorites;
  const confirmingClear = confirmingTab === activeTab;

  // 切换标签时回到列表顶部
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [activeTab]);

  useEffect(() => () => clearTimeout(confirmTimerRef.current), []);

  const handleClear = () => {
    if (!confirmingClear) {
      setConfirmingTab(activeTab);
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => setConfirmingTab(null), 3000);
      return;
    }
    clearTimeout(confirmTimerRef.current);
    setConfirmingTab(null);
    if (isHistory) onClearHistory();
    else onClearFavorites();
  };

  return (
    <div
      role="dialog"
      aria-label={isHistory ? "观看历史" : "我的收藏"}
      className="glass-panel absolute left-0 right-0 top-full z-50 mt-3 flex max-h-[min(560px,calc(100dvh-7rem))] flex-col overflow-hidden rounded-2xl md:left-auto md:w-[400px] dropdown-enter"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div role="tablist" aria-label="片库" className="flex flex-1 gap-1 rounded-xl bg-gray-900/[0.04] p-1">
          {TABS.map(({ key, label, Icon }) => {
            const selected = activeTab === key;
            const count = key === "history" ? playHistory.length : favorites.length;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={selected}
                onClick={() => onTabChange(key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  selected
                    ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Icon className={`text-lg ${selected ? "text-primary-dark" : ""}`} aria-hidden="true" />
                {label}
                {count > 0 && (
                  <span
                    className={`min-w-5 rounded-full px-1.5 text-[11px] leading-5 tabular-nums ${
                      selected ? "bg-primary/20 text-gray-800" : "bg-gray-900/5 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          aria-label="关闭"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-900/5 hover:text-gray-700 cursor-pointer btn-press"
        >
          <MaterialSymbolsCloseRounded className="text-xl" />
        </button>
      </div>

      {/* List */}
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2 custom-scrollbar">
        {items.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <ul className="flex flex-col gap-0.5">
            {isHistory
              ? playHistory.map((record) => {
                  const progress = Math.min(Math.max(record.progress || 0, 0), 100);
                  return (
                    <li key={`${record.source}-${record.id}`} className="group relative">
                      <button
                        onClick={() => onHistoryClick(record)}
                        className="flex w-full items-center gap-3 rounded-xl p-2 pr-11 text-left transition-colors hover:bg-gray-900/[0.04] cursor-pointer"
                      >
                        <Poster src={record.poster}>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                            <MaterialSymbolsPlayArrowRounded className="text-2xl text-white" aria-hidden="true" />
                          </div>
                        </Poster>
                        <div className="min-w-0 flex-1">
                          <h4 className="line-clamp-1 text-sm font-semibold text-gray-900 transition-colors group-hover:text-primary-dark">
                            {record.title}
                          </h4>
                          <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                            {record.totalEpisodes > 1 ? `看到第 ${record.currentEpisodeIndex + 1} 集` : "电影"}
                            {record.source_name && <span className="text-gray-400"> · {record.source_name}</span>}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <div
                              className="h-1 flex-1 overflow-hidden rounded-full bg-gray-900/[0.08]"
                              role="progressbar"
                              aria-valuenow={Math.floor(progress)}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label="观看进度"
                            >
                              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="shrink-0 text-[11px] text-gray-400 tabular-nums">
                              {formatTimeShort(record.currentTime)} / {formatTimeShort(record.duration)}
                            </span>
                          </div>
                          {record.updatedAt && (
                            <p className="mt-1 text-[11px] text-gray-400">{formatRelativeTime(record.updatedAt)}</p>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={() => onDeleteHistory(record)}
                        className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer btn-press"
                        aria-label={`删除 ${record.title} 的观看记录`}
                      >
                        <MaterialSymbolsDeleteOutlineRounded className="text-lg" />
                      </button>
                    </li>
                  );
                })
              : favorites.map((favorite) => (
                  <li key={`${favorite.source}-${favorite.id}`} className="group relative">
                    <button
                      onClick={() => onFavoriteClick(favorite)}
                      className="flex w-full items-center gap-3 rounded-xl p-2 pr-11 text-left transition-colors hover:bg-gray-900/[0.04] cursor-pointer"
                    >
                      <Poster src={favorite.poster}>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                          <MaterialSymbolsSearchRounded className="text-xl text-white" aria-hidden="true" />
                        </div>
                      </Poster>
                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-primary-dark">
                          {favorite.title}
                        </h4>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[11px] font-medium text-gray-700">
                            {favorite.type === "tv" ? "剧集" : "电影"}
                          </span>
                          {favorite.genre && (
                            <span className="line-clamp-1 text-[11px] text-gray-500">{favorite.genre}</span>
                          )}
                        </div>
                        {favorite.addedAt && (
                          <p className="mt-1 text-[11px] text-gray-400">收藏于 {formatRelativeTime(favorite.addedAt)}</p>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => onDeleteFavorite(favorite)}
                      className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer btn-press"
                      aria-label={`取消收藏 ${favorite.title}`}
                    >
                      <MaterialSymbolsDeleteOutlineRounded className="text-lg" />
                    </button>
                  </li>
                ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-900/[0.06] px-4 py-2.5">
          <span className="text-xs text-gray-400">
            {isHistory ? `最近 ${items.length} 条记录` : `共 ${items.length} 部`}
          </span>
          <button
            onClick={handleClear}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer btn-press ${
              confirmingClear
                ? "bg-red-500 text-white hover:bg-red-600"
                : "text-gray-500 hover:bg-red-50 hover:text-red-500"
            }`}
          >
            {confirmingClear ? "再次点击确认清空" : isHistory ? "清空历史" : "清空收藏"}
          </button>
        </div>
      )}
    </div>
  );
}
