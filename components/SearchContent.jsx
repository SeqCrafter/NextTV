"use client";

import { useState, useEffect, useCallback, useEffectEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MovieCard } from "@/components/MovieCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { SearchBox } from "@/components/SearchBox";
import { Pagination } from "@/components/Pagination";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSearchScrollStore } from "@/store/useSearchScrollStore";
import { searchVideos } from "@/lib/cmsApi";
import {
  MaterialSymbolsSearchRounded,
  MaterialSymbolsGridViewOutlineRounded,
  MaterialSymbolsMovieOutlineRounded,
  MaterialSymbolsTvOutlineRounded,
  MaterialSymbolsSmartphoneOutline,
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
      window.scrollTo({ top: 0, behavior: "smooth" });
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <MaterialSymbolsSearchRounded className="text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500">{error}</p>
        </div>
      );
    }

    if (query && results.length > 0) {
      return (
        <>
          <div className="mb-6">
            <h2 className="text-xl text-gray-500 font-medium">
              找到 {filteredResults.length} 个关于{" "}
              <span className="text-gray-900 font-bold text-2xl mx-1">
                &quot;{query}&quot;
              </span>{" "}
              的结果
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredResults.map((movie, index) => (
              <div
                key={`${movie.source}-${movie.id}`}
                className="grid-item-animate"
              >
                <MovieCard movie={movie} />
              </div>
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
      <div className="flex flex-col items-center justify-center py-20">
        <MaterialSymbolsSearchRounded className="text-6xl text-gray-300 mb-4" />
        <p className="text-gray-500">请输入关键词开始搜索</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl flex flex-col gap-8 pt-6 page-enter">
      <div className="flex flex-col items-center justify-start gap-6 w-full max-w-3xl mx-auto">
        <SearchBox key={query} initialValue={query} />

        <div className="bg-gray-100 p-1 rounded-lg inline-flex items-center gap-0.5">
          <label className="cursor-pointer relative">
            <input
              className="peer sr-only"
              name="media-type"
              type="radio"
              value="all"
              checked={mediaType === "all"}
              onChange={(e) => setMediaType(e.target.value)}
            />
            <div className="media-toggle-btn px-6 py-2 rounded-lg text-sm font-semibold text-gray-500 peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-sm flex items-center gap-2 transition-all">
              <MaterialSymbolsGridViewOutlineRounded className="text-[18px]" />
              全部
            </div>
          </label>
          <div className={`w-px h-4 bg-gray-300 ${mediaType === "all" || mediaType === "movie" ? "opacity-0" : "opacity-100"} transition-opacity`}></div>
          <label className="cursor-pointer relative">
            <input
              className="peer sr-only"
              name="media-type"
              type="radio"
              value="movie"
              checked={mediaType === "movie"}
              onChange={(e) => setMediaType(e.target.value)}
            />
            <div className="media-toggle-btn px-6 py-2 rounded-lg text-sm font-semibold text-gray-500 peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-sm flex items-center gap-2 transition-all">
              <MaterialSymbolsMovieOutlineRounded className="text-[18px]" />
              电影
            </div>
          </label>
          <div className={`w-px h-4 bg-gray-300 ${mediaType === "movie" || mediaType === "tv" ? "opacity-0" : "opacity-100"} transition-opacity`}></div>
          <label className="cursor-pointer relative">
            <input
              className="peer sr-only"
              name="media-type"
              type="radio"
              value="tv"
              checked={mediaType === "tv"}
              onChange={(e) => setMediaType(e.target.value)}
            />
            <div className="media-toggle-btn px-6 py-2 rounded-lg text-sm font-semibold text-gray-500 peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-sm flex items-center gap-2 transition-all">
              <MaterialSymbolsTvOutlineRounded className="text-[18px]" />
              电视剧
            </div>
          </label>
          <div className={`w-px h-4 bg-gray-300 ${mediaType === "tv" || mediaType === "short" ? "opacity-0" : "opacity-100"} transition-opacity`}></div>
          <label className="cursor-pointer relative">
            <input
              className="peer sr-only"
              name="media-type"
              type="radio"
              value="short"
              checked={mediaType === "short"}
              onChange={(e) => setMediaType(e.target.value)}
            />
            <div className="media-toggle-btn px-6 py-2 rounded-lg text-sm font-semibold text-gray-500 peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-sm flex items-center gap-2 transition-all">
              <MaterialSymbolsSmartphoneOutline className="text-[18px]" />
              短剧
            </div>
          </label>
        </div>
      </div>

      {/* 视频源标签过滤 */}
      {query && enabledSources.length > 0 && (
        <div className="w-full overflow-hidden relative">
          <div className="flex gap-3 overflow-x-auto hide-scrollbar py-2 px-1">
            {enabledSources.map((source) => (
              <button
                key={source.key}
                onClick={() => handleSourceChange(source.key)}
                className={`shrink-0 px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer btn-press ${
                  source.key === sourceFilter
                    ? "bg-primary/10 border border-primary text-primary font-semibold hover:bg-primary hover:text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {source.name}
              </button>
            ))}
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-linear-to-l from-background-light to-transparent pointer-events-none"></div>
        </div>
      )}

      <div>{renderContent()}</div>
    </div>
  );
}
