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
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [page, setPage] = useState(0);
  const [movieTags, setMovieTags] = useState([]);
  const [tvTags, setTvTags] = useState([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const pageSize = 12;
  const recommendationGridClassName = "content-grid";

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
    let cancelled = false;
    async function loadMovies() {
      setLoading(true);
      setLoadError("");
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
          if (!cancelled) setMovies(converted);
        } else {
          const data = await fetchRecommendations(mediaType, currentTag, pageSize, page * pageSize, doubanProxy);
          const converted = data.subjects.map(convertDoubanToMovie);
          if (!cancelled) setMovies(converted);
        }
      } catch (error) {
        if (cancelled) return;
        console.error("加载失败:", error);
        setMovies([]);
        setLoadError("推荐暂时未能加载，请重试或检查代理设置。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMovies();
    return () => { cancelled = true; };
  }, [mediaType, currentTag, page, doubanProxy, retryCount]);

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
    <div className="w-full max-w-[1440px] flex flex-col gap-5 sm:gap-6 pt-5 sm:pt-6 page-enter">
      <section aria-labelledby="discovery-heading" className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-8">
        <h1 id="discovery-heading" className="page-heading sr-only md:not-sr-only">发现影片</h1>
        <div className="w-full max-w-2xl md:ml-auto"><SearchBox /></div>
      </section>

      {playHistory && playHistory.length > 0 && <ContinueWatching playHistory={playHistory} />}

      <section aria-label="内容筛选" className="flex flex-col gap-2 xl:flex-row xl:items-center xl:gap-4">
        <div className="self-start"><MediaTypeSwitch value={mediaType} onChange={handleMediaTypeChange} /></div>

        {mediaType !== "short" && (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex flex-1 min-w-0 gap-1 overflow-x-auto custom-scrollbar py-1" role="toolbar" aria-label="分类标签">
              {currentTags.map((tag) => (
                <button type="button" key={tag} onClick={() => handleTagClick(tag)} aria-pressed={tag === currentTag} className="filter-chip btn-press">{tag}</button>
              ))}
            </div>
            <button type="button" onClick={() => setShowTagModal(true)} className="shrink-0 flex min-h-11 w-11 sm:w-auto items-center justify-center gap-1 rounded-lg px-2 text-xs text-muted hover:bg-surface-active hover:text-ink transition-colors cursor-pointer" aria-label="管理分类标签">
              <MaterialSymbolsAdd className="text-lg" aria-hidden="true" /><span className="hidden sm:inline">管理标签</span>
            </button>
          </div>
        )}
      </section>

      {/* Popular Section */}
      <section aria-labelledby="recommendation-heading">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="min-w-0">
            <h2 id="recommendation-heading" className="font-display text-lg sm:text-xl font-semibold text-ink">{mediaType === "short" ? "热门短剧" : "豆瓣片单"}</h2>
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
          <div role="status" className="empty-state">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary-dark" aria-hidden="true"><MaterialSymbolsMovieOutlineRounded className="text-2xl" /></div>
            <h3 className="font-display text-lg font-semibold text-ink">{loadError ? "推荐暂时不可用" : "这个分类还没有内容"}</h3>
            <p className="text-sm leading-7 text-muted">{loadError || "试试其他分类，或稍后再来看看。"}</p>
            {loadError && <button type="button" className="ui-button ui-button-primary" onClick={() => setRetryCount((count) => count + 1)}>重新加载</button>}
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
        className="glass-panel relative flex flex-col rounded-t-3xl sm:rounded-2xl px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6 max-w-md w-full sm:mx-4 max-h-[85dvh] sm:max-h-[90vh] overflow-hidden outline-none"
      >
            <div className="sheet-handle sm:hidden mb-2" aria-hidden="true" />
            <div className="flex shrink-0 items-center justify-between mb-4">
              <h3 id="tag-modal-title" className="text-lg font-semibold text-ink">分类标签 · {mediaType === "movie" ? "电影" : "电视剧"}</h3>
              <button onClick={() => setShowTagModal(false)} aria-label="关闭" className="ui-button ui-icon-button border-transparent bg-transparent text-muted btn-press">
                <MaterialSymbolsCloseRounded />
              </button>
            </div>

            <div className="mb-5 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-muted">当前标签</h4>
                <button onClick={handleResetTags} className="ui-button border-transparent bg-surface-active text-xs btn-press">
                  恢复默认
                </button>
              </div>
              <m.div layoutScroll className="relative flex flex-wrap gap-2">
                <AnimatePresence initial={false} mode="popLayout">
                {currentTags.map((tag) => (
                  <m.div layout="position" key={tag} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }} className="max-w-full bg-surface-active text-ink pl-3 pr-1 rounded-lg text-sm font-medium flex items-center gap-1">
                    <span className="min-w-0 truncate" title={tag}>{tag}</span>
                    {tag !== "热门" && (
                      <button onClick={() => handleDeleteTag(tag)} aria-label={`删除标签 ${tag}`} className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:text-rose-700 cursor-pointer btn-press">
                        <MaterialSymbolsCloseRounded className="text-[16px]" />
                      </button>
                    )}
                  </m.div>
                ))}
                </AnimatePresence>
              </m.div>
            </div>

            <div className="shrink-0 border-t border-line pt-4">
              <h4 className="text-sm font-medium text-ink mb-3">添加新标签</h4>
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
                  className="ui-input flex-1"
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
