"use client";

import { useState, useMemo } from "react";
import { MaterialSymbolsSwapVertRounded } from "@/components/icons";

export function EpisodeList({ episodes, episodesTitles, currentEpisodeIndex, onEpisodeClick }) {
  const [isReversed, setIsReversed] = useState(false);
  const [page, setPage] = useState(0);
  const [prevEpisodeIndex, setPrevEpisodeIndex] = useState(currentEpisodeIndex);
  const pageSize = 35;

  // 根据排序状态生成显示列表
  const displayEpisodes = useMemo(() => {
    if (!episodes) return [];
    const indices = episodes.map((_, index) => index);
    return isReversed ? [...indices].reverse() : indices;
  }, [episodes, isReversed]);

  // 当当前集数变化时，自动切换到所在页（在渲染阶段处理，避免 useEffect 中调用 setState）
  if (currentEpisodeIndex !== prevEpisodeIndex && episodes) {
    setPrevEpisodeIndex(currentEpisodeIndex);
    const currentIndexInDisplay = displayEpisodes.indexOf(currentEpisodeIndex);
    if (currentIndexInDisplay !== -1) {
      const targetPage = Math.floor(currentIndexInDisplay / pageSize);
      setPage(targetPage);
    }
  }

  const totalPages = Math.ceil(displayEpisodes.length / pageSize);
  const currentRangeEpisodes = displayEpisodes.slice(page * pageSize, (page + 1) * pageSize);

  if (!episodes || episodes.length === 0) {
    return null;
  }

  // Ensure tabs are shown if there are episodes, even if just one page
  const showTabs = episodes.length > 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-white/50 dark:bg-slate-800/50 shrink-0">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">选集</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{episodes.length > 1 ? `更新至 ${episodes.length} 集` : "电影"}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="text-slate-400 hover:text-primary transition-colors flex items-center gap-1 text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded cursor-pointer"
            onClick={() => setIsReversed(!isReversed)}
          >
            <span>{isReversed ? "倒序" : "正序"}</span>
            <MaterialSymbolsSwapVertRounded className={`text-[14px] transition-transform ${isReversed ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {episodes.length > 1 && (
        <>
          {showTabs && (
            <div className="px-4 py-2 flex gap-2 overflow-x-auto custom-scrollbar border-b border-gray-50 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-800/30 shrink-0">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const start = idx * pageSize + 1;
                const end = Math.min((idx + 1) * pageSize, episodes.length);
                const isActive = page === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setPage(idx)}
                    className={`whitespace-nowrap px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${isActive
                      ? "bg-white dark:bg-slate-700 text-primary shadow-sm ring-1 ring-primary/20"
                      : "text-slate-500 hover:bg-white hover:shadow-sm dark:text-slate-400 dark:hover:bg-slate-700"
                      }`}
                  >
                    {start}-{end}
                  </button>
                );
              })}
            </div>
          )}

          <div className="p-4 grid grid-cols-5 gap-3 overflow-y-auto custom-scrollbar flex-1 content-start">
            {currentRangeEpisodes.map((originalIndex) => {
              const episodeTitle = episodesTitles?.[originalIndex] || `第${originalIndex + 1}集`;
              const displayIndex = String(originalIndex + 1).padStart(2, "0");
              const isCurrent = originalIndex === currentEpisodeIndex;

              return (
                <div key={originalIndex} className="relative group/episode">
                  <button
                    className={`w-full aspect-square rounded-lg flex items-center justify-center font-medium transition-all duration-200 shadow-sm hover:shadow-md text-sm cursor-pointer
                      ${isCurrent
                        ? "bg-primary text-white font-bold shadow-md shadow-primary/30 transform scale-105"
                        : "text-slate-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-700 hover:bg-white hover:border-primary hover:text-primary dark:hover:bg-slate-700 dark:hover:border-primary dark:hover:text-primary"
                      }
                    `}
                    onClick={() => onEpisodeClick(originalIndex)}
                  >
                    {displayIndex}
                    {isCurrent && <span className="absolute top-0 right-0 -mt-1 -mr-1 flex size-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span><span className="relative inline-flex size-3 rounded-full bg-sky-500"></span></span>}
                  </button>
                  {/* Hover Tooltip */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover/episode:opacity-100 group-hover/episode:visible transition-all duration-200 pointer-events-none z-50">
                    {episodeTitle}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {episodes.length === 1 && <div className="p-4 text-center text-slate-500 text-sm">这是一部电影，无需选集</div>}
    </div>
  );
}
