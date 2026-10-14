"use client";
import { useState, useEffect } from "react";
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
  MaterialSymbolsSmartphoneOutline,
  MaterialSymbolsAdd,
  MaterialSymbolsChevronLeftRounded,
  MaterialSymbolsChevronRightRounded,
  MaterialSymbolsCloseRounded,
} from "@/components/icons";

export default function Home() {
  const [mediaType, setMediaType] = useState("movie");
  const [currentTag, setCurrentTag] = useState("华语");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
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
    async function hydrateUserTags() {
      await Promise.resolve();
      const { movieTags: loadedMovieTags, tvTags: loadedTvTags } = loadUserTags();
      setMovieTags(loadedMovieTags);
      setTvTags(loadedTvTags);
    }

    hydrateUserTags();
  }, []);

  useEffect(() => {
    async function loadMovies() {
      setLoading(true);
      try {
        if (mediaType === "short") {
          const res = await fetch(`/api/hongguo?page_limit=${pageSize}&page_start=${page * pageSize}`);
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "获取红果短剧推荐失败");
          }
          const converted = (data.list || []).map((item) => ({
            id: item.title,
            title: item.title,
            poster: item.poster,
            rating: "暂无",
            hongguoUrl: item.hongguoUrl,
          }));
          setMovies(converted);
        } else {
          const data = await fetchRecommendations(mediaType, currentTag, pageSize, page * pageSize, doubanProxy);
          const converted = data.subjects.map(convertDoubanToMovie);
          setMovies(converted);
        }
      } catch (error) {
        console.error("加载失败:", error);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    }

    loadMovies();
  }, [mediaType, currentTag, page, doubanProxy]);

  useEffect(() => {
    if (!showTagModal) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setShowTagModal(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showTagModal]);

  const handleMediaTypeChange = (type) => {
    setMediaType(type);
    if (type === "movie") {
      setCurrentTag("华语");
    } else if (type === "tv") {
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

  const defaultTag = mediaType === "movie" ? "华语" : "国产剧";
  const rawTags = mediaType === "movie" ? movieTags : mediaType === "tv" ? tvTags : [];
  const currentTags = rawTags.includes(defaultTag) ? [defaultTag, ...rawTags.filter((t) => t !== defaultTag)] : rawTags;

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

        <div role="radiogroup" aria-label="内容类型" className="bg-gray-100 p-1 rounded-xl inline-flex items-center gap-0.5 max-w-full">
          <label className="cursor-pointer relative">
            <input className="peer sr-only" name="media-type" type="radio" value="movie" checked={mediaType === "movie"} onChange={() => handleMediaTypeChange("movie")} />
            <div className="media-toggle-btn px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg text-sm font-semibold text-gray-500 hover:text-gray-800 peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 flex items-center gap-1.5 sm:gap-2 transition-all">
              <MaterialSymbolsMovieOutlineRounded className="text-[18px]" aria-hidden="true" />
              电影
            </div>
          </label>
          <div className={`w-px h-4 bg-gray-300 ${mediaType === "movie" || mediaType === "tv" ? "opacity-0" : "opacity-100"} transition-opacity`}></div>
          <label className="cursor-pointer relative">
            <input className="peer sr-only" name="media-type" type="radio" value="tv" checked={mediaType === "tv"} onChange={() => handleMediaTypeChange("tv")} />
            <div className="media-toggle-btn px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg text-sm font-semibold text-gray-500 hover:text-gray-800 peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 flex items-center gap-1.5 sm:gap-2 transition-all">
              <MaterialSymbolsTvOutlineRounded className="text-[18px]" aria-hidden="true" />
              电视剧
            </div>
          </label>
          <div className={`w-px h-4 bg-gray-300 ${mediaType === "tv" || mediaType === "short" ? "opacity-0" : "opacity-100"} transition-opacity`}></div>
          <label className="cursor-pointer relative">
            <input className="peer sr-only" name="media-type" type="radio" value="short" checked={mediaType === "short"} onChange={() => handleMediaTypeChange("short")} />
            <div className="media-toggle-btn px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg text-sm font-semibold text-gray-500 hover:text-gray-800 peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 flex items-center gap-1.5 sm:gap-2 transition-all">
              <MaterialSymbolsSmartphoneOutline className="text-[18px]" aria-hidden="true" />
              短剧
            </div>
          </label>
        </div>
      </div>

      {/* Categories - 短剧模式不显示标签 */}
      {mediaType !== "short" && (
      <div className="w-full overflow-hidden relative group/scroll">
        <div className="flex gap-2 sm:gap-3 overflow-x-auto hide-scrollbar py-2 px-1 pr-16 snap-x" role="toolbar" aria-label="分类标签">
          <button
            onClick={() => setShowTagModal(true)}
            className="shrink-0 px-4 sm:px-5 py-2.5 sm:py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all bg-white border border-dashed border-gray-300 text-gray-600 hover:border-primary hover:text-gray-900 cursor-pointer btn-press flex items-center"
          >
            <MaterialSymbolsAdd className="text-[16px] mr-1" />
            管理标签
          </button>
          {currentTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              aria-pressed={tag === currentTag}
              className={`shrink-0 snap-start px-4 sm:px-5 py-2.5 sm:py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer btn-press ${
                tag === currentTag
                  ? "bg-primary border border-primary text-white font-semibold shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <div aria-hidden="true" className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-linear-to-l from-background-light to-transparent pointer-events-none"></div>
      </div>
      )}

      {/* Popular Section */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 min-w-0">
            <span className="w-1 h-6 bg-primary rounded-full shrink-0" aria-hidden="true"></span>
            <span className="truncate">
            {mediaType === "short" ? "红果短剧 - 热门推荐" : `豆瓣热门 - ${currentTag}`}</span>
          </h2>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {page > 0 && <span className="text-xs text-gray-400 tabular-nums mr-1">第 {page + 1} 页</span>}
            <button
              onClick={handlePrevPage}
              disabled={page === 0}
              className={`flex items-center justify-center size-11 sm:size-9 rounded-lg border transition-all btn-press ${
                page === 0 ? "border-gray-200 text-gray-300 cursor-not-allowed opacity-50" : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-primary hover:text-primary cursor-pointer"
              }`}
              title="上一页"
              aria-label="上一页"
            >
              <MaterialSymbolsChevronLeftRounded className="text-[20px]" />
            </button>
            <button
              onClick={handleNextPage}
              disabled={loading || movies.length < pageSize}
              className={`flex items-center justify-center size-11 sm:size-9 rounded-lg border transition-all btn-press ${
                loading || movies.length < pageSize
                  ? "border-gray-200 text-gray-300 cursor-not-allowed opacity-50"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-primary hover:text-primary cursor-pointer"
              }`}
              title="下一页"
              aria-label="下一页"
            >
              <MaterialSymbolsChevronRightRounded className="text-[20px]" />
            </button>
          </div>
        </div>

        {loading ? (
          <div aria-busy="true" aria-label="加载中" className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 lg:gap-6">
            {Array.from({ length: pageSize }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-gray-400">
            <MaterialSymbolsMovieOutlineRounded className="text-4xl" aria-hidden="true" />
            <p className="text-sm">暂时没有内容，请稍后重试或切换分类</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 lg:gap-6">
            {movies.map((movie, index) => (
              <div key={movie.id} className="grid-item-animate">
                <MovieCard movie={movie} eager={index < 6} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Continue Watching Section */}
      {playHistory && playHistory.length > 0 && <ContinueWatching playHistory={playHistory} />}

      {/* Tag Management Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-end sm:items-center justify-center z-[60] modal-backdrop-enter" onClick={() => setShowTagModal(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="tag-modal-title" className="glass-panel rounded-t-3xl sm:rounded-2xl px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6 max-w-md w-full sm:mx-4 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain custom-scrollbar modal-content-enter" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle sm:hidden mb-2" aria-hidden="true" />
            <div className="flex items-center justify-between mb-4">
              <h3 id="tag-modal-title" className="text-lg sm:text-xl font-bold text-gray-900">标签管理 ({mediaType === "movie" ? "电影" : "电视剧"})</h3>
              <button onClick={() => setShowTagModal(false)} aria-label="关闭" className="flex items-center justify-center size-11 sm:size-8 -mr-2 sm:mr-0 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors btn-press">
                <MaterialSymbolsCloseRounded />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-700">当前标签</h4>
                <button onClick={handleResetTags} className="text-xs px-3 py-1 min-h-9 sm:min-h-0 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-colors btn-press">
                  恢复默认
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentTags.map((tag) => (
                  <div key={tag} className="group bg-white text-gray-700 ring-1 ring-gray-200 py-1.5 pl-3 pr-1.5 sm:px-3 rounded-lg text-sm font-medium flex items-center gap-1 sm:gap-2">
                    <span>{tag}</span>
                    {tag !== "热门" && (
                      <button onClick={() => handleDeleteTag(tag)} aria-label={`删除标签 ${tag}`} className="flex items-center justify-center size-8 sm:size-auto -my-1 sm:my-0 rounded-md text-gray-400 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer btn-press">
                        <MaterialSymbolsCloseRounded className="text-[16px]" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-900/[0.06] pt-4">
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
                  aria-label="新标签名称"
                  autoFocus
                  autoComplete="off"
                  placeholder="输入标签名称..."
                  className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-5 sm:px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors btn-press">
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
