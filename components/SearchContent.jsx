"use client";

import { useState, useEffect, useCallback, useEffectEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MovieCard } from "@/components/MovieCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { SearchBox } from "@/components/SearchBox";
import { Pagination } from "@/components/Pagination";
import { MediaTypeSwitch } from "@/components/MediaTypeSwitch";
import { ResultItem } from "@/components/ResultItem";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSearchScrollStore } from "@/store/useSearchScrollStore";
import { useSearchHistoryStore } from "@/store/useSearchHistoryStore";
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
  const [retryCount, setRetryCount] = useState(0);
  const [mediaType, setMediaType] = useState("all"); // 'all', 'movie', 'tv'
  const [pageCount, setPageCount] = useState(1);
  const videoSources = useSettingsStore((state) => state.videoSources);
  const saveScrollPosition = useSearchScrollStore((state) => state.saveScrollPosition);
  const restoreScrollPosition = useSearchScrollStore((state) => state.restoreScrollPosition);
  const clearScrollPosition = useSearchScrollStore((state) => state.clearScrollPosition);
  const searchHistory = useSearchHistoryStore((state) => state.searchHistory);

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
    let cancelled = false;
    async function performSearch() {
      if (!query || !query.trim()) {
        setResults([]);
        setPageCount(1);
        setError(null);
        setLoading(false);
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
        if (cancelled) return;
        setResults(searchData.results);
        setPageCount(searchData.pageCount);

        if (searchData.failed) {
          setError("当前视频源暂时无法访问，请切换视频源或稍后重试。");
        } else if (searchData.results.length === 0) {
          setError("未找到匹配影片，可以切换视频源或换个关键词。");
        }

        // 数据加载完成后恢复滚动位置
        requestAnimationFrame(() => {
          if (cancelled) return;
          const savedY = restoreSavedScrollPosition();
          if (savedY > 0) {
            window.scrollTo(0, savedY);
          }
        });
      } catch (err) {
        if (cancelled) return;
        console.error("搜索错误:", err);
        setError("搜索失败，请稍后重试");
        setResults([]);
        setPageCount(1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    performSearch();
    return () => { cancelled = true; };
  }, [query, enabledSourceKeys, currentPage, sourceFilter, retryCount]);

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
    if (loading) {
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
            {query && !loading && !error && results.length > 0 && <span role="status" className="font-sans text-xs font-normal text-muted tabular-nums">本页 {filteredResults.length} 个结果</span>}
          </h1>
        </div>
        <SearchBox key={query} initialValue={query} onSearch={(value) => {
          const params = new URLSearchParams(searchParams);
          params.set("q", value);
          params.delete("page");
          if (sourceFilter) params.set("source", sourceFilter);
          router.push(`/search?${params.toString()}`);
          window.scrollTo({ top: 0, behavior: "instant" });
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
