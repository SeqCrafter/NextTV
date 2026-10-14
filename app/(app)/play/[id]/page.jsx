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
import dynamic from "next/dynamic";
import {
  MaterialSymbolsHomeOutlineRounded,
  MaterialSymbolsMovieOutlineRounded,
  MaterialSymbolsPublic,
  MaterialSymbolsStarOutlineRounded,
  MaterialSymbolsPerson2OutlineRounded,
  MaterialSymbolsChevronLeftRounded,
} from "@/components/icons";

// 弹幕搜索弹窗只在用户点击时才需要，按需加载以减小播放页首屏 JS
const DanmakuSearchModal = dynamic(
  () => import("@/components/DanmakuSearchModal").then((m) => m.DanmakuSearchModal),
  { ssr: false },
);

export default function PlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id;
  const source = searchParams.get("source");
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [episodesCollapsed, setEpisodesCollapsed] = useState(false);
  const [fixedPlayerHeight, setFixedPlayerHeight] = useState(null);
  const [showDanmakuModal, setShowDanmakuModal] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const playerWrapperRef = useRef(null);
  const loadManualDanmakuRef = useRef(null);
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

  const handleDanmakuEpisodeConfirm = useCallback((episodeId) => {
    loadManualDanmakuRef.current?.(episodeId);
  }, []);

  const handleOpenDanmakuModal = useCallback(() => {
    setShowDanmakuModal(true);
  }, []);

  const handleCloseDanmakuModal = useCallback(() => {
    setShowDanmakuModal(false);
  }, []);

  if (error) {
    return (
      <div className="w-full max-w-7xl pt-4 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl font-bold">
            !
          </div>
          <div className="space-y-1">
            <p className="text-gray-900 font-semibold">视频加载失败</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
          <Link href="/" className="text-primary text-sm hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !videoDetail) {
    return <LoadingSpinner />;
  }


  return (
    <div className="w-full max-w-7xl mx-auto pt-1 pb-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <nav aria-label="Breadcrumb" className="hidden sm:flex text-sm text-slate-500 dark:text-slate-400 mb-4 overflow-x-auto whitespace-nowrap">
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

      <div className="flex flex-col gap-4 sm:gap-6 lg:grid lg:grid-cols-12 transition-all duration-300 items-stretch">
        {/* Left Column: Player and Info */}
        <div className={`flex flex-col gap-3 sm:gap-4 transition-all duration-300 ${episodesCollapsed ? "lg:col-span-12" : "lg:col-span-8 xl:col-span-9"}`}>
          <div ref={playerWrapperRef} className={`relative -mx-4 sm:mx-0 ${episodesCollapsed ? "" : "aspect-video"}`} style={episodesCollapsed && fixedPlayerHeight ? { height: fixedPlayerHeight } : undefined}>
            <VideoPlayer
              key={id}
              videoDetail={videoDetail}
              currentEpisodeIndex={currentEpisodeIndex}
              setCurrentEpisodeIndex={setCurrentEpisodeIndex}
              loadManualDanmakuRef={loadManualDanmakuRef}
            />
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
          <div className="flex lg:hidden items-center gap-2 pl-4 pr-1.5 py-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-800">
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">{videoDetail.title}</h1>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 min-w-0">
                {videoDetail.rating && (
                  <span className="flex items-center gap-0.5 font-semibold text-primary-dark shrink-0">
                    <MaterialSymbolsStarOutlineRounded className="text-[14px]" aria-hidden="true" />
                    {videoDetail.rating}
                  </span>
                )}
                {videoDetail.year && <span className="shrink-0">{videoDetail.year}</span>}
                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded truncate">{videoDetail.source_name || source}</span>
              </div>
            </div>
            <FavoriteButton source={source} id={id} videoDetail={videoDetail} className="size-11! shrink-0" />
            <button className="danmaku-trigger-btn size-11 shrink-0 text-base" onClick={handleOpenDanmakuModal} title="手动搜索弹幕" aria-label="手动搜索弹幕">弹</button>
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

      {/* Bottom Section: Full Info Card（手机端为紧凑排布，标题与评分已在上方操作栏展示） */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-4 lg:gap-8">
          <div className="flex lg:block gap-4 shrink-0">
          <div className="w-24 sm:w-32 lg:w-56 shrink-0 max-w-[240px]">
            <div className="relative aspect-2/3 rounded-lg overflow-hidden group">
              <Image
                alt={`${videoDetail.title} Poster`}
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                src={videoDetail.poster}
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                unoptimized
              />
              <div className="absolute top-1.5 left-1.5 lg:top-2 lg:left-2 bg-primary/90 text-white text-[10px] lg:text-xs font-bold px-1.5 py-0.5 lg:px-2 lg:py-1 rounded backdrop-blur-sm">HD</div>
            </div>
          </div>

          {/* 手机端：海报旁的基本信息 */}
          <div className="lg:hidden min-w-0 flex-1 flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-400">
            {videoDetail.genre && (
              <span className="flex items-start gap-1.5">
                <MaterialSymbolsMovieOutlineRounded className="text-[16px] text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="line-clamp-2">{videoDetail.genre}</span>
              </span>
            )}
            {videoDetail.class && videoDetail.type_name && (
              <span className="flex items-center gap-1.5">
                <MaterialSymbolsPublic className="text-[16px] text-slate-400 shrink-0" aria-hidden="true" /> {videoDetail.type_name}
              </span>
            )}
            <span>更新至 {videoDetail.episodes?.length || 1} 集</span>
            {videoDetail.rating && <span className="text-xs text-slate-400">豆瓣评分 {videoDetail.rating} / 10</span>}
          </div>
          </div>

          <div className="flex-1 min-w-0 space-y-4 lg:space-y-6">
            <div className="hidden lg:flex flex-row justify-between items-start gap-4 border-b border-gray-100 dark:border-slate-700 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{videoDetail.title}</h1>
                  <button className="danmaku-trigger-btn" onClick={handleOpenDanmakuModal} title="手动搜索弹幕">弹</button>
                </div>
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
                <p className={`text-slate-600 dark:text-slate-300 text-sm leading-relaxed lg:leading-loose tracking-wide text-justify ${descExpanded ? "" : "line-clamp-4 lg:line-clamp-none"}`}>{videoDetail.desc}</p>
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  className="lg:hidden -ml-2 px-2 min-h-9 text-sm font-medium text-primary-dark cursor-pointer"
                  aria-expanded={descExpanded}
                >
                  {descExpanded ? "收起" : "展开全部"}
                </button>
              </div>
            )}

            {(doubanActors.length > 0 || (videoDetail.actors && videoDetail.actors.length > 0)) && (
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">演员表</h3>
                <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 lg:flex-wrap lg:gap-6 lg:overflow-visible">
                  {(doubanActors.length > 0 ? doubanActors : videoDetail.actors).map((actor, idx) => (
                    <div key={actor.id || idx} className="flex flex-col items-center gap-2 group cursor-pointer shrink-0">
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

      {/* Danmaku Search Modal */}
      {showDanmakuModal && (
        <DanmakuSearchModal
          isOpen
          onClose={handleCloseDanmakuModal}
          initialTitle={videoDetail.title}
          onEpisodeConfirm={handleDanmakuEpisodeConfirm}
        />
      )}
    </div>
  );
}
