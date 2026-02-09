"use client";
import { useState, useEffect, useCallback } from "react";
import { MovieCard } from "@/components/MovieCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ContinueWatching } from "@/components/ContinueWatching";
import { SearchBox } from "@/components/SearchBox";
import { usePlayHistoryStore } from "@/store/usePlayHistoryStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { fetchRecommendations, loadUserTags, saveUserTags, defaultMovieTags, defaultTvTags, convertDoubanToMovie } from "@/lib/doubanApi";
import {
  MaterialSymbolsMovieOutlineRounded,
  MaterialSymbolsTvOutlineRounded,
  MaterialSymbolsAdd,
  MaterialSymbolsChevronLeftRounded,
  MaterialSymbolsChevronRightRounded,
  MaterialSymbolsCloseRounded
} from "@/components/icons";

export default function Home() {
  const [mediaType, setMediaType] = useState("movie");
  const [currentTag, setCurrentTag] = useState("热门");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [movieTags, setMovieTags] = useState([]);
  const [tvTags, setTvTags] = useState([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const pageSize = 12;

  // 获取播放记录
  const playHistory = usePlayHistoryStore((state) => state.playHistory);
  // 获取豆瓣代理设置
  const doubanProxy = useSettingsStore((state) => state.doubanProxy);

  useEffect(() => {
    const { movieTags: loadedMovieTags, tvTags: loadedTvTags } = loadUserTags();
    setMovieTags(loadedMovieTags);
    setTvTags(loadedTvTags);
  }, []);

  const loadMovies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRecommendations(mediaType, currentTag, pageSize, page * pageSize, doubanProxy);
      const converted = data.subjects.map(convertDoubanToMovie);
      setMovies(converted);
    } catch (error) {
      console.error("加载失败:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [mediaType, currentTag, page, doubanProxy]);

  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  const handleMediaTypeChange = (type) => {
    setMediaType(type);
    if (type === "movie") {
      setCurrentTag("华语");
    } else {
      setCurrentTag("国产剧");
    }
    setPage(0);
  };

  const handleTagClick = (tag) => {
    setCurrentTag(tag);
    setPage(0);
  };

  const handlePrevPage = () => {
    if (page > 0) {
      setPage(page - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    setPage(page + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentTags = mediaType === "movie" ? movieTags : tvTags;

  const handleAddTag = (tagName) => {
    const trimmedTag = tagName.trim();
    if (!trimmedTag) return;

    if (mediaType === "movie") {
      if (movieTags.includes(trimmedTag)) {
        alert("标签已存在");
        return;
      }
      const newTags = [...movieTags, trimmedTag];
      setMovieTags(newTags);
      saveUserTags(newTags, tvTags);
    } else {
      if (tvTags.includes(trimmedTag)) {
        alert("标签已存在");
        return;
      }
      const newTags = [...tvTags, trimmedTag];
      setTvTags(newTags);
      saveUserTags(movieTags, newTags);
    }
  };

  const handleDeleteTag = (tag) => {
    if (tag === "热门") {
      alert("热门标签不能删除");
      return;
    }

    if (mediaType === "movie") {
      const newTags = movieTags.filter((t) => t !== tag);
      setMovieTags(newTags);
      saveUserTags(newTags, tvTags);
    } else {
      const newTags = tvTags.filter((t) => t !== tag);
      setTvTags(newTags);
      saveUserTags(movieTags, newTags);
    }

    if (currentTag === tag) {
      setCurrentTag("热门");
      setPage(0);
    }
  };

  const handleResetTags = () => {
    if (mediaType === "movie") {
      setMovieTags([...defaultMovieTags]);
      saveUserTags([...defaultMovieTags], tvTags);
    } else {
      setTvTags([...defaultTvTags]);
      saveUserTags(movieTags, [...defaultTvTags]);
    }
    setCurrentTag("热门");
    setPage(0);
  };

  return (
    <div className="w-full max-w-7xl flex flex-col gap-8 pt-6 page-enter">
      {/* Search Hero */}
      <div className="flex flex-col items-center justify-start gap-6 w-full max-w-3xl mx-auto">
        <SearchBox />

        <div className="bg-white p-1.5 rounded-xl inline-flex shadow-sm border border-gray-200">
          <label className="cursor-pointer relative">
            <input className="peer sr-only" name="media-type" type="radio" value="movie" checked={mediaType === "movie"} onChange={() => handleMediaTypeChange("movie")} />
            <div className="media-toggle-btn px-6 py-2 rounded-lg text-sm font-semibold text-gray-500 peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-md flex items-center gap-2">
              <MaterialSymbolsMovieOutlineRounded className="text-[18px]" />
              电影
            </div>
          </label>
          <label className="cursor-pointer relative">
            <input className="peer sr-only" name="media-type" type="radio" value="tv" checked={mediaType === "tv"} onChange={() => handleMediaTypeChange("tv")} />
            <div className="media-toggle-btn px-6 py-2 rounded-lg text-sm font-semibold text-gray-500 peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-md flex items-center gap-2">
              <MaterialSymbolsTvOutlineRounded className="text-[18px]" />
              电视剧
            </div>
          </label>
        </div>
      </div>

      {/* Categories */}
      <div className="w-full overflow-hidden relative group/scroll">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar py-2 px-1">
          <button
            onClick={() => setShowTagModal(true)}
            className="shrink-0 px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer btn-press flex items-center"
          >
            <MaterialSymbolsAdd className="text-[16px] mr-1" />
            管理标签
          </button>
          {currentTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`shrink-0 px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer btn-press ${tag === currentTag
                ? "bg-primary/10 border border-primary text-primary font-semibold hover:bg-primary hover:text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-linear-to-l from-background-light to-transparent pointer-events-none"></div>
      </div>

      {/* Popular Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full"></span>
            豆瓣热门 - {currentTag}
          </h2>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={page === 0}
              className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-all btn-press ${page === 0 ? "border-gray-200 text-gray-300 cursor-not-allowed opacity-50" : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-primary hover:text-primary cursor-pointer"
                }`}
              title="上一页"
            >
              <MaterialSymbolsChevronLeftRounded className="text-[20px]" />
            </button>
            <button
              onClick={handleNextPage}
              disabled={movies.length < pageSize}
              className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-all btn-press ${movies.length < pageSize
                ? "border-gray-200 text-gray-300 cursor-not-allowed opacity-50"
                : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-primary hover:text-primary cursor-pointer"
                }`}
              title="下一页"
            >
              <MaterialSymbolsChevronRightRounded className="text-[20px]" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-6">
            {Array.from({ length: pageSize }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-6">
            {movies.map((movie, index) => (
              <div key={movie.id} className="grid-item-animate">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Continue Watching Section */}
      {playHistory && playHistory.length > 0 && <ContinueWatching playHistory={playHistory} />}

      {/* Tag Management Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 modal-backdrop-enter" onClick={() => setShowTagModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto modal-content-enter" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">标签管理 ({mediaType === "movie" ? "电影" : "电视剧"})</h3>
              <button onClick={() => setShowTagModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors btn-press">
                <MaterialSymbolsCloseRounded />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-700">当前标签</h4>
                <button onClick={handleResetTags} className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-colors btn-press">
                  恢复默认
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentTags.map((tag) => (
                  <div key={tag} className="group bg-gray-100 text-gray-700 py-1.5 px-3 rounded-lg text-sm font-medium flex items-center gap-2">
                    <span>{tag}</span>
                    {tag !== "热门" && (
                      <button onClick={() => handleDeleteTag(tag)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer btn-press">
                        <MaterialSymbolsCloseRounded className="text-[16px]" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-700 mb-3">添加新标签</h4>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.target.elements.tagName;
                  handleAddTag(input.value);
                  input.value = "";
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  name="tagName"
                  placeholder="输入标签名称..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors btn-press">
                  添加
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
