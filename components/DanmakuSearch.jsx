"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { searchAnime, getEpisodes } from "@/lib/danmakuApi";
import { useSettingsStore } from "@/store/useSettingsStore";
import {
  MaterialSymbolsSearchRounded,
  MaterialSymbolsArrowBackRounded,
  MaterialSymbolsChevronRightRounded,
  MaterialSymbolsPlayArrowRounded,
} from "@/components/icons";

export function DanmakuSearch({ id, initialTitle, onEpisodeSelect, onAnimeSelect, onCollapse }) {
  const searchInputId = useId();
  const headingId = `${searchInputId}-heading`;
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
  const selectedEpisode = episodes.find((episode) => episode.episodeId === selectedEpisodeId);

  const handleSearch = async () => {
    if (searching || !searchTerm.trim() || !enabledSource) return;

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
    setSearchError("");
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

  return (
    <section id={id} aria-labelledby={headingId} data-empty={!enabledSource} className={`danmaku-panel rounded-2xl bg-surface-light overflow-hidden flex flex-col min-h-0 ${enabledSource ? "h-full" : ""}`}>
      <div className="p-4 flex justify-between items-center gap-3 shrink-0">
        <div>
          <h2 id={headingId} className="text-base font-semibold text-ink">弹幕匹配</h2>
          {enabledSource && <p className="text-xs text-muted mt-0.5">选择对应版本与集数</p>}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {onCollapse && (
            <button
              type="button"
              className="hidden lg:flex size-11 items-center justify-center rounded-lg text-muted hover:bg-surface-active hover:text-ink transition-colors cursor-pointer"
              onClick={onCollapse}
              aria-label="收起弹幕面板，扩大画面"
              title="收起弹幕面板，扩大画面"
              aria-controls={id}
              aria-expanded="true"
            >
              <MaterialSymbolsChevronRightRounded className="text-xl" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {!enabledSource ? (
        <div className="px-5 pb-5 flex flex-col items-center justify-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary-dark" aria-hidden="true"><MaterialSymbolsSearchRounded className="text-2xl" /></div>
          <h3 className="text-sm font-semibold text-ink">还没有启用弹幕源</h3>
          <p className="text-sm leading-7 text-muted text-center">启用弹幕源后，可以按片名和集数匹配。</p>
          <Link href="/settings" className="ui-button">配置弹幕源</Link>
        </div>
      ) : (
        <>
      <div className="px-4 pb-4 shrink-0">
        <label htmlFor={searchInputId} className="block mb-2 text-xs font-medium text-muted">片名</label>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
          <input
            id={searchInputId}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="输入片名"
            className="ui-input flex-1"
          />
          <button
            type="submit"
            disabled={searching || !searchTerm.trim()}
            aria-busy={searching}
            className="ui-button ui-button-primary shrink-0 px-3"
          >
            {searching ? "搜索中" : (
              <>
                <MaterialSymbolsSearchRounded className="text-lg" aria-hidden="true" />
                搜索
              </>
            )}
          </button>
        </form>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 max-h-[28rem] lg:max-h-none overflow-y-auto custom-scrollbar">
        {searching && <p role="status" className="p-6 text-sm leading-7 text-muted text-center">正在搜索匹配的弹幕...</p>}
        {/* Loading State */}
        {loadingEpisodes && (
          <p role="status" className="p-6 text-sm leading-7 text-muted text-center">正在获取集数...</p>
        )}

        {/* Error State */}
        {searchError && !searching && !loadingEpisodes && (
          <div className="p-4">
            <p role="status" className="text-sm leading-7 text-muted text-center">{searchError}</p>
          </div>
        )}

        {/* Anime List (search results) */}
        {!selectedAnime && !searching && animes.length > 0 && (
          <div className="p-3 space-y-2">
            {animes.map((anime) => (
              <button
                type="button"
                key={anime.animeId}
                onClick={() => handleAnimeSelect(anime)}
                className="w-full text-left p-3 rounded-xl border border-transparent hover:border-line hover:bg-background-light transition-colors cursor-pointer group"
              >
                <div className="flex gap-3">
                  {anime.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={anime.imageUrl}
                      alt=""
                      className="w-12 h-16 object-cover rounded-lg shrink-0 bg-surface-active"
                      onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink group-hover:text-primary-dark line-clamp-2 transition-colors">
                      {anime.animeTitle}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="text-xs text-muted">
                        {anime.typeDescription || anime.type}
                      </span>
                      {anime.episodeCount != null && <span className="text-xs text-muted">
                        {anime.episodeCount} 集
                      </span>}
                      {anime.source && (
                        <span className="text-xs text-primary-dark">
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
        {selectedAnime && !loadingEpisodes && (
          <div className="p-4">
            <button
              type="button"
              onClick={handleBackToSearch}
              className="flex items-center gap-1 text-xs text-muted hover:text-primary-dark mb-3 px-1 min-h-11 rounded-lg transition-colors cursor-pointer"
            >
              <MaterialSymbolsArrowBackRounded className="text-base" aria-hidden="true" />
              返回搜索结果
            </button>
            <div className="flex flex-wrap gap-2 content-start">
              {episodes.map((ep) => {
                const isCurrent = ep.episodeId === selectedEpisodeId;
                const displayNumber = String(ep.episodeNumber || "?").padStart(2, "0");
                return (
                    <button
                      type="button"
                      key={ep.episodeId}
                      className={`size-11 rounded-lg border flex items-center justify-center gap-0.5 font-medium transition-colors text-sm tabular-nums cursor-pointer shrink-0 ${isCurrent ? "bg-primary-soft border-primary text-primary-dark font-semibold" : "text-muted bg-background-light border-transparent hover:border-line hover:text-ink"}`}
                      onClick={() => handleEpisodeClick(ep)}
                      aria-label={ep.episodeTitle || `第 ${ep.episodeNumber} 集`}
                      aria-pressed={isCurrent}
                      title={ep.episodeTitle}
                    >
                      {isCurrent && <MaterialSymbolsPlayArrowRounded className="text-base" aria-hidden="true" />}
                      {displayNumber}
                    </button>
                );
              })}
            </div>
            {selectedEpisode && <p role="status" className="mt-4 text-xs leading-6 text-muted">当前匹配：{selectedEpisode.episodeTitle}</p>}
          </div>
        )}

        {/* Empty Initial State */}
        {!searching && !loadingEpisodes && animes.length === 0 && !searchError && (
          <div className="p-6 flex items-center justify-center">
            <p className="text-sm leading-7 text-muted text-center">
              输入片名，再选择对应版本与集数。
            </p>
          </div>
        )}
      </div>
        </>
      )}
    </section>
  );
}
