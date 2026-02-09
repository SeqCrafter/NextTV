"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MovieCard } from "@/components/MovieCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { SearchBox } from "@/components/SearchBox";
import { useSettingsStore } from "@/store/useSettingsStore";
import { searchVideos } from "@/lib/cmsApi";
import {
  MaterialSymbolsSearchRounded,
  MaterialSymbolsGridViewOutlineRounded,
  MaterialSymbolsMovieOutlineRounded,
  MaterialSymbolsTvOutlineRounded
} from "@/components/icons";

export default function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaType, setMediaType] = useState("all"); // 'all', 'movie', 'tv'
  const [sourceFilter, setSourceFilter] = useState("all"); // 视频源筛选
  const videoSources = useSettingsStore((state) => state.videoSources);

  // 执行搜索
  useEffect(() => {
    async function performSearch() {
      if (!query || !query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const searchResults = await searchVideos(query, videoSources);
        setResults(searchResults);

        if (searchResults.length === 0) {
          setError("未找到相关结果，请尝试其他关键词");
        }
      } catch (err) {
        console.error("搜索错误:", err);
        setError("搜索失败，请稍后重试");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query, videoSources]);

  // 根据媒体类型和视频源过滤结果
  const filteredResults = results.filter((result) => {
    // 媒体类型筛选
    let matchMediaType = true;
    if (mediaType === "movie") {
      matchMediaType = result.type === "movie";
    } else if (mediaType === "tv") {
      matchMediaType = result.type === "tv";
    }

    // 视频源筛选
    let matchSource = true;
    if (sourceFilter !== "all") {
      matchSource = result.source === sourceFilter;
    }

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
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-xl text-gray-500 font-medium">
              找到 {filteredResults.length} 个关于{" "}
              <span className="text-gray-900 font-bold text-2xl mx-1">
                &quot;{query}&quot;
              </span>{" "}
              的结果
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>视频源：</span>
              <select
                className="bg-transparent border-none text-gray-900 font-medium focus:ring-0 cursor-pointer py-0 pr-8 pl-0"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="all">全部</option>
                {videoSources.map((source) => (
                  <option key={source.key} value={source.key}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>
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
        <SearchBox initialValue={query} />

        <div className="bg-white p-1.5 rounded-xl inline-flex shadow-sm border border-gray-200">
          <label className="cursor-pointer relative">
            <input
              className="peer sr-only"
              name="media-type"
              type="radio"
              value="all"
              checked={mediaType === "all"}
              onChange={(e) => setMediaType(e.target.value)}
            />
            <div className="media-toggle-btn px-6 py-2 rounded-lg text-sm font-semibold text-gray-500 peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-md flex items-center gap-2">
              <MaterialSymbolsGridViewOutlineRounded className="text-[18px]" />
              全部
            </div>
          </label>
          <label className="cursor-pointer relative">
            <input
              className="peer sr-only"
              name="media-type"
              type="radio"
              value="movie"
              checked={mediaType === "movie"}
              onChange={(e) => setMediaType(e.target.value)}
            />
            <div className="media-toggle-btn px-6 py-2 rounded-lg text-sm font-semibold text-gray-500 peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-md flex items-center gap-2">
              <MaterialSymbolsMovieOutlineRounded className="text-[18px]" />
              电影
            </div>
          </label>
          <label className="cursor-pointer relative">
            <input
              className="peer sr-only"
              name="media-type"
              type="radio"
              value="tv"
              checked={mediaType === "tv"}
              onChange={(e) => setMediaType(e.target.value)}
            />
            <div className="media-toggle-btn px-6 py-2 rounded-lg text-sm font-semibold text-gray-500 peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-md flex items-center gap-2">
              <MaterialSymbolsTvOutlineRounded className="text-[18px]" />
              电视剧
            </div>
          </label>
        </div>
      </div>

      <div>{renderContent()}</div>
    </div>
  );
}
