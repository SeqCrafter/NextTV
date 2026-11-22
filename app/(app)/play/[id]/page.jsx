"use client";

import { useRetainedRoute } from "@/hooks/useRetainedRoute";
import { Suspense, useState, useLayoutEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useVideoData } from "@/hooks/useVideoData";
import { VideoPlayer } from "@/components/VideoPlayer";
import { FavoriteButton } from "@/components/FavoriteButton";
import { EpisodeList } from "@/components/EpisodeList";
import { LoadingSpinner } from "@/components/PlayerPageLoading";
import {
  MaterialSymbolsHomeOutlineRounded,
  MaterialSymbolsMovieOutlineRounded,
  MaterialSymbolsPerson2OutlineRounded,
  MaterialSymbolsChevronLeftRounded,
  MaterialSymbolsChevronRightRounded,
  MaterialSymbolsPlayArrowRounded,
} from "@/components/icons";

const DanmakuSearchModal = dynamic(
  () => import("@/components/DanmakuSearchModal").then((m) => m.DanmakuSearchModal),
  { ssr: false },
);

export default function PlayerPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PlayerContent />
    </Suspense>
  );
}

function PlayerContent() {
  const { params, searchParams } = useRetainedRoute();
  const id = params.id;
  const source = searchParams.get("source");
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [episodesCollapsed, setEpisodesCollapsed] = useState(false);
  const [showDanmakuModal, setShowDanmakuModal] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const loadManualDanmakuRef = useRef(null);
  const { videoDetail, doubanActors, loading, error } = useVideoData(id, source, setCurrentEpisodeIndex);

  useLayoutEffect(() => () => setShowDanmakuModal(false), []);

  const handleDanmakuEpisodeConfirm = useCallback((episodeId) => {
    loadManualDanmakuRef.current?.(episodeId);
  }, []);

  const handleCloseDanmakuModal = useCallback(() => {
    setShowDanmakuModal(false);
  }, []);

  if (error) {
    const message = {
      "Missing necessary parameters": "播放信息不完整，请从搜索结果重新打开影片。",
      "Video source not found": "这个视频源已不存在，请选择其他视频源。",
      "Failed to load data": "未能获取影片信息，请重新搜索或检查视频源。",
    }[error] || "暂时无法获取影片信息，请稍后重试。";
    return (
      <div className="w-full max-w-[1440px] flex min-h-[60dvh] items-center justify-center py-8">
        <div role="alert" className="empty-state w-full max-w-md">
          <div aria-hidden="true" className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary-dark">
            <MaterialSymbolsMovieOutlineRounded className="text-2xl" />
          </div>
          <h1 className="text-xl font-semibold text-ink">暂时无法加载影片</h1>
          <p className="text-sm leading-7 text-muted break-words">{message}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/" className="ui-button">返回首页</Link>
            <Link href="/search" className="ui-button ui-button-primary">重新搜索</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !videoDetail) return <LoadingSpinner />;

  const episodeCount = videoDetail.episodes?.length || 0;
  const episodeTitle = episodeCount === 0 ? "暂无可播放集数" : videoDetail.episodes_titles?.[currentEpisodeIndex] || (episodeCount === 1 ? "正片" : `第 ${currentEpisodeIndex + 1} 集`);
  const typeName = videoDetail.type_name || ({ movie: "电影", tv: "电视剧", short: "短剧" }[videoDetail.type] || "影片");
  const actors = doubanActors.length > 0 ? doubanActors : (videoDetail.actors || []);

  return (
    <div className="w-full max-w-[1440px] mx-auto pt-4 sm:pt-6 space-y-4 sm:space-y-5 page-enter">
      <nav aria-label="当前位置" className="flex min-h-11 items-center gap-2 text-xs sm:text-sm text-muted min-w-0">
        <Link href="/" className="flex min-h-11 items-center gap-1 hover:text-primary-dark transition-colors shrink-0">
          <MaterialSymbolsHomeOutlineRounded className="text-lg" aria-hidden="true" /> 首页
        </Link>
        <MaterialSymbolsChevronRightRounded className="text-base shrink-0 text-muted/60" aria-hidden="true" />
        <span className="shrink-0">{typeName}</span>
        <MaterialSymbolsChevronRightRounded className="text-base shrink-0 text-muted/60" aria-hidden="true" />
        <span aria-current="page" className="truncate text-ink">{videoDetail.title}</span>
      </nav>

      <div className="watch-layout" data-theater={episodesCollapsed || episodeCount === 0}>
        <section aria-label="视频播放" className="watch-card">
          <div className="watch-screen">
            <VideoPlayer
              key={id}
              videoDetail={videoDetail}
              currentEpisodeIndex={currentEpisodeIndex}
              setCurrentEpisodeIndex={setCurrentEpisodeIndex}
              loadManualDanmakuRef={loadManualDanmakuRef}
            />
          </div>

          <div className="watch-meta px-4 py-4 sm:px-5 sm:py-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="text-lg sm:text-[22px] leading-snug font-semibold text-ink break-words">{videoDetail.title}</h1>
                <span className="text-sm text-[var(--color-primary)] font-medium">{episodeTitle}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                {videoDetail.year && videoDetail.year !== "unknown" && <span>{videoDetail.year}</span>}
                <span>{typeName}</span>
                {episodeCount > 1 && <span>共 {episodeCount} 集</span>}
                <span className="rounded-md bg-surface-active px-2 py-0.5">{videoDetail.source_name || source}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <FavoriteButton source={source} id={id} videoDetail={videoDetail} showLabel />
              <button type="button" className="ui-button btn-press" onClick={() => setShowDanmakuModal(true)} title="手动搜索并匹配弹幕" aria-label="手动搜索弹幕">
                <span aria-hidden="true" className="flex size-5 items-center justify-center rounded border border-muted/40 text-xs text-muted">弹</span>
                弹幕
              </button>
              {episodeCount > 1 && (
                <button type="button" className="ui-button ui-button-primary btn-press" disabled={currentEpisodeIndex >= episodeCount - 1} onClick={() => setCurrentEpisodeIndex((index) => Math.min(index + 1, episodeCount - 1))}>
                  <MaterialSymbolsPlayArrowRounded className="text-lg" aria-hidden="true" /> 下一集
                </button>
              )}
              {episodesCollapsed && (
                <button type="button" className="ui-button hidden lg:inline-flex" onClick={() => setEpisodesCollapsed(false)} aria-controls="episode-panel" aria-expanded="false">
                  <MaterialSymbolsChevronLeftRounded className="text-lg" aria-hidden="true" /> 显示选集
                </button>
              )}
            </div>
          </div>
        </section>

        <aside className="watch-sidebar">
          <EpisodeList
            episodes={videoDetail.episodes}
            episodesTitles={videoDetail.episodes_titles}
            currentEpisodeIndex={currentEpisodeIndex}
            onEpisodeClick={setCurrentEpisodeIndex}
            onCollapse={() => setEpisodesCollapsed(true)}
          />
        </aside>
      </div>

      <section aria-labelledby="video-info-heading" className="pt-4 sm:pt-5">
        <div className={`grid gap-6 ${actors.length > 0 ? "xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]" : ""}`}>
          <div className="flex min-w-0 gap-4 sm:gap-5">
            <div className="relative aspect-2/3 w-20 sm:w-24 shrink-0 self-start overflow-hidden rounded-xl bg-surface-active border border-line">
              <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-muted">
                <MaterialSymbolsMovieOutlineRounded className="text-3xl" />
              </div>
              {videoDetail.poster && (
                <Image alt={`${videoDetail.title}海报`} className="object-cover" src={videoDetail.poster} fill sizes="96px" unoptimized onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="video-info-heading" className="text-base font-semibold text-ink">剧情简介</h2>
              {videoDetail.genre && <p className="mt-1 text-xs text-muted">{videoDetail.genre}</p>}
              <p id="video-description" className={`mt-3 text-sm leading-7 text-muted break-words ${descExpanded ? "" : "line-clamp-3"}`}>
                {videoDetail.desc || "暂无剧情简介。"}
              </p>
              {videoDetail.desc && (
                <button type="button" onClick={() => setDescExpanded((value) => !value)} className="mt-1 flex min-h-11 items-center gap-1 rounded-md text-xs font-medium text-primary-dark cursor-pointer" aria-expanded={descExpanded} aria-controls="video-description">
                  {descExpanded ? "收起简介" : "展开简介"}
                  <MaterialSymbolsChevronRightRounded className={`text-base transition-transform duration-150 ${descExpanded ? "-rotate-90" : "rotate-90"}`} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {actors.length > 0 && (
            <div className="min-w-0 pt-2 xl:pt-0 xl:pl-6">
              <h2 className="flex items-baseline gap-2 text-base font-semibold text-ink">演员 <span className="text-xs font-normal text-muted">{actors.length} 位</span><span className="ml-auto text-xs font-normal text-muted">横向浏览</span></h2>
              <ul aria-label="演员列表" tabIndex={0} data-player-shortcut-exempt className="mt-4 flex gap-4 overflow-x-auto custom-scrollbar pb-2 rounded-lg">
                {actors.map((actor, idx) => (
                  <li key={actor.id || idx} className="w-16 shrink-0">
                    <div className="relative w-14 h-18 overflow-hidden rounded-lg bg-surface-active border border-line">
                      <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-muted">
                        <MaterialSymbolsPerson2OutlineRounded className="text-2xl" />
                      </div>
                      {actor.avatar && actor.avatar !== "/placeholder-avatar.jpg" && (
                        <Image src={actor.avatar} alt="" fill sizes="56px" className="object-cover" unoptimized onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
                      )}
                    </div>
                    <p className="mt-2 text-xs leading-5 font-medium text-ink break-words">{actor.name}</p>
                    {actor.role && <p className="mt-0.5 text-xs leading-5 text-muted break-words">{actor.role}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <DanmakuSearchModal isOpen={showDanmakuModal} onClose={handleCloseDanmakuModal} initialTitle={videoDetail.title} onEpisodeConfirm={handleDanmakuEpisodeConfirm} />
    </div>
  );
}
