"use client";

import { useState } from "react";
import { searchAnime, getEpisodes } from "@/lib/danmakuApi";
import { useSettingsStore } from "@/store/useSettingsStore";
import {
  MaterialSymbolsSearchRounded,
  MaterialSymbolsArrowBackRounded,
  MaterialSymbolsChevronRightRounded,
} from "@/components/icons";

export function DanmakuSearch({ initialTitle, onEpisodeSelect, onAnimeSelect, onCollapse }) {
  const [searchTerm, setSearchTerm] = useState(initialTitle || "");
  const [animes, setAnimes] = useState([]);
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(null);
  const [searching, setSearching] = useState(false);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [searchError, setSearchError] = useState("");

  const danmakuSources = useSettingsStore((s) => s.danmakuSources);
  const enabledSource = danmakuSources.find((s) => s.enabled);

  const handleSearch = async () => {
    if (!searchTerm.trim() || !enabledSource) return;

    setSearching(true);
    setSearchError("");
    setAnimes([]);
    setSelectedAnime(null);
    setEpisodes([]);
    setSelectedEpisodeId(null);

    try {
      const result = await searchAnime(enabledSource.url, searchTerm.trim());
      if (result?.success && result.animes?.length > 0) {
        setAnimes(result.animes);
      } else {
        setSearchError("未找到匹配的剧集");
      }
    } catch {
      setSearchError("搜索失败，请检查弹幕源配置");
    } finally {
      setSearching(false);
    }
  };

  const handleAnimeSelect = async (anime) => {
    if (!enabledSource) return;

    setSelectedAnime(anime);
    setLoadingEpisodes(true);
    setEpisodes([]);
    setSelectedEpisodeId(null);
    onAnimeSelect?.(anime.animeTitle, anime.imageUrl);

    try {
      const result = await getEpisodes(enabledSource.url, anime.animeId);
      if (result?.success && result.bangumi?.episodes?.length > 0) {
        setEpisodes(result.bangumi.episodes);
      } else {
        setSearchError("未找到剧集列表");
      }
    } catch {
      setSearchError("获取剧集失败");
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const handleEpisodeClick = (episode) => {
    setSelectedEpisodeId(episode.episodeId);
    onEpisodeSelect?.(episode.episodeId);
  };

  const handleBackToSearch = () => {
    setSelectedAnime(null);
    setEpisodes([]);
    setSelectedEpisodeId(null);
    setSearchError("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  if (!enabledSource) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-white/50 dark:bg-slate-800/50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">弹幕搜索</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">匹配弹幕源</p>
          </div>
          {onCollapse && (
            <button
              className="hidden lg:flex text-white hover:bg-primary/80 transition-colors items-center gap-0.5 text-xs bg-primary/70 px-2 py-1 rounded cursor-pointer"
              onClick={onCollapse}
            >
              <span>折叠</span>
              <MaterialSymbolsChevronRightRounded className="text-[14px]" />
            </button>
          )}
        </div>
        <div className="p-6 flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            请先在设置页面中配置并启用弹幕源
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-white/50 dark:bg-slate-800/50 shrink-0">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">弹幕搜索</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">搜索匹配的弹幕源</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {onCollapse && (
            <button
              className="hidden lg:flex text-white hover:bg-primary/80 transition-colors items-center gap-0.5 text-xs bg-primary/70 px-2 py-1 rounded cursor-pointer"
              onClick={onCollapse}
            >
              <span>折叠</span>
              <MaterialSymbolsChevronRightRounded className="text-[14px]" />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-gray-50 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-800/30 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入剧名搜索弹幕..."
            className="flex-1 min-w-0 px-3 py-2.5 sm:py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !searchTerm.trim()}
            className="w-[72px] sm:w-[68px] py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
          >
            {searching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <MaterialSymbolsSearchRounded className="text-[16px]" />
                搜索
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {/* Loading State */}
        {loadingEpisodes && (
          <div className="p-6 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            <p className="text-sm text-slate-500">加载剧集...</p>
          </div>
        )}

        {/* Error State */}
        {searchError && !searching && !loadingEpisodes && (
          <div className="p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">{searchError}</p>
          </div>
        )}

        {/* Anime List (search results) */}
        {!selectedAnime && !searching && animes.length > 0 && (
          <div className="p-3 space-y-2">
            {animes.map((anime) => (
              <button
                key={anime.animeId}
                onClick={() => handleAnimeSelect(anime)}
                className="w-full text-left p-3 rounded-lg border border-gray-100 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all cursor-pointer group"
              >
                <div className="flex gap-3">
                  {anime.imageUrl && (
                    <img
                      src={anime.imageUrl}
                      alt={anime.animeTitle}
                      className="w-12 h-16 object-cover rounded shrink-0"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-white group-hover:text-primary truncate transition-colors">
                      {anime.animeTitle}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                        {anime.typeDescription || anime.type}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                        {anime.episodeCount} 集
                      </span>
                      {anime.source && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          {anime.source}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Episode List (after selecting anime) */}
        {selectedAnime && !loadingEpisodes && episodes.length > 0 && (
          <div className="p-4">
            <button
              onClick={handleBackToSearch}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary mb-3 -ml-1 px-1 min-h-9 sm:min-h-0 transition-colors cursor-pointer"
            >
              <MaterialSymbolsArrowBackRounded className="text-[14px]" />
              返回搜索结果
            </button>
            <div className="flex flex-wrap gap-2 content-start">
              {episodes.map((ep) => {
                const isCurrent = ep.episodeId === selectedEpisodeId;
                const displayNumber = String(ep.episodeNumber || "?").padStart(2, "0");
                return (
                  <div key={ep.episodeId} className="relative group/episode">
                    <button
                      className={`size-11 sm:size-10 rounded-lg flex items-center justify-center font-medium transition-all duration-200 text-xs cursor-pointer shrink-0
                        ${isCurrent
                          ? "bg-primary text-white font-bold transform scale-105"
                          : "text-slate-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-700 hover:bg-white hover:border-primary hover:text-primary dark:hover:bg-slate-700 dark:hover:border-primary dark:hover:text-primary"
                        }
                      `}
                      onClick={() => handleEpisodeClick(ep)}
                    >
                      {displayNumber}
                      {isCurrent && <span className="absolute top-0 right-0 -mt-1 -mr-1 flex size-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span><span className="relative inline-flex size-2.5 rounded-full bg-sky-500"></span></span>}
                    </button>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover/episode:opacity-100 group-hover/episode:visible transition-all duration-200 pointer-events-none z-50">
                      {ep.episodeTitle}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty Initial State */}
        {!searching && !loadingEpisodes && animes.length === 0 && !searchError && (
          <div className="p-6 flex items-center justify-center">
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center">
              输入剧名搜索对应弹幕
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
