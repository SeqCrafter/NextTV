"use client";

import { useRouter } from "next/navigation";
import { SpeedTestBadge } from "@/components/SpeedTestBadge";
import { MaterialSymbolsStarRounded } from "@/components/icons";

import { useSettingsStore } from "@/store/useSettingsStore";
import { useSearchScrollStore } from "@/store/useSearchScrollStore";

export function MovieCard({ movie, showSpeedTest = true, eager = false }) {
  const router = useRouter();
  const doubanImageProxy = useSettingsStore((state) => state.doubanImageProxy);
  const clearScrollPosition = useSearchScrollStore((state) => state.clearScrollPosition);

  let douban_image_url = movie.poster || "";

  // 只代理豆瓣的图片
  if (douban_image_url.includes("doubanio")) {
    if (doubanImageProxy === 'server') {
      // 使用本地 API 代理
      douban_image_url = `/api/douban/image?url=${encodeURIComponent(movie.poster)}`;
    } else {
      // 使用 CDN 替换
      douban_image_url = movie.poster.replace(
        /img\d+\.doubanio\.com/g,
        doubanImageProxy
      );
    }
  }

  const handleClick = () => {
    // 如果有 source 信息（从 API 搜索来的），则传递 source 参数到播放页面
    if (movie.source) {
      router.push(`/play/${movie.id}?source=${movie.source}`);
    } else {
      // 豆瓣卡片或红果卡片，跳转到搜索页面，使用 title 搜索
      clearScrollPosition();
      router.push(`/search?q=${encodeURIComponent(movie.title)}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={movie.title}
      className="group relative flex flex-col gap-2 sm:gap-3 cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="relative w-full aspect-2/3 overflow-hidden rounded-xl bg-gray-100 shadow-sm ring-1 ring-gray-200 transition-[box-shadow,transform] duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:ring-primary/50">
        {movie.rating && movie.rating !== "暂无" && (
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-black/60 backdrop-blur-md text-white text-[11px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md flex items-center gap-1 z-10">
            <MaterialSymbolsStarRounded className="text-primary text-[14px]" aria-hidden="true" />
            <span aria-label={`评分 ${movie.rating}`}>{movie.rating}</span>
          </div>
        )}
        {douban_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={douban_image_url}
            alt=""
            // 首屏第一行海报是 LCP 候选，立即加载并提高优先级；其余懒加载
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            decoding="async"
            referrerPolicy="no-referrer"
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {movie.source_name && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="bg-primary/90 text-white text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md font-medium shadow-sm">
              {movie.source_name}
            </span>
          </div>
        )}
        {movie.doubanUrl && (
          <div className="absolute bottom-2 right-2 z-10">
            <a
              href={movie.doubanUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="bg-black/70 hover:bg-black/90 text-white text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md transition-colors"
              title="在豆瓣查看"
              aria-label={`在豆瓣查看 ${movie.title}`}
            >
              豆瓣
            </a>
          </div>
        )}
        {movie.hongguoUrl && (
          <div className="absolute bottom-2 right-2 z-10">
            <a
              href={movie.hongguoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="bg-black/70 hover:bg-black/90 text-white text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md transition-colors"
              title="在红果查看"
              aria-label={`在红果查看 ${movie.title}`}
            >
              红果
            </a>
          </div>
        )}
        {showSpeedTest && movie.source && movie.source_url && (
          <SpeedTestBadge
            videoId={movie.id}
            sourceKey={movie.source}
            sourceName={movie.source_name}
            sourceUrl={movie.source_url}
          />
        )}
      </div>
      <div>
        <h3 className="text-gray-900 text-sm sm:text-base font-semibold leading-tight truncate group-hover:text-primary transition-colors" title={movie.title}>
          {movie.title}
        </h3>
      </div>
    </div>
  );
};
