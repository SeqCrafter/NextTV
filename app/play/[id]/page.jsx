"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useVideoData } from "@/hooks/useVideoData";
import { VideoPlayer } from "@/components/VideoPlayer";
import { FavoriteButton } from "@/components/FavoriteButton";
import { EpisodeList } from "@/components/EpisodeList";
import { LoadingSpinner } from "@/components/PlayerPageLoading";
import Image from "next/image";
import {
  MaterialSymbolsHomeOutlineRounded,
  MaterialSymbolsShareOutline,
  MaterialSymbolsMovieOutlineRounded,
  MaterialSymbolsPublic,
  MaterialSymbolsStarOutlineRounded,
  MaterialSymbolsPerson2OutlineRounded,
  MaterialSymbolsChevronLeftRounded,
} from "@/components/icons";

export default function PlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id;
  const source = searchParams.get("source");
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [episodesCollapsed, setEpisodesCollapsed] = useState(false);
  const [fixedPlayerHeight, setFixedPlayerHeight] = useState(null);
  const playerWrapperRef = useRef(null);
  const { videoDetail, doubanActors, loading, error } = useVideoData(id, source, setCurrentEpisodeIndex);

  const handleCollapse = useCallback(() => {
    if (playerWrapperRef.current) {
      setFixedPlayerHeight(playerWrapperRef.current.offsetHeight);
    }
    setEpisodesCollapsed(true);
  }, []);

  const handleExpand = useCallback(() => {
    setEpisodesCollapsed(false);
    setFixedPlayerHeight(null);
  }, []);

  const handleEpisodeClick = (index) => {
    setCurrentEpisodeIndex(index);
  };

  if (error) {
    return (
      <div className="w-full max-w-7xl pt-4 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (loading || !videoDetail) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <nav aria-label="Breadcrumb" className="flex text-sm text-slate-500 dark:text-slate-400 mb-4 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-primary flex items-center gap-1 transition-colors">
          <MaterialSymbolsHomeOutlineRounded className="text-[18px]" /> 首页
        </Link>
        <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
        <span className="hover:text-primary transition-colors cursor-pointer">
          {videoDetail.type === "movie" ? "电影" : videoDetail.type === "tv" ? "电视剧" : videoDetail.type === "short" ? "短剧" : "其它"}
        </span>
        <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
        <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px]">{videoDetail.title}</span>
      </nav>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 transition-all duration-300 items-stretch">
        {/* Left Column: Player and Info */}
        <div className={`flex flex-col gap-4 transition-all duration-300 ${episodesCollapsed ? "lg:col-span-12" : "lg:col-span-8 xl:col-span-9"}`}>
          <div ref={playerWrapperRef} className={`relative ${episodesCollapsed ? "" : "aspect-video"}`} style={episodesCollapsed && fixedPlayerHeight ? { height: fixedPlayerHeight } : undefined}>
            <VideoPlayer key={id} videoDetail={videoDetail} currentEpisodeIndex={currentEpisodeIndex} setCurrentEpisodeIndex={setCurrentEpisodeIndex} />
            {episodesCollapsed && (
              <button
                className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white/80 hover:text-white text-xs font-medium backdrop-blur-sm transition-all cursor-pointer"
                onClick={handleExpand}
                title="显示选集"
              >
                <MaterialSymbolsChevronLeftRounded className="text-[16px]" />
                选集
              </button>
            )}
          </div>

          {/* Mobile Actions Bar (Visible only on mobile/tablet) */}
          <div className="flex lg:hidden justify-between items-center px-2 py-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-800">
            <div className="flex gap-4">
              <FavoriteButton source={source} id={id} videoDetail={videoDetail} className="flex flex-col items-center gap-1 text-xs text-slate-500 hover:text-primary" />
              {/* Keep only requested items: Favorite, Share, Source Name (shown below) */}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[150px]">{videoDetail.title}</div>
              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-xs">{videoDetail.source_name || source}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Episodes */}
        <div className={`w-full lg:col-span-4 xl:col-span-3 flex flex-col h-full transition-all duration-300 ${episodesCollapsed ? "hidden" : ""}`}>
          <EpisodeList
            episodes={videoDetail.episodes}
            episodesTitles={videoDetail.episodes_titles}
            currentEpisodeIndex={currentEpisodeIndex}
            onEpisodeClick={handleEpisodeClick}
            onCollapse={handleCollapse}
          />
        </div>
      </div>

      {/* Bottom Section: Full Info Card (Hidden on Mobile as per request "mobile details only ...", keeping desktop rich) */}
      <div className="hidden lg:block bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-56 shrink-0 mx-auto md:mx-0 max-w-[240px]">
            <div className="relative aspect-2/3 rounded-lg overflow-hidden group">
              <Image
                alt={`${videoDetail.title} Poster`}
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                src={videoDetail.poster}
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                unoptimized
                priority
              />
              <div className="absolute top-2 left-2 bg-primary/90 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">HD</div>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-100 dark:border-slate-700 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">{videoDetail.title}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                  <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-medium text-slate-600 dark:text-slate-300">{videoDetail.year}</span>
                  <span className="flex items-center gap-1">
                    <MaterialSymbolsMovieOutlineRounded className="text-[16px] text-slate-400" /> {videoDetail.genre}
                  </span>
                  {videoDetail.class && (
                    <span className="flex items-center gap-1">
                      <MaterialSymbolsPublic className="text-[16px] text-slate-400" /> {videoDetail.type_name}
                    </span>
                  )}
                  <span>更新至 {videoDetail.episodes?.length || 1} 集</span>
                  <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-xs">{videoDetail.source_name || source}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-primary">
                    <MaterialSymbolsStarOutlineRounded className="text-[24px] fill-current" />
                    <span className="text-2xl font-bold">{videoDetail.rating}</span>
                    <span className="text-xs text-slate-400 mt-2">/ 10</span>
                  </div>
                  <span className="text-xs text-slate-400">豆瓣评分</span>
                </div>
                <div className="hidden sm:flex gap-2">
                  <FavoriteButton
                    source={source}
                    id={id}
                    videoDetail={videoDetail}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {videoDetail.desc && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">剧情简介</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-loose tracking-wide text-justify">{videoDetail.desc}</p>
              </div>
            )}

            {(doubanActors.length > 0 || (videoDetail.actors && videoDetail.actors.length > 0)) && (
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">演员表</h3>
                <div className="flex flex-wrap gap-6">
                  {(doubanActors.length > 0 ? doubanActors : videoDetail.actors).map((actor, idx) => (
                    <div key={actor.id || idx} className="flex flex-col items-center gap-2 group cursor-pointer">
                      <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all">
                        {actor.avatar ? (
                          <Image
                            src={actor.avatar}
                            alt={actor.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                            unoptimized
                            onError={(e) => {
                              const img = e.target;
                              img.style.display = "none";
                              if (img.nextSibling) {
                                img.nextSibling.style.display = "flex";
                              }
                            }}
                          />
                        ) : null}
                        <div className="absolute inset-0 text-gray-400 items-center justify-center bg-gray-100 rounded-full" style={{ display: actor.avatar ? "none" : "flex" }}>
                          <MaterialSymbolsPerson2OutlineRounded className="text-2xl" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-primary max-w-[60px] truncate">{actor.name}</p>
                        {actor.role && <p className="text-[10px] text-slate-500 max-w-[60px] truncate">{actor.role}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
