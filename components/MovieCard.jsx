"use client";

import { useRouter } from "next/navigation";
import { SpeedTestBadge } from "@/components/SpeedTestBadge";

import { useSettingsStore } from "@/store/useSettingsStore";

export function MovieCard({ movie }) {
  const router = useRouter();
  const doubanImageProxy = useSettingsStore((state) => state.doubanImageProxy);

  let douban_image_url = movie.poster;

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
      // 如果没有 source（豆瓣卡片），跳转到搜索页面，使用 title 搜索
      router.push(`/search?q=${encodeURIComponent(movie.title)}`);
    }
  };

  return (
    <div
      className="group relative flex flex-col gap-3 cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative w-full aspect-2/3 overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-gray-200 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:ring-primary/50">
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 z-10">
          <span className="material-symbols-outlined text-primary text-[14px]">
            star
          </span>
          {movie.rating}
        </div>
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url('${douban_image_url}')` }}
          aria-label={`Poster for ${movie.title}`}
        ></div>
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <button className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">
              play_arrow
            </span>{" "}
            立即观看
          </button>
        </div>
        {movie.source_name && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="bg-primary/90 text-white text-xs px-2 py-1 rounded-md font-medium shadow-sm">
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
              className="bg-black/70 hover:bg-black/90 text-white text-xs px-2 py-1 rounded-md transition-colors"
              title="在豆瓣查看"
            >
              🔗 豆瓣
            </a>
          </div>
        )}
        {movie.source && movie.source_url && (
          <SpeedTestBadge
            videoId={movie.id}
            sourceKey={movie.source}
            sourceName={movie.source_name}
            sourceUrl={movie.source_url}
          />
        )}
      </div>
      <div>
        <h3 className="text-gray-900 text-base font-semibold leading-tight truncate group-hover:text-primary transition-colors">
          {movie.title}
        </h3>
      </div>
    </div>
  );
};
