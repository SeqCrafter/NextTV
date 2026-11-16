"use client";

import { useState, useId } from "react";
import * as m from "motion/react-m";
import { pressSpring, snappySpring } from "@/lib/motion";
import { MaterialSymbolsSwapVertRounded, MaterialSymbolsChevronRightRounded, MaterialSymbolsPlayArrowRounded } from "@/components/icons";

export function EpisodeList({ episodes, episodesTitles, currentEpisodeIndex, onEpisodeClick, onCollapse }) {
  const [isReversed, setIsReversed] = useState(false);
  const id = useId();
  const [manualPageState, setManualPageState] = useState(null);
  const pageSize = 35;

  if (!episodes || episodes.length === 0) {
    return null;
  }

  const displayEpisodes = episodes.map((_, index) => index);
  if (isReversed) displayEpisodes.reverse();
  const currentIndexInDisplay = displayEpisodes.indexOf(currentEpisodeIndex);
  const syncedPage = currentIndexInDisplay === -1 ? 0 : Math.floor(currentIndexInDisplay / pageSize);
  const totalPages = Math.ceil(displayEpisodes.length / pageSize);
  // 切集和排序后自动回到当前集所在分组，手动浏览分组时不抢占位置。
  const page = manualPageState?.episodeIndex === currentEpisodeIndex && manualPageState?.isReversed === isReversed
    ? Math.min(manualPageState.page, totalPages - 1)
    : syncedPage;
  const currentRangeEpisodes = displayEpisodes.slice(page * pageSize, (page + 1) * pageSize);
  const currentTitle = episodesTitles?.[currentEpisodeIndex] || (episodes.length === 1 ? "正片" : `第 ${currentEpisodeIndex + 1} 集`);

  return (
    <section id="episode-panel" aria-labelledby="episode-heading" className="episode-panel surface-panel">
      <div className="px-4 py-3 border-b border-line flex justify-between items-center gap-2 shrink-0">
        <div className="min-w-0">
          <h2 id="episode-heading" className="text-base font-semibold text-ink">{episodes.length > 1 ? "剧集" : "影片"}</h2>
          <p className="text-xs text-muted mt-0.5">{episodes.length > 1 ? `共 ${episodes.length} 集` : "完整影片"}</p>
        </div>

        <div className="flex items-center gap-1">
          {episodes.length > 1 && (
            <button
              type="button"
              className="flex min-h-11 items-center gap-1 px-2 rounded-lg text-xs text-muted hover:bg-surface-active hover:text-ink transition-colors cursor-pointer"
              onClick={() => setIsReversed((value) => !value)}
              aria-label={isReversed ? "切换为正序排列" : "切换为倒序排列"}
              aria-pressed={isReversed}
            >
              <MaterialSymbolsSwapVertRounded className={`text-lg transition-transform duration-150 ${isReversed ? "rotate-180" : ""}`} aria-hidden="true" />
              {isReversed ? "倒序" : "正序"}
            </button>
          )}
          {onCollapse && (
            <button
              type="button"
              className="hidden lg:flex size-11 items-center justify-center rounded-lg text-muted hover:bg-surface-active hover:text-ink transition-colors cursor-pointer"
              onClick={onCollapse}
              title="收起选集，扩大画面"
              aria-label="收起选集，扩大画面"
            >
              <MaterialSymbolsChevronRightRounded className="text-xl" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div aria-label="集数分组" className="px-3 py-1.5 flex gap-1 overflow-x-auto custom-scrollbar border-b border-line shrink-0">
          {Array.from({ length: totalPages }).map((_, idx) => {
            const group = displayEpisodes.slice(idx * pageSize, (idx + 1) * pageSize);
            return (
              <button
                type="button"
                key={idx}
                onClick={() => setManualPageState({ episodeIndex: currentEpisodeIndex, isReversed, page: idx })}
                aria-pressed={page === idx}
                className={`whitespace-nowrap min-h-11 px-3 text-xs tabular-nums rounded-lg transition-colors cursor-pointer ${page === idx ? "bg-primary-soft text-primary-dark font-semibold" : "text-muted hover:bg-surface-active"}`}
              >
                {group[0] + 1}-{group[group.length - 1] + 1}
              </button>
            );
          })}
        </div>
      )}

      <m.div layoutScroll className={`p-4 grid gap-2 overflow-y-auto custom-scrollbar flex-1 min-h-0 max-h-80 lg:max-h-none content-start ${episodes.length === 1 ? "grid-cols-1" : "grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-5"}`}>
        {currentRangeEpisodes.map((originalIndex) => {
          const episodeTitle = episodesTitles?.[originalIndex] || (episodes.length === 1 ? "正片" : `第 ${originalIndex + 1} 集`);
          const isCurrent = originalIndex === currentEpisodeIndex;
          return (
            <m.button
              layout="position"
              whileTap={{ scale: 0.94 }}
              transition={{ ...pressSpring, layout: snappySpring }}
              type="button"
              key={originalIndex}
              className={`relative isolate min-h-11 min-w-0 px-1 rounded-lg border flex items-center justify-center gap-0.5 text-sm tabular-nums transition-colors cursor-pointer ${isCurrent ? "border-primary text-primary-dark font-semibold" : "bg-background-light/70 border-transparent text-muted hover:border-line hover:bg-surface-active hover:text-ink"}`}
              onClick={() => onEpisodeClick(originalIndex)}
              title={episodeTitle}
              aria-label={episodeTitle}
              aria-current={isCurrent ? "true" : undefined}
            >
              {isCurrent && <m.span layoutId={`episode-${id}`} className="absolute inset-0 -z-10 rounded-lg bg-primary-soft" aria-hidden="true" transition={snappySpring} />}
              {isCurrent && <MaterialSymbolsPlayArrowRounded className="text-base shrink-0" aria-hidden="true" />}
              <span className="truncate">{episodes.length === 1 ? episodeTitle : String(originalIndex + 1).padStart(2, "0")}</span>
            </m.button>
          );
        })}
      </m.div>

      <div className="mt-auto border-t border-line px-4 py-3 bg-background-light/50 shrink-0">
        <p className="text-xs text-muted">当前选集</p>
        <p className="mt-1 text-sm font-medium text-ink break-words" aria-live="polite" aria-atomic="true">{currentTitle}</p>
      </div>
    </section>
  );
}
