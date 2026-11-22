"use client";

import { useState, useEffect, useRef, useEffectEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MovieCard } from "@/components/MovieCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { SearchBox } from "@/components/SearchBox";
import { Pagination } from "@/components/Pagination";
import { MediaTypeSwitch } from "@/components/MediaTypeSwitch";
import { ResultItem } from "@/components/ResultItem";
import { useSettingsStore } from "@/store/useSettingsStore";
import { pushBrowseRoute } from "@/store/useBrowseScrollStore";
import { useSearchHistoryStore } from "@/store/useSearchHistoryStore";
import { useBrowseScrollRestoration } from "@/hooks/useBrowseScrollRestoration";
import { useRetainedRoute } from "@/hooks/useRetainedRoute";
import { searchVideos } from "@/lib/cmsApi";
import {
  MaterialSymbolsSearchRounded,
} from "@/components/icons";

export default function SearchContent() {
  const { searchParams } = useRetainedRoute();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const pageParam = Number(searchParams.get("page"));
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const typeParam = searchParams.get("type");
  const mediaType = ["movie", "tv", "short"].includes(typeParam) ? typeParam : "all";
  const [pageCount, setPageCount] = useState(1);
  const [loadedSearchKey, setLoadedSearchKey] = useState(null);
  const completedSearchRef = useRef(null);
  const videoSources = useSettingsStore((state) => state.videoSources);
  const searchHistory = useSearchHistoryStore((state) => state.searchHistory);

  const getCurrentVideoSources = useEffectEvent(() => videoSources);

  // 只显示已激活的源
  const enabledSources = videoSources.filter((s) => s.enabled);
  // 稳定的依赖值，避免 Zustand hydration 引用变化触发重复请求
  const enabledSourceKeys = JSON.stringify(enabledSources.map((s) => [s.key, s.url]));
  // 从 URL 参数读取源过滤，默认为第一个激活源
  const sourceParam = searchParams.get("source");
  const sourceFilter = sourceParam && enabledSources.some((s) => s.key === sourceParam)
    ? sourceParam
    : enabledSources.length > 0 ? enabledSources[0].key : "";
  const invalidSource = Boolean(sourceParam) && sourceParam !== sourceFilter;
  const currentPage = !invalidSource && Number.isSafeInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const searchKey = JSON.stringify([query, enabledSourceKeys, currentPage, sourceFilter, retryCount]);
  const isLoading = Boolean(query.trim()) && Boolean(sourceFilter) && (
    loading || loadedSearchKey !== searchKey
  );
  useBrowseScrollRestoration(!isLoading);

  const setMediaType = (type) => {
    const params = new URLSearchParams(searchParams);
    if (type === "all") params.delete("type");
    else params.set("type", type);
    if (sourceFilter) params.set("source", sourceFilter);
    pushBrowseRoute(router, `/search?${params.toString()}`, { scroll: false });
  };

  function handlePageChange(page) {
    const params = new URLSearchParams(searchParams);
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    if (sourceFilter) params.set("source", sourceFilter);
    pushBrowseRoute(router, `/search?${params.toString()}`, { scroll: false });
  }

  function handleSourceChange(sourceKey) {
    const params = new URLSearchParams(searchParams);
    params.set("source", sourceKey);
    params.delete("page");
    pushBrowseRoute(router, `/search?${params.toString()}`, { scroll: false });
  }

  // 执行搜索
  useEffect(() => {
    // Activity re-runs effects on reveal; keep the already loaded list and its DOM.
    if (completedSearchRef.current === searchKey) return;
    const controller = new AbortController();
    async function performSearch() {
      if (!query || !query.trim()) {
        setResults([]);
        setPageCount(1);
        setError(null);
        setLoading(false);
        setLoadedSearchKey(searchKey);
        completedSearchRef.current = searchKey;
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
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setResults(searchData.results);
        const count = Number(searchData.pageCount);
        setPageCount(Number.isSafeInteger(count) && count > 0 ? count : 1);

        if (searchData.failed) {
          setError("当前视频源暂时无法访问，请切换视频源或稍后重试。");
        } else if (searchData.results.length === 0) {
          setError("未找到匹配影片，可以切换视频源或换个关键词。");
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("搜索错误:", err);
        setError("搜索失败，请稍后重试");
        setResults([]);
        setPageCount(1);
      } finally {
        if (!controller.signal.aborted) {
          completedSearchRef.current = searchKey;
          setLoadedSearchKey(searchKey);
          setLoading(false);
        }
      }
    }

    performSearch();
    return () => controller.abort();
  }, [query, currentPage, sourceFilter, searchKey]);

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
    if (query && enabledSources.length === 0) {
      return <div role="status" className="empty-state"><h2 className="font-display text-xl font-semibold text-ink">还没有启用的视频源</h2><p className="text-sm text-muted">启用一个视频源后，就可以搜索影片。</p><Link href="/settings" className="ui-button ui-button-primary">设置视频源</Link></div>;
    }
    if (isLoading) {
      return (
        <div aria-busy="true" aria-label="正在搜索影片" className="content-grid">
          {Array.from({ length: 12 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div role="status" className="empty-state">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary-dark" aria-hidden="true"><MaterialSymbolsSearchRounded className="text-2xl" /></div>
          <h2 className="font-display text-xl font-semibold text-ink">{error.startsWith("未找到") ? "没有找到匹配影片" : "搜索暂时不可用"}</h2>
          <p className="text-sm text-muted leading-7">{error}</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="ui-button">重新搜索</button>
        </div>
      );
    }

    if (query && results.length > 0) {
      return (
        <>
          {filteredResults.length === 0 && (
            <div className="empty-state">
              <p className="text-sm text-muted">当前分类暂无匹配影片，试试其他类型或视频源。</p>
              {mediaType !== "all" && <button type="button" className="ui-button mt-4" onClick={() => setMediaType("all")}>查看全部类型</button>}
            </div>
          )}
          <div className="content-grid">
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

    // Reuse actual history instead of filling the initial view with a large card.
    return (
      <div>
        {searchHistory.length > 0 && <section aria-labelledby="recent-searches-heading" className="mb-6"><h2 id="recent-searches-heading" className="font-display text-lg font-semibold text-ink mb-3">最近搜索</h2><div className="flex flex-wrap gap-2">{searchHistory.map((term) => <Link key={term} href={`/search?q=${encodeURIComponent(term)}`} className="ui-button max-w-full"><span className="truncate">{term}</span></Link>)}</div></section>}
        <div className="empty-state">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary-dark" aria-hidden="true"><MaterialSymbolsSearchRounded className="text-2xl" /></div>
          <h2 className="font-display text-xl font-semibold text-ink">从片名开始</h2>
          <p className="text-sm leading-7 text-muted">搜索电影、电视剧或短剧，也可以按视频源浏览。</p>
          <Link href="/source-browse" className="ui-button">浏览视频源</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] flex flex-col gap-5 sm:gap-6 pt-5 sm:pt-6 page-enter">
      <section aria-labelledby="search-heading" className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center">
        <div className="min-w-0">
          <h1 id="search-heading" className="page-heading flex flex-wrap items-baseline gap-3">
            {query ? "搜索结果" : "搜索影片"}
            {query && !isLoading && !error && results.length > 0 && <span role="status" className="font-sans text-xs font-normal text-muted tabular-nums">本页 {filteredResults.length} 个结果</span>}
          </h1>
        </div>
        <SearchBox key={query} initialValue={query} onSearch={(value) => {
          const params = new URLSearchParams(searchParams);
          params.set("q", value);
          params.delete("page");
          if (sourceFilter) params.set("source", sourceFilter);
          pushBrowseRoute(router, `/search?${params.toString()}`, { scroll: false });
        }} />
      </section>

      <section aria-label="搜索筛选" className="flex flex-col gap-2 xl:flex-row xl:items-center xl:gap-4">
        <div className="self-start"><MediaTypeSwitch value={mediaType} onChange={setMediaType} includeAll /></div>

        {query && enabledSources.length > 0 && (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="hidden sm:block text-xs text-muted shrink-0">视频源</span>
            <div aria-label="视频源筛选" className="flex flex-1 min-w-0 gap-1 overflow-x-auto custom-scrollbar py-1">
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
