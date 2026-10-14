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
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full" aria-hidden="true"></span>
          继续观看
        </h2>
      </div>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory">
        {recentHistory.map((record) => (
          <div
            key={`${record.source}-${record.id}`}
            role="link"
            tabIndex={0}
            aria-label={`继续观看 ${record.title}`}
            className="group relative shrink-0 snap-start w-[260px] sm:w-[280px] bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-primary hover:shadow-md transition-[border-color,box-shadow] duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                <div className="relative">
                  <span className="absolute -left-1 top-1 animate-ping inline-flex h-3 w-3 rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative flex items-center justify-center bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold shadow-sm">
                    更新 {updatedEpisodes[`${record.source}-${record.id}`]} 集
                  </span>
                </div>
              </div>
            )}
            <div className="flex gap-4 p-4">
              {/* 海报 */}
              <div className="relative w-24 h-36 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={record.poster} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />

                {record.source && (
                  <div className="absolute top-1 left-1 z-10">
                    <span className="block max-w-[5.5rem] truncate bg-primary/90 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium shadow-sm">{record.source_name || record.source}</span>
                  </div>
                )}
                {/* 播放图标 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                    <MaterialSymbolsPlayArrowRounded className="text-primary text-2xl ml-0.5" />
                  </div>
                </div>
              </div>

              {/* 信息区域 */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-2 group-hover:text-primary transition-colors">{record.title}</h3>
                  <p className="text-xs text-gray-500 mb-1">{formatEpisodeInfo(record)}</p>
                  {record.year && <p className="text-xs text-gray-400">{record.year}</p>}
                </div>

                {/* 进度条 */}
                <div className="mt-2">
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-label="观看进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(Math.min(record.progress, 100))}>
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${Math.min(record.progress, 100)}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 tabular-nums">{Math.floor(record.progress)}%</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
