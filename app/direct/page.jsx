"use client";

import { useSearchParams } from "next/navigation";
import { useState, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { VideoPlayerDirect } from "@/components/VideoPlayerDirect";
import { DanmakuSearch } from "@/components/DanmakuSearch";
import {
  MaterialSymbolsHomeOutlineRounded,
  MaterialSymbolsChevronLeftRounded,
} from "@/components/icons";

export default function DirectPlayerPage() {
  return (
    <Suspense>
      <DirectPlayerContent />
    </Suspense>
  );
}

function DirectPlayerContent() {
  const searchParams = useSearchParams();
  const playerurl = searchParams.get("playerurl");
  const title = searchParams.get("title") || "";
  const poster = searchParams.get("poster") || "";

  const [searchEpisodeId, setSearchEpisodeId] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [fixedPlayerHeight, setFixedPlayerHeight] = useState(null);
  const playerWrapperRef = useRef(null);

  const handleCollapse = useCallback(() => {
    if (playerWrapperRef.current) {
      setFixedPlayerHeight(playerWrapperRef.current.offsetHeight);
    }
    setPanelCollapsed(true);
  }, []);

  const handleExpand = useCallback(() => {
    setPanelCollapsed(false);
    setFixedPlayerHeight(null);
  }, []);

  const handleEpisodeSelect = (episodeId) => {
    setSearchEpisodeId(episodeId);
  };

  if (!playerurl) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-lg text-slate-500 dark:text-slate-400">缺少播放地址参数</p>
          <Link href="/" className="text-primary hover:underline text-sm">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <nav aria-label="Breadcrumb" className="flex text-sm text-slate-500 dark:text-slate-400 mb-4 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-primary flex items-center gap-1 transition-colors">
          <MaterialSymbolsHomeOutlineRounded className="text-[18px]" /> 首页
        </Link>
        <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
        <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px]">
          {title || "直链播放"}
        </span>
      </nav>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 transition-all duration-300 items-stretch">
        {/* Left Column: Player */}
        <div className={`flex flex-col gap-4 transition-all duration-300 ${panelCollapsed ? "lg:col-span-12" : "lg:col-span-8 xl:col-span-9"}`}>
          <div
            ref={playerWrapperRef}
            className={`relative ${panelCollapsed ? "" : "aspect-video"}`}
            style={panelCollapsed && fixedPlayerHeight ? { height: fixedPlayerHeight } : undefined}
          >
            <VideoPlayerDirect
              currentUrl={playerurl}
              searchTitle={title}
              searchPoster={poster}
              searchEpisodeId={searchEpisodeId}
            />
            {panelCollapsed && (
              <button
                className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white/80 hover:text-white text-xs font-medium backdrop-blur-sm transition-all cursor-pointer"
                onClick={handleExpand}
                title="显示弹幕搜索"
              >
                <MaterialSymbolsChevronLeftRounded className="text-[16px]" />
                弹幕
              </button>
            )}
          </div>

          {/* Mobile Title Bar */}
          <div className="flex lg:hidden justify-between items-center px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-800">
            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {title || "直链播放"}
            </div>
            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-xs shrink-0 ml-2">
              直链
            </span>
          </div>
        </div>

        {/* Right Column: Danmaku Search */}
        <div className={`w-full lg:col-span-4 xl:col-span-3 flex flex-col h-full transition-all duration-300 ${panelCollapsed ? "hidden" : ""}`}>
          <DanmakuSearch
            initialTitle={title}
            onEpisodeSelect={handleEpisodeSelect}
            onCollapse={handleCollapse}
          />
        </div>
      </div>
    </div>
  );
}
