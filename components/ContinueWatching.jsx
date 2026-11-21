"use client";

import { useRouter } from "next/navigation";
import { formatTimeRemaining } from "@/lib/util";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useEffect, useMemo, useState } from "react";
import { MaterialSymbolsPlayArrowRounded } from "@/components/icons";

const UPGRADE_CACHE_TTL = 15 * 60 * 1000;
const upgradeCache = new Map();

export function ContinueWatching({ playHistory }) {
  const router = useRouter();
  const videoSources = useSettingsStore((state) => state.videoSources);
  const [updatedEpisodes, setUpdatedEpisodes] = useState({});

  const recentHistory = useMemo(
    () => (playHistory || []).slice(0, 6),
    [playHistory],
  );
  const historyDependencyKey = useMemo(
    () =>
      recentHistory
        .map((item) => `${item.source}:${item.id}:${item.totalEpisodes}`)
        .join("|"),
    [recentHistory],
  );
  const sourceUrlDependencyKey = useMemo(
    () =>
      videoSources
        .map((source) => `${source.key}:${source.url}`)
        .sort()
        .join("|"),
    [videoSources],
  );

  useEffect(() => {
    if (recentHistory.length === 0) return;

    let cancelled = false;

    const checkUpdates = async () => {
      // 2. 按 source 分组
      const groupedBySource = recentHistory.reduce((acc, item) => {
        if (!acc[item.source]) {
          acc[item.source] = [];
        }
        acc[item.source].push(item);
        return acc;
      }, {});

      // 3. 遍历分组请求更新
      const updates = {};

      await Promise.all(
        Object.entries(groupedBySource).map(async ([sourceKey, items]) => {
          // 获取该 source 的 API 地址
          const sourceConfig = videoSources.find((s) => s.key === sourceKey);
          if (!sourceConfig || !sourceConfig.url) return;

          const ids = items.map((item) => item.id).join(",");
          const cacheKey = `${sourceKey}|${sourceConfig.url}|${ids}`;
          const cachedEntry = upgradeCache.get(cacheKey);
          let episodeLengths;

          try {
            if (cachedEntry && Date.now() - cachedEntry.timestamp < UPGRADE_CACHE_TTL) {
              episodeLengths = cachedEntry.episodeLengths;
            } else {
              const res = await fetch(`/api/upgrade?ids=${ids}&sourceUrl=${sourceConfig.url}`);
              const data = await res.json();

              // 处理可能的嵌套结构
              episodeLengths = data.episodeLength?.episodeLength || data.episodeLength;
              if (Array.isArray(episodeLengths)) {
                upgradeCache.set(cacheKey, {
                  episodeLengths,
                  timestamp: Date.now(),
                });
              }
            }

            if (Array.isArray(episodeLengths)) {
              // 根据 id 匹配，而不是依赖数组索引顺序
              episodeLengths.forEach(({ id, length }) => {
                const item = items.find((i) => i.id === id);
                if (!item) return;

                const currentTotal = item.totalEpisodes || 0;
                // 如果获取到的总集数大于记录的总集数，说明有更新
                if (length > currentTotal) {
                  updates[`${item.source}-${item.id}`] = length - currentTotal;
                }
              });
            }
          } catch (error) {
            console.error(`Failed to check updates for source ${sourceKey}:`, error);
          }
        }),
      );

      if (!cancelled) {
        setUpdatedEpisodes(updates);
      }
    };

    checkUpdates();

    return () => {
      cancelled = true;
    };
  }, [recentHistory, videoSources, historyDependencyKey, sourceUrlDependencyKey]);

  if (!playHistory || playHistory.length === 0) {
    return null;
  }

  // 格式化集数信息
  function formatEpisodeInfo(record) {
    const remainingTime = formatTimeRemaining(record.duration - record.currentTime);
    if (record.totalEpisodes > 1) {
      return `第${record.currentEpisodeIndex + 1}集 • 剩余 ${remainingTime}`;
    }
    return `剩余 ${remainingTime}`;
  }

  function handlePlayClick(record) {
    if (record.source_name === "直链播放") {
      const params = new URLSearchParams({
        playerurl: record.source,
        title: record.title,
      });
      router.push(`/direct?${params.toString()}`);
    } else {
      router.push(`/play/${record.id}?source=${record.source}`);
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-semibold text-ink">继续观看</h2>
        <span className="text-xs text-muted">{recentHistory.length > 1 ? "左右滑动查看" : "接着上次看"}</span>
      </div>

      <div aria-label="最近观看的影片" tabIndex={0} className="flex gap-3 sm:gap-4 overflow-x-auto custom-scrollbar pb-2 snap-x snap-mandatory rounded-xl">
        {recentHistory.map((record) => {
          const progress = Math.max(0, Math.min(Number(record.progress) || 0, 100));
          return (
          <div
            key={`${record.source}-${record.id}`}
            role="link"
            tabIndex={0}
            aria-label={`继续观看 ${record.title}`}
            className="group relative shrink-0 snap-start w-[280px] rounded-xl bg-surface-light overflow-hidden hover:bg-primary-soft/50 transition-colors duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-dark"
            onClick={() => handlePlayClick(record)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handlePlayClick(record);
              }
            }}
          >
            {updatedEpisodes[`${record.source}-${record.id}`] > 0 && (
              <div className="absolute top-0 right-0 z-20">
                  <span className="relative flex items-center justify-center bg-primary-soft text-primary-dark text-xs px-2 py-0.5 rounded-bl-lg font-medium">
                    更新 {updatedEpisodes[`${record.source}-${record.id}`]} 集
                  </span>
              </div>
            )}
            <div className="flex gap-3 p-3">
              {/* 海报 */}
              <div className="relative w-16 h-24 bg-surface-active rounded-lg overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={record.poster || undefined} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} className="w-full h-full object-cover" />
                {/* 播放图标 */}
                <div aria-hidden="true" className="absolute inset-0 bg-black/0 group-hover:bg-black/20 group-focus-visible:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200">
                    <MaterialSymbolsPlayArrowRounded className="text-ink text-xl" />
                  </div>
                </div>
              </div>

              {/* 信息区域 */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="font-medium text-ink text-sm leading-5 mb-1 line-clamp-2 group-hover:text-primary-dark transition-colors" title={record.title}>{record.title}</h3>
                  <p className="text-xs text-muted">{formatEpisodeInfo(record)}</p>
                  {record.source_name && <p className="mt-1 text-xs text-muted truncate">{record.source_name}</p>}
                </div>

                {/* 进度条 */}
                <div className="mt-2">
                   <div className="h-1 bg-line rounded-full overflow-hidden" role="progressbar" aria-label="观看进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(progress)}>
                     <div className="h-full bg-primary" style={{ width: `${progress}%` }}></div>
                   </div>
                   <p className="text-xs text-muted mt-1 tabular-nums">已看 {Math.floor(progress)}%</p>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
