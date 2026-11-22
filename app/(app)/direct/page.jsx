"use client";

import { useRetainedRoute } from "@/hooks/useRetainedRoute";
import { useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { VideoPlayerDirect } from "@/components/VideoPlayerDirect";
import { DanmakuSearch } from "@/components/DanmakuSearch";
import { LoadingSpinner } from "@/components/PlayerPageLoading";
import {
  MaterialSymbolsHomeOutlineRounded,
  MaterialSymbolsChevronLeftRounded,
  MaterialSymbolsChevronRightRounded,
  MaterialSymbolsPlayArrowRounded,
} from "@/components/icons";

export default function DirectPlayerPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DirectPlayerContent />
    </Suspense>
  );
}

function DirectPlayerContent() {
  const { searchParams } = useRetainedRoute();
  const playerurl = searchParams.get("playerurl");
  const title = searchParams.get("title") || "";
  const [searchTitle, setSearchTitle] = useState(null);
  const [searchPoster, setSearchPoster] = useState(null);
  const [searchEpisodeId, setSearchEpisodeId] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const handleAnimeSelect = useCallback((animeTitle, imageUrl) => {
    setSearchTitle(animeTitle);
    setSearchPoster(imageUrl);
  }, []);

  if (!playerurl) {
    return (
      <div className="w-full max-w-[1440px] pt-5 sm:pt-6 page-enter">
        <div className="empty-state watch-card min-h-80 sm:min-h-[420px]">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-[var(--color-primary)]" aria-hidden="true"><MaterialSymbolsPlayArrowRounded className="text-3xl" /></div>
          <h1 className="text-2xl font-semibold text-surface-light">还没有播放链接</h1>
          <p className="text-sm leading-7 text-surface-light/75">添加一个视频直链，就可以在这里观看。</p>
          <Link href="/direct-input" className="ui-button ui-button-primary mt-2">添加播放链接</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto pt-4 sm:pt-6 space-y-4 sm:space-y-5 page-enter">
      <nav aria-label="当前位置" className="flex min-h-11 items-center gap-2 text-xs sm:text-sm text-muted min-w-0">
        <Link href="/" className="flex min-h-11 items-center gap-1 hover:text-primary-dark transition-colors shrink-0">
          <MaterialSymbolsHomeOutlineRounded className="text-lg" aria-hidden="true" /> 首页
        </Link>
        <MaterialSymbolsChevronRightRounded className="text-base text-muted/60 shrink-0" aria-hidden="true" />
        <Link href="/direct-input" className="flex min-h-11 items-center hover:text-primary-dark transition-colors shrink-0">直链播放</Link>
        <MaterialSymbolsChevronRightRounded className="text-base text-muted/60 shrink-0" aria-hidden="true" />
        <span aria-current="page" className="truncate text-ink">{title || "视频播放"}</span>
      </nav>

      <div className="watch-layout" data-theater={panelCollapsed}>
        <section aria-label="视频播放" className="watch-card">
          <div className="watch-screen">
            <VideoPlayerDirect currentUrl={playerurl} searchTitle={title || searchTitle} searchPoster={searchPoster} searchEpisodeId={searchEpisodeId} />
          </div>
          <div className="watch-meta px-4 py-4 sm:px-5 sm:py-5 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-[22px] leading-snug font-semibold text-ink break-words">{title || searchTitle || "直链播放"}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="rounded-md bg-surface-active px-2 py-0.5 text-ink">直链</span>
                <span>{searchTitle ? `弹幕匹配：${searchTitle}` : "播放进度自动保存，下次接着看"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/direct-input" className="ui-button">更换链接</Link>
            {panelCollapsed && (
              <button type="button" className="ui-button hidden lg:inline-flex" onClick={() => setPanelCollapsed(false)} aria-controls="direct-danmaku-panel" aria-expanded="false">
                <MaterialSymbolsChevronLeftRounded className="text-lg" aria-hidden="true" /> 显示弹幕
              </button>
            )}
            </div>
          </div>
        </section>
        <aside className="watch-sidebar">
          <DanmakuSearch id="direct-danmaku-panel" initialTitle={title} onEpisodeSelect={setSearchEpisodeId} onAnimeSelect={handleAnimeSelect} onCollapse={() => setPanelCollapsed(true)} />
        </aside>
      </div>
    </div>
  );
}
