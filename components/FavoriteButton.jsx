"use client";

import { useState } from "react";
import * as m from "motion/react-m";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { pressSpring, reducedMotionQuery } from "@/lib/motion";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { MaterialSymbolsFavoriteOutlineRounded } from "@/components/icons";

export function FavoriteButton({ source, id, videoDetail, className = "", showLabel = false }) {
  // 使用精确选择器：只选择当前item的收藏状态，避免不必要的重渲染
  const favoriteStateFromStore = useFavoritesStore((state) => state.favorites.some((fav) => fav.source === source && fav.id === id));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  // 本地乐观状态：用于立即响应用户点击
  const reduceMotion = useMediaQuery(reducedMotionQuery);
  const [isOptimistic, setIsOptimistic] = useState(null);

  // 使用本地乐观状态（如果有）或store状态
  const favoriteState = isOptimistic !== null ? isOptimistic : favoriteStateFromStore;

  // 处理收藏：使用乐观更新
  const handleToggleFavorite = () => {
    if (!videoDetail || !id || !source) return;

    // 1. 立即更新UI（乐观更新）
    const newState = !favoriteState;
    setIsOptimistic(newState);

    // 2. 异步更新store（这会触发localStorage写入）
    setTimeout(() => {
      toggleFavorite({
        source,
        id,
        title: videoDetail.title,
        type: videoDetail.episodes?.length > 1 ? "tv" : "movie",
        genre: videoDetail.genre || "",
        poster: videoDetail.poster,
      });
      // 清除本地乐观状态，回到store状态
      setIsOptimistic(null);
    }, 0);
  };

  return (
    <m.button
      whileTap={reduceMotion ? undefined : { scale: 0.95 }}
      transition={pressSpring}
      type="button"
      onClick={handleToggleFavorite}
      disabled={!videoDetail || !id || !source}
      aria-label={favoriteState ? "取消收藏" : "添加收藏"}
      aria-pressed={favoriteState}
      className={`ui-button ${showLabel ? "" : "ui-icon-button"} ${favoriteState ? "bg-rose-50 text-rose-700 border-rose-200" : "text-muted"} ${className}`}
      title={favoriteState ? "取消收藏" : "添加收藏"}
    >
      <m.span
        className="inline-flex"
        initial={false}
        animate={{ scale: reduceMotion ? 1 : favoriteState ? [1, 1.25, 1] : 1 }}
        transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
      >
        <MaterialSymbolsFavoriteOutlineRounded className="text-xl" aria-hidden="true" />
      </m.span>
      {showLabel && <span>{favoriteState ? "已收藏" : "收藏"}</span>}
    </m.button>
  );
}
