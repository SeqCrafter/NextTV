"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSettingsStore } from "@/store/useSettingsStore";
import { pushBrowseRoute } from "@/store/useBrowseScrollStore";
import { useBrowseScrollRestoration } from "@/hooks/useBrowseScrollRestoration";
import { useRetainedRoute } from "@/hooks/useRetainedRoute";
import { MovieCard } from "@/components/MovieCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { Pagination } from "@/components/Pagination";
import { Select } from "@/components/Select";
import { MaterialSymbolsVideoLibraryOutlineRounded } from "@/components/icons";

export default function SourceBrowsePage() {
  return (
    <Suspense fallback={<div className="w-full max-w-[1440px] py-6" role="status">正在加载视频源...</div>}>
      <SourceBrowseContent />
    </Suspense>
  );
}

function SourceBrowseContent() {
  const router = useRouter();
  const { searchParams } = useRetainedRoute();
  const videoSources = useSettingsStore((state) => state.videoSources);
  const activeSources = videoSources.filter((source) => source.enabled);

  const [sourceInfo, setSourceInfo] = useState(null);
  const completedSourceInfoRef = useRef(null);
  const completedVideosRef = useRef(null);

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedView, setLoadedView] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const [totalPages, setTotalPages] = useState(1);

  const sourceParam = searchParams.get("source");
  const selectedSource = activeSources.find((source) => source.key === sourceParam);
  const activeSource = selectedSource ?? activeSources[0];
  const activeSourceId = activeSource?.id ?? null;
  const invalidSource = Boolean(sourceParam) && !selectedSource;
  const activeCategoryId = invalidSource ? "all" : searchParams.get("category") || "all";
  const pageParam = Number(searchParams.get("page"));
  const page = !invalidSource && Number.isSafeInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const sourceUrl = activeSource?.url;
  const sourceInfoKey = JSON.stringify([sourceUrl, retryKey]);
  const videoKey = JSON.stringify([sourceUrl, activeCategoryId, page, retryKey]);
  const currentSourceInfo = sourceInfo?.sourceUrl === sourceUrl ? sourceInfo : null;
  const categories = currentSourceInfo?.categories ?? [{ type_id: "all", type_name: "全部" }];
  const totalVideos = currentSourceInfo?.totalVideos ?? null;
  // Only reveal results that belong to the current source, category, and page.
  const isLoading = Boolean(sourceUrl) && (
    loading || loadedView?.sourceUrl !== sourceUrl ||
    loadedView?.categoryId !== activeCategoryId || loadedView?.page !== page ||
    loadedView?.retryKey !== retryKey
  );
  useBrowseScrollRestoration(!isLoading && (!sourceUrl || Boolean(currentSourceInfo)));

  function changeView(sourceKey, categoryId, nextPage) {
    const params = new URLSearchParams(searchParams);
    params.set("source", sourceKey);
    if (categoryId === "all") params.delete("category");
    else params.set("category", categoryId);
    if (nextPage <= 1) params.delete("page");
    else params.set("page", String(nextPage));
    pushBrowseRoute(router, `/source-browse?${params.toString()}`, { scroll: false });
  }

  // Fetch categories and total info when source changes
  useEffect(() => {
    if (!sourceUrl || completedSourceInfoRef.current === sourceInfoKey) return;

    const controller = new AbortController();

    const fetchSourceInfo = async () => {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setSourceInfo(null);

      try {
        const proxyUrl = `/api/detail?apiUrl=${encodeURIComponent(sourceUrl)}`;
        const response = await fetch(proxyUrl, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (!data || data.error) throw new Error("Invalid source response");

        const total = typeof data.total === "number" || (typeof data.total === "string" && data.total.trim())
          ? Number(data.total)
          : NaN;
        setSourceInfo({
          sourceUrl,
          categories: [{ type_id: "all", type_name: "全部" }, ...(Array.isArray(data.class) ? data.class : [])],
          totalVideos: Number.isSafeInteger(total) && total >= 0 ? total : null,
          error: false,
        });
        completedSourceInfoRef.current = sourceInfoKey;
      } catch (error) {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          console.error("Failed to fetch source info:", error);
          setSourceInfo({ sourceUrl, totalVideos: null, error: true });
          completedSourceInfoRef.current = sourceInfoKey;
        }
      }
    };

    fetchSourceInfo();

    return () => controller.abort();
  }, [sourceUrl, sourceInfoKey]);

  // Fetch videos when source, category, or page changes
  useEffect(() => {
    if (!sourceUrl || completedVideosRef.current === videoKey) return;

    const controller = new AbortController();

    const fetchVideos = async () => {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setLoading(true);
      setVideoError(false);

      try {
        const fetchUrl = new URL(sourceUrl);
        fetchUrl.searchParams.set("ac", "detail");
        fetchUrl.searchParams.set("pg", String(page));
        if (activeCategoryId !== "all") {
          fetchUrl.searchParams.set("t", activeCategoryId);
        } else {
          fetchUrl.searchParams.delete("t");
        }

        const proxyUrl = `/api/detail?apiUrl=${encodeURIComponent(fetchUrl.toString())}`;
        const response = await fetch(proxyUrl, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (data?.error || !Array.isArray(data?.list)) throw new Error("Invalid video response");

        setVideos(data.list);
        const pageCount = Number(data.pagecount);
        setTotalPages(Number.isSafeInteger(pageCount) && pageCount > 0 ? pageCount : 1);
      } catch (error) {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          console.error("Failed to fetch videos:", error);
          setVideos([]);
          setTotalPages(1);
          setVideoError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          completedVideosRef.current = videoKey;
          setLoadedView({ sourceUrl, categoryId: activeCategoryId, page, retryKey });
          setLoading(false);
        }
      }
    };

    fetchVideos();

    return () => controller.abort();
  }, [sourceUrl, activeCategoryId, page, retryKey, videoKey]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1440px] bg-background-light py-4 sm:py-6">
      <header className="space-y-2">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <h1 className="shrink-0 text-2xl font-semibold leading-8 text-ink">源浏览</h1>
          {activeSource && (
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <label htmlFor="source-browse-source" className="sr-only">视频源</label>
              <Select
                id="source-browse-source"
                aria-label="视频源"
                value={String(activeSourceId)}
                options={activeSources.map((source) => ({ value: String(source.id), label: source.name }))}
                onChange={(value) => {
                  const source = activeSources.find((source) => String(source.id) === value);
                  if (!source) return;
                  changeView(source.key, "all", 1);
                }}
                size="compact"
                className="min-w-11 flex-1 sm:w-60 sm:flex-none"
              />
              <p aria-live="polite" aria-atomic="true" className="shrink-0 whitespace-nowrap text-xs text-muted tabular-nums sm:text-sm">
                {totalVideos !== null
                  ? `共 ${totalVideos.toLocaleString("zh-CN")} 部`
                  : !sourceUrl || currentSourceInfo?.error
                    ? "总数暂不可用"
                    : currentSourceInfo ? "总数未提供" : "总数加载中"}
              </p>
            </div>
          )}
        </div>

        {activeSource && (
          <div className="flex min-w-0 items-center gap-2">
            <div role="group" aria-label="视频分类" className="custom-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto py-1">
              {categories.map((category) => (
                <button
                  key={category.type_id}
                  type="button"
                  aria-pressed={String(activeCategoryId) === String(category.type_id)}
                  onClick={() => {
                    changeView(activeSource.key, String(category.type_id), 1);
                  }}
                  className="filter-chip min-h-11 min-w-11"
                >
                  {category.type_name === "首页" ? "全部" : category.type_name}
                </button>
              ))}
            </div>
            {currentSourceInfo?.error && (
              <button type="button" className="ui-button shrink-0" onClick={() => setRetryKey((key) => key + 1)}>
                重试分类
              </button>
            )}
          </div>
        )}
      </header>

      <section aria-label="视频列表" aria-busy={isLoading} className="mt-4 min-w-0 sm:mt-5">
        {!activeSource ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-light px-6 py-12 text-center">
            <MaterialSymbolsVideoLibraryOutlineRounded aria-hidden="true" className="mb-4 text-4xl text-muted" />
            <h2 className="text-lg font-semibold text-ink">还没有启用的视频源</h2>
            <p className="mt-2 text-sm text-muted">在设置中启用或添加视频源，即可浏览片库。</p>
            <Link href="/settings" className="ui-button ui-button-primary mt-5 text-ink">前往设置</Link>
          </div>
        ) : isLoading ? (
          <>
            <p role="status" className="sr-only">正在加载视频</p>
            <div className="content-grid min-w-0">
              {Array.from({ length: 12 }, (_, index) => (
                <div key={index} className="min-w-0"><SkeletonCard /></div>
              ))}
            </div>
          </>
        ) : videoError || !sourceUrl ? (
          <div role="alert" className="flex flex-col items-center justify-center rounded-2xl bg-surface-light px-6 py-12 text-center">
            <MaterialSymbolsVideoLibraryOutlineRounded aria-hidden="true" className="mb-4 text-4xl text-muted" />
            <h2 className="text-lg font-semibold text-ink">暂时无法加载视频</h2>
            <p className="mt-2 text-sm text-muted">
              {sourceUrl ? "视频源请求失败，请重试或切换其他视频源。" : "当前视频源缺少地址，请在设置中检查。"}
            </p>
            {sourceUrl ? (
              <button type="button" className="ui-button ui-button-primary mt-5 text-ink" onClick={() => setRetryKey((key) => key + 1)}>
                重新加载
              </button>
            ) : (
              <Link href="/settings" className="ui-button ui-button-primary mt-5 text-ink">前往设置</Link>
            )}
          </div>
        ) : videos.length > 0 ? (
          <>
            <div className="content-grid min-w-0">
              {videos.map((video, index) => (
                <div key={`${activeSourceId}-${video.vod_id}`} className="min-w-0">
                  <MovieCard
                    movie={{
                      id: video.vod_id,
                      title: video.vod_name,
                      poster: video.vod_pic,
                      rating: video.vod_score || "",
                      source: activeSource?.key,
                      source_name: activeSource?.name,
                      source_url: sourceUrl,
                    }}
                    remark={String(video.vod_remarks || "")}
                    showSpeedTest={false}
                    eager={index < 6}
                  />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination currentPage={page} pageCount={totalPages} onPageChange={(nextPage) => changeView(activeSource.key, activeCategoryId, nextPage)} />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-light px-6 py-12 text-center">
            <MaterialSymbolsVideoLibraryOutlineRounded aria-hidden="true" className="mb-4 text-4xl text-muted" />
            <h2 className="text-lg font-semibold text-ink">该分类下暂无视频</h2>
            <p className="mt-2 text-sm text-muted">可以切换分类或视频源继续浏览。</p>
          </div>
        )}
      </section>
    </div>
  );
}
