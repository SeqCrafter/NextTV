"use client";

import { useState, useEffect, useMemo } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { MovieCard } from "@/components/MovieCard";
import { Pagination } from "@/components/Pagination";
import { 
  MaterialSymbolsMovieOutlineRounded, 
  MaterialSymbolsVideoLibraryOutlineRounded,
  MaterialSymbolsCheckRounded
} from "@/components/icons";

export default function SourceBrowsePage() {
  const videoSources = useSettingsStore((state) => state.videoSources);
  const activeSources = useMemo(() => videoSources.filter(s => s.enabled), [videoSources]);

  const [selectedSourceId, setSelectedSourceId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);

  const activeSourceId = activeSources.some((source) => source.id === selectedSourceId)
    ? selectedSourceId
    : activeSources[0]?.id ?? null;
  const activeSource = useMemo(() => activeSources.find(s => s.id === activeSourceId), [activeSources, activeSourceId]);

  useEffect(() => {
    async function resetSourceView() {
      await Promise.resolve();
      setActiveCategoryId("all");
      setPage(1);
    }

    resetSourceView();
  }, [activeSourceId]);

  // Fetch categories and total info when source changes
  useEffect(() => {
    if (!activeSource?.url) return;

    const controller = new AbortController();

    const fetchSourceInfo = async () => {
      try {
        const proxyUrl = `/api/detail?apiUrl=${encodeURIComponent(activeSource.url)}`;
        const response = await fetch(proxyUrl, { signal: controller.signal });
        const data = await response.json();
        
        if (data.class) {
          setCategories([{ type_id: "all", type_name: "首页" }, ...data.class]);
        }
        if (data.total) {
          setTotalVideos(data.total);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Failed to fetch source info:", error);
        }
      }
    };

    fetchSourceInfo();
    
    return () => controller.abort();
  }, [activeSource?.url]);

  // Fetch videos when source, category, or page changes
  useEffect(() => {
    if (!activeSource?.url) return;

    const controller = new AbortController();

    const fetchVideos = async () => {
      setLoading(true);
      try {
        let fetchUrl = `${activeSource.url}?ac=detail&pg=${page}`;
        if (activeCategoryId !== "all") {
          fetchUrl += `&t=${activeCategoryId}`;
        }
        
        const proxyUrl = `/api/detail?apiUrl=${encodeURIComponent(fetchUrl)}`;
        const response = await fetch(proxyUrl, { signal: controller.signal });
        const data = await response.json();
        
        if (data.list) {
          setVideos(data.list);
        } else {
          setVideos([]);
        }
        
        if (data.pagecount) {
          setTotalPages(data.pagecount);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Failed to fetch videos:", error);
          setVideos([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();

    return () => controller.abort();
  }, [activeSource?.url, activeCategoryId, page]);

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Options */}
        <section>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">源浏览</h1>
          
          {/* Source Selector */}
          <div className="flex flex-wrap gap-4 mb-8">
            {activeSources.map(source => (
              <button
                key={source.id}
                onClick={() => setSelectedSourceId(source.id)}
                className={`shrink-0 flex items-center justify-between gap-4 px-6 py-4 rounded-xl border transition-all min-w-[240px] cursor-pointer ${
                  activeSourceId === source.id
                    ? 'border-primary ring-1 ring-primary bg-white shadow-sm'
                    : 'border-gray-200 bg-white hover:border-primary/50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${activeSourceId === source.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <MaterialSymbolsMovieOutlineRounded className="text-xl" />
                  </div>
                  <div className="text-left">
                    <h3 className={`font-semibold text-base ${activeSourceId === source.id ? 'text-gray-900' : 'text-gray-700'}`}>
                      {source.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {activeSourceId === source.id && totalVideos > 0 
                        ? `共 ${totalVideos.toLocaleString()} 个视频` 
                        : "浏览此源"}
                    </p>
                  </div>
                </div>
                {activeSourceId === source.id && (
                  <div className="bg-primary text-white rounded-full p-0.5">
                    <MaterialSymbolsCheckRounded className="text-sm" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Category Selector */}
          {categories.length > 0 && (
             <div className="flex flex-wrap gap-3 items-center mb-8 pb-4 border-b border-gray-200/60">
              {categories.map(category => (
                <button
                  key={category.type_id}
                  onClick={() => {
                    setActiveCategoryId(category.type_id);
                    setPage(1);
                  }}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                    activeCategoryId === category.type_id
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {category.type_name === '首页' ? '全部' : category.type_name}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Video Grid */}
        <section>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : videos.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {videos.map(video => (
                  <MovieCard
                    key={video.vod_id}
                    movie={{
                      id: video.vod_id,
                      title: video.vod_name,
                      poster: video.vod_pic,
                      rating: video.vod_remarks || video.vod_score || "",
                      source: activeSource?.key,
                      source_name: activeSource?.name,
                      source_url: activeSource?.url
                    }}
                    showSpeedTest={false}
                  />
                ))}
              </div>
              
              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  pageCount={totalPages}
                  onPageChange={setPage}
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <MaterialSymbolsVideoLibraryOutlineRounded className="text-6xl text-gray-300 mb-4" />
              <p>该分类下暂无视频</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
