"use client";

import { useState, useEffect, useCallback, useEffectEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MovieCard } from "@/components/MovieCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { SearchBox } from "@/components/SearchBox";
import { Pagination } from "@/components/Pagination";
import { MediaTypeSwitch } from "@/components/MediaTypeSwitch";
import { ResultItem } from "@/components/ResultItem";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSearchScrollStore } from "@/store/useSearchScrollStore";
import { searchVideos } from "@/lib/cmsApi";
import {
  MaterialSymbolsSearchRounded,
} from "@/components/icons";

export default function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const currentPage = Number(searchParams.get("page")) || 1;
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaType, setMediaType] = useState("all"); // 'all', 'movie', 'tv'
  const [pageCount, setPageCount] = useState(1);
  const videoSources = useSettingsStore((state) => state.videoSources);
  const saveScrollPosition = useSearchScrollStore((state) => state.saveScrollPosition);
  const restoreScrollPosition = useSearchScrollStore((state) => state.restoreScrollPosition);
  const clearScrollPosition = useSearchScrollStore((state) => state.clearScrollPosition);

  const getCurrentVideoSources = useEffectEvent(() => videoSources);
  const restoreSavedScrollPosition = useEffectEvent(() => restoreScrollPosition());

  // 只显示已激活的源
  const enabledSources = videoSources.filter((s) => s.enabled);
  // 稳定的依赖值，避免 Zustand hydration 引用变化触发重复请求
  const enabledSourceKeys = enabledSources.map((s) => s.key).join(",");
  // 从 URL 参数读取源过滤，默认为第一个激活源
  const sourceParam = searchParams.get("source");
  const sourceFilter = sourceParam && enabledSources.some((s) => s.key === sourceParam)
    ? sourceParam
    : enabledSources.length > 0 ? enabledSources[0].key : "";

  const handlePageChange = useCallback(
    (page) => {
      const params = new URLSearchParams(searchParams);
      if (page <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(page));
      }
      clearScrollPosition();
      router.push(`/search?${params.toString()}`);
      window.scrollTo({ top: 0, behavior: "auto" });
    },
    [searchParams, router, clearScrollPosition],
  );

  const handleSourceChange = useCallback(
    (sourceKey) => {
      const params = new URLSearchParams(searchParams);
      params.set("source", sourceKey);
      params.delete("page");
      clearScrollPosition();
      router.push(`/search?${params.toString()}`);
    },
    [searchParams, router, clearScrollPosition],
  );

  // 持续监听滚动事件，保存滚动位置（防抖）
  // 不能只在 unmount 时保存，因为 Next.js 页面切换时 window.scrollY 可能已被重置为 0
  useEffect(() => {
    let timer;
    const handleScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        saveScrollPosition();
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [saveScrollPosition]);

  // 执行搜索
  useEffect(() => {
    async function performSearch() {
      if (!query || !query.trim()) {
        setResults([]);
        setPageCount(1);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const searchData = await searchVideos(
          query,
          getCurrentVideoSources(),
          currentPage,
          sourceFilter || undefined,
        );
        setResults(searchData.results);
        setPageCount(searchData.pageCount);

        if (searchData.results.length === 0) {
          setError("未找到相关结果，请尝试其他关键词");
        }

        // 数据加载完成后恢复滚动位置
        requestAnimationFrame(() => {
          const savedY = restoreSavedScrollPosition();
          if (savedY > 0) {
            window.scrollTo(0, savedY);
          }
        });
      } catch (err) {
        console.error("搜索错误:", err);
        setError("搜索失败，请稍后重试");
        setResults([]);
        setPageCount(1);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query, enabledSourceKeys, currentPage, sourceFilter]);

  // 根据媒体类型和视频源过滤结果
  const filteredResults = results.filter((result) => {
    // 媒体类型筛选
    let matchMediaType = true;
    if (mediaType === "movie") {
      matchMediaType = result.type === "movie";
    } else if (mediaType === "tv") {
      matchMediaType = result.type === "tv";
    } else if (mediaType === "short") {
      matchMediaType = result.type === "short";
    }

    // 视频源筛选
    const matchSource = sourceFilter ? result.source === sourceFilter : true;

    return matchMediaType && matchSource;
  });

  // Render content based on search state - clearer than nested ternaries
  function renderContent() {
    if (loading) {
      return (
        <div aria-busy="true" aria-label="正在搜索影片" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 lg:gap-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div role="status" className="surface-panel flex flex-col items-center justify-center py-14 px-5 text-center">
          <MaterialSymbolsSearchRounded className="text-3xl text-muted/60 mb-3" aria-hidden="true" />
          <p className="text-sm text-muted leading-7">{error}</p>
        </div>
      );
    }

    if (query && results.length > 0) {
      return (
        <>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">匹配影片</h2>
            <p role="status" className="text-xs text-muted tabular-nums">本页 {filteredResults.length} 个结果</p>
          </div>

          {filteredResults.length === 0 && (
            <div className="surface-panel px-5 py-10 text-center">
              <p className="text-sm text-muted">当前分类暂无匹配影片，试试其他类型或视频源。</p>
              {mediaType !== "all" && <button type="button" className="ui-button mt-4" onClick={() => setMediaType("all")}>查看全部类型</button>}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 lg:gap-6">
            {filteredResults.map((movie, index) => (
              <ResultItem key={`${movie.source}-${movie.id}`} index={index}>
                <MovieCard movie={movie} eager={index < 6} />
              </ResultItem>
            ))}
          </div>

          {pageCount > 1 && (
            <Pagination
              currentPage={currentPage}
              pageCount={pageCount}
              onPageChange={handlePageChange}
            />
          )}
        </>
      );
    }

    // Empty state - no query or no results
    return (
      <div className="surface-panel flex flex-col items-center justify-center py-14 px-5 text-center">
        <MaterialSymbolsSearchRounded className="text-3xl text-muted/60 mb-3" aria-hidden="true" />
        <p className="text-sm text-muted">输入片名，搜索已启用的视频源。</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] flex flex-col gap-6 sm:gap-8 pt-6 sm:pt-8 page-enter">
      <section aria-labelledby="search-heading" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
        <div className="min-w-0">
          <h1 id="search-heading" className="text-[28px] sm:text-[34px] leading-snug tracking-tight font-semibold text-ink">{query ? "搜索结果" : "找一部想看的"}</h1>
          <p className="mt-2 text-sm text-muted break-words">{query ? <>关键词：<span className="font-medium text-ink">{query}</span></> : "输入片名，轻松发现电影、剧集与短剧。"}</p>
        </div>
        <SearchBox key={query} initialValue={query} />
      </section>

      <section aria-label="搜索筛选" className="surface-panel px-3 py-3 sm:px-5 sm:py-4">
        <MediaTypeSwitch value={mediaType} onChange={setMediaType} includeAll />

        {query && enabledSources.length > 0 && (
          <div className="mt-3 border-t border-line pt-3 flex items-center gap-3">
            <span className="hidden sm:block text-xs text-muted shrink-0">视频源</span>
            <div aria-label="视频源筛选" className="flex flex-1 min-w-0 gap-1 overflow-x-auto custom-scrollbar py-1 px-1">
              {enabledSources.map((source) => (
                <button type="button" key={source.key} onClick={() => handleSourceChange(source.key)} aria-pressed={source.key === sourceFilter} className="filter-chip btn-press">{source.name}</button>
              ))}
            </div>
          </div>
        )}
      </section>

      <div>{renderContent()}</div>
    </div>
  );
}
