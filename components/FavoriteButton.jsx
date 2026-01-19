"use client";

import { useState } from "react";
import { useFavoritesStore } from "@/store/useFavoritesStore";

export function FavoriteButton({ source, id, videoDetail, className = "" }) {
  // 使用精确选择器：只选择当前item的收藏状态，避免不必要的重渲染
  const favoriteStateFromStore = useFavoritesStore((state) => state.favorites.some((fav) => fav.source === source && fav.id === id));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  // 本地乐观状态：用于立即响应用户点击
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
    <button
      onClick={handleToggleFavorite}
      className={`flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${
        favoriteState ? "" : "text-gray-400 dark:text-gray-500 hover:text-primary"
      } ${className} ${favoriteState ? "text-red-500! hover:text-red-600!" : ""}`}
      title={favoriteState ? "取消收藏" : "添加收藏"}
    >
      <span className={`material-symbols-outlined ${favoriteState ? "material-symbols-filled" : ""}`}>favorite</span>
    </button>
  );
}
