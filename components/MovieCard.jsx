"use client";

import Link from "next/link";
import { useState } from "react";
import * as m from "motion/react-m";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { pressSpring, reducedMotionQuery } from "@/lib/motion";
import { SpeedTestBadge } from "@/components/SpeedTestBadge";
import { MaterialSymbolsStarRounded, MaterialSymbolsMovieOutlineRounded, MaterialSymbolsPlayArrowRounded } from "@/components/icons";

import { useSettingsStore } from "@/store/useSettingsStore";
import { saveBrowseScrollPosition } from "@/store/useBrowseScrollStore";

export function MovieCard({ movie, remark, showSpeedTest = true, eager = false }) {
  const reduceMotion = useMediaQuery(reducedMotionQuery);
  const [failedPoster, setFailedPoster] = useState(null);
  const doubanImageProxy = useSettingsStore((state) => state.doubanImageProxy);

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

  const href = movie.source
    ? `/play/${movie.id}?source=${encodeURIComponent(movie.source)}`
    : `/search?q=${encodeURIComponent(movie.title)}`;

  return (
    <m.article
      whileHover={reduceMotion ? undefined : { y: -3 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      transition={pressSpring}
      className="group relative min-w-0 flex flex-col gap-2.5 rounded-xl focus-within:ring-2 focus-within:ring-primary-dark focus-within:ring-offset-4 focus-within:ring-offset-background-light"
    >
      <div className="relative w-full aspect-2/3 overflow-hidden rounded-xl bg-surface-active ring-1 ring-black/5 transition-[box-shadow] duration-200 group-hover:shadow-soft group-hover:ring-primary/50">
        <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-3 text-muted/70">
          <MaterialSymbolsMovieOutlineRounded className="text-3xl" />
          <span className="text-xs text-center line-clamp-2">{movie.title}</span>
        </div>
        {remark ? (
          <span className="pointer-events-none absolute top-2 right-2 z-20 max-w-[calc(100%_-_1rem)] truncate rounded-md bg-surface-light/95 px-2 py-1 text-xs font-medium text-ink" aria-label={`更新状态 ${remark}`} title={remark}>{remark}</span>
        ) : Number(movie.rating) > 0 && (
          <div className="pointer-events-none absolute top-2 right-2 bg-surface-light/95 text-ink text-xs font-semibold px-1.5 py-1 rounded-md flex items-center gap-0.5 z-20 shadow-card">
            <MaterialSymbolsStarRounded className="text-primary-dark text-[14px]" aria-hidden="true" />
            <span aria-label={`评分 ${movie.rating}`}>{movie.rating}</span>
          </div>
        )}
        {douban_image_url && failedPoster !== douban_image_url && (
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
            onError={() => setFailedPoster(douban_image_url)}
            className="relative w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
          />
        )}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-2 left-2 flex size-8 items-center justify-center rounded-full bg-surface-light text-ink opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200">
          <MaterialSymbolsPlayArrowRounded className="text-xl" />
        </div>
        {movie.doubanUrl && (
          <div className="absolute bottom-2 right-2 z-20">
            <a
              href={movie.doubanUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="group/douban flex size-11 items-end justify-end rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark"
              title="在豆瓣查看"
              aria-label={`在豆瓣查看 ${movie.title}`}
            >
              <span className="inline-flex h-6 items-center rounded-md bg-surface-light/95 px-2 text-[11px] font-medium leading-4 text-muted transition-colors group-hover/douban:bg-primary-soft group-hover/douban:text-primary-dark group-focus-visible/douban:bg-primary-soft group-focus-visible/douban:text-primary-dark">豆瓣</span>
            </a>
          </div>
        )}
        {movie.hongguoUrl && (
          <div className="absolute bottom-2 right-2 z-20">
            <a
              href={movie.hongguoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex min-h-11 items-center bg-surface-light/95 hover:bg-primary-soft text-ink text-xs px-2.5 rounded-md transition-colors"
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
        <h3 className="min-h-12 text-ink text-sm sm:text-[15px] font-medium leading-6 group-hover:text-primary-dark transition-colors" title={movie.title}>
          <Link href={href} prefetch={false} onNavigate={saveBrowseScrollPosition} className="line-clamp-2 before:absolute before:inset-0 before:z-10 before:rounded-xl focus-visible:outline-none">
            {movie.title}
          </Link>
        </h3>
        {(movie.year || movie.source_name) && <p className="mt-0.5 text-xs leading-5 text-muted truncate" title={[movie.year, movie.source_name].filter(Boolean).join(" · ")}>{[movie.year, movie.source_name].filter(Boolean).join(" · ")}</p>}
      </div>
    </m.article>
  );
};
