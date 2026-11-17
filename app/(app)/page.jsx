"use client";
import { useState, useEffect } from "react";
import { MovieCard } from "@/components/MovieCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ContinueWatching } from "@/components/ContinueWatching";
import { SearchBox } from "@/components/SearchBox";
import { MediaTypeSwitch } from "@/components/MediaTypeSwitch";
import { ResultItem } from "@/components/ResultItem";
import { AnimatedDialog } from "@/components/AnimatedDialog";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { usePlayHistoryStore } from "@/store/usePlayHistoryStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { fetchRecommendations, loadUserTags, saveUserTags, defaultMovieTags, defaultTvTags, convertDoubanToMovie } from "@/lib/doubanApi";
import {
  MaterialSymbolsMovieOutlineRounded,
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
  const recommendationGridClassName = "mx-auto grid w-[92%] grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6";

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
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  };

  const handleNextPage = () => {
    setPage(page + 1);
    window.scrollTo({ top: 0, behavior: "auto" });
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
    <div className="w-full max-w-[1440px] flex flex-col gap-6 sm:gap-8 pt-6 sm:pt-8 page-enter">
      <section aria-labelledby="discovery-heading" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm sm:text-base font-medium text-primary-dark"><span aria-hidden="true" className="h-px w-5 bg-primary" /> 随时开启一段好时光</p>
          <h1 id="discovery-heading" className="text-[28px] sm:text-[34px] leading-snug tracking-tight font-semibold text-ink">发现好故事</h1>
          <p className="mt-2 text-sm leading-6 text-muted">电影、剧集与短剧，找到下一部想看的。</p>
        </div>
        <SearchBox />
      </section>

      {playHistory && playHistory.length > 0 && <ContinueWatching playHistory={playHistory} />}

      <section aria-label="内容筛选" className="surface-panel px-3 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MediaTypeSwitch value={mediaType} onChange={handleMediaTypeChange} />
          <p className="hidden md:block text-xs text-muted">{mediaType === "short" ? "红果热门短剧推荐" : "从豆瓣热门片单发现新内容"}</p>
        </div>

        {mediaType !== "short" && (
          <div className="mt-3 border-t border-line pt-3 flex items-start gap-2">
            <div className="flex flex-1 min-w-0 gap-1 overflow-x-auto hide-scrollbar sm:flex-wrap px-1 py-1" role="toolbar" aria-label="分类标签">
              {currentTags.map((tag) => (
                <button type="button" key={tag} onClick={() => handleTagClick(tag)} aria-pressed={tag === currentTag} className="filter-chip btn-press">{tag}</button>
              ))}
            </div>
            <button type="button" onClick={() => setShowTagModal(true)} className="mt-1 shrink-0 flex min-h-11 w-11 sm:w-auto items-center justify-center gap-1 rounded-lg px-2 text-xs text-muted hover:bg-surface-active hover:text-ink transition-colors cursor-pointer" aria-label="管理分类标签">
              <MaterialSymbolsAdd className="text-lg" aria-hidden="true" /><span className="hidden sm:inline">管理标签</span>
            </button>
          </div>
        )}
      </section>

      {/* Popular Section */}
      <section aria-labelledby="recommendation-heading">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="min-w-0">
            <h2 id="recommendation-heading" className="font-display text-lg sm:text-xl font-semibold text-ink">{mediaType === "short" ? "热门短剧" : "热门片单"}</h2>
            <p className="mt-1 text-xs text-muted truncate">{mediaType === "short" ? "红果短剧推荐" : `豆瓣推荐 · ${currentTag}`}</p>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted tabular-nums mr-1">第 {page + 1} 页</span>
            <button
              onClick={handlePrevPage}
              disabled={page === 0}
              className="ui-button ui-icon-button btn-press"
              title="上一页"
              aria-label="上一页"
            >
              <MaterialSymbolsChevronLeftRounded className="text-[20px]" aria-hidden="true" />
            </button>
            <button
              onClick={handleNextPage}
              disabled={loading || movies.length < pageSize}
              className="ui-button ui-icon-button btn-press"
              title="下一页"
              aria-label="下一页"
            >
              <MaterialSymbolsChevronRightRounded className="text-[20px]" aria-hidden="true" />
            </button>
          </div>
        </div>

        {loading ? (
          <div aria-busy="true" aria-label="加载中" className={recommendationGridClassName}>
            {Array.from({ length: pageSize }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div role="status" className="surface-panel flex flex-col items-center justify-center gap-3 py-14 px-5 text-center text-muted">
            <MaterialSymbolsMovieOutlineRounded className="text-4xl" aria-hidden="true" />
            <p className="text-sm">暂时没有内容，请稍后重试或切换分类</p>
          </div>
        ) : (
          <div className={recommendationGridClassName}>
            {movies.map((movie, index) => (
              <ResultItem key={movie.id} index={index}>
                <MovieCard movie={movie} eager={index < 6} />
              </ResultItem>
            ))}
          </div>
        )}
      </section>

      {/* Tag Management Modal */}
      <AnimatedDialog
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        labelledBy="tag-modal-title"
        initialFocusSelector='input[name="tagName"]'
        overlayClassName="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-end sm:items-center justify-center z-[60]"
        className="glass-panel relative rounded-t-3xl sm:rounded-2xl px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6 max-w-md w-full sm:mx-4 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain custom-scrollbar outline-none"
      >
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
              <m.div layoutScroll className="relative flex flex-wrap gap-2">
                <AnimatePresence initial={false} mode="popLayout">
                {currentTags.map((tag) => (
                  <m.div layout="position" key={tag} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }} className="group bg-white text-gray-700 ring-1 ring-gray-200 py-1.5 pl-3 pr-1.5 sm:px-3 rounded-lg text-sm font-medium flex items-center gap-1 sm:gap-2">
                    <span>{tag}</span>
                    {tag !== "热门" && (
                      <button onClick={() => handleDeleteTag(tag)} aria-label={`删除标签 ${tag}`} className="flex items-center justify-center size-8 sm:size-auto -my-1 sm:my-0 rounded-md text-gray-400 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer btn-press">
                        <MaterialSymbolsCloseRounded className="text-[16px]" />
                      </button>
                    )}
                  </m.div>
                ))}
                </AnimatePresence>
              </m.div>
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
                  autoComplete="off"
                  placeholder="输入标签名称..."
                  className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button type="submit" className="ui-button ui-button-primary btn-press">
                  添加
                </button>
              </form>
            </div>
      </AnimatedDialog>
    </div>
  );
}
