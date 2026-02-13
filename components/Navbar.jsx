"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePlayHistoryStore } from "@/store/usePlayHistoryStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { formatTimeShort } from "@/lib/util";
import Image from "next/image";
import Link from "next/link";
import {
  MaterialSymbolsHistoryRounded,
  MaterialSymbolsFavoriteOutlineRounded,
  MaterialSymbolsSettingsOutlineRounded,
  MaterialSymbolsDeleteOutlineRounded,
  MaterialSymbolsVideoLibraryOutlineRounded,
  SimpleIconsGithub,
} from "@/components/icons";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showFavoritesDropdown, setShowFavoritesDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const favoritesDropdownRef = useRef(null);

  // 获取播放历史
  const playHistory = usePlayHistoryStore((state) => state.playHistory);
  const removePlayRecord = usePlayHistoryStore(
    (state) => state.removePlayRecord,
  );
  const clearPlayHistory = usePlayHistoryStore(
    (state) => state.clearPlayHistory,
  );

  // 获取收藏列表
  const favorites = useFavoritesStore((state) => state.favorites);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const clearFavorites = useFavoritesStore((state) => state.clearFavorites);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowHistoryDropdown(false);
      }
      if (
        favoritesDropdownRef.current &&
        !favoritesDropdownRef.current.contains(event.target)
      ) {
        setShowFavoritesDropdown(false);
      }
    };

    if (showHistoryDropdown || showFavoritesDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showHistoryDropdown, showFavoritesDropdown]);


  const handleHistoryClick = (record) => {
    setShowHistoryDropdown(false);
    router.push(`/play/${record.id}?source=${record.source}`);
  };

  const handleDeleteHistory = (e, record) => {
    e.stopPropagation();
    removePlayRecord(record.source, record.id);
  };

  const handleClearAll = () => {
    if (confirm("确定要清空所有观看历史吗？")) {
      clearPlayHistory();
      setShowHistoryDropdown(false);
    }
  };

  const handleFavoriteClick = (favorite) => {
    setShowFavoritesDropdown(false);
    router.push(`/search?q=${encodeURIComponent(favorite.title)}`);
  };

  const handleDeleteFavorite = (e, favorite) => {
    e.stopPropagation();
    removeFavorite(favorite.source, favorite.id);
  };

  const handleClearAllFavorites = () => {
    if (confirm("确定要清空所有收藏吗？")) {
      clearFavorites();
      setShowFavoritesDropdown(false);
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full px-4 md:px-8 py-4">
      <header
        className="relative max-w-7xl mx-auto rounded-xl flex items-center justify-between px-6 py-3"
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          boxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px -1px rgba(0, 0, 0, 0.03), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)",
        }}
      >
        <div
          className="flex items-center content-center gap-3 cursor-pointer select-none group"
          onClick={() => router.push("/")}
        >
          <div className="relative group-hover:scale-105 transition-transform duration-200">
            <Image
              src="https://tncache1-f1.v3mh.com/image/2026/01/14/67727e3ade57c7062ef81a16d4f711a0.png"
              alt="NextTV"
              width={20}
              height={20}
              className="w-5 h-5 object-contain"
            />
          </div>
          <div className="flex flex-col justify-center h-full">
            <h1 className="text-xl font-extrabold leading-none tracking-tight">
              <span className="text-gray-900">Next</span>
              <span className="text-primary">TV</span>
            </h1>
            <span className="text-[10px] text-gray-500 text-center font-medium tracking-wide group-hover:text-primary transition-colors">
              影视无限畅享
            </span>
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-6">
          {/* Minimal search for navbar if needed */}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="https://github.com/SeqCrafter/NextTV"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="flex items-center justify-center size-10 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors btn-press"
          >
            <SimpleIconsGithub
              aria-hidden="true"
              className="size-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            />
          </Link>

          {/* History Dropdown */}
          <div className="static md:relative" ref={dropdownRef}>
            <button
              aria-label="History"
              className={`flex items-center justify-center size-10 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer btn-press ${showHistoryDropdown ? "bg-gray-100 text-gray-900" : ""
                }`}
              onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
            >
              <MaterialSymbolsHistoryRounded className="text-2xl" />
            </button>

            {/* Dropdown Menu */}
            {showHistoryDropdown && (
              <div className="absolute left-0 right-0 md:left-auto md:right-0 top-full mt-2 w-full md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 dropdown-enter">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <h3 className="font-bold text-gray-900">观看历史</h3>
                  {playHistory.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="text-xs text-red-500 hover:text-red-600 cursor-pointer font-medium transition-colors btn-press"
                    >
                      清空全部
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {playHistory.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <MaterialSymbolsVideoLibraryOutlineRounded className="text-2xl mb-2 mx-auto block" />
                      <p>暂无观看历史</p>
                    </div>
                  ) : (
                    playHistory.map((record) => (
                      <div
                        key={`${record.source}-${record.id}`}
                        className="p-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0 group"
                        onClick={() => handleHistoryClick(record)}
                      >
                        <div className="flex gap-3">
                          <div className="relative w-16 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                            <img
                              src={record.poster}
                              alt={record.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900/20">
                              <div
                                className="h-full bg-primary"
                                style={{
                                  width: `${Math.min(record.progress, 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-primary transition-colors">
                              {record.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {record.totalEpisodes > 1
                                ? `第${record.currentEpisodeIndex + 1}集`
                                : "电影"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimeShort(record.currentTime)} /{" "}
                              {formatTimeShort(record.duration)}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">
                                {Math.floor(record.progress)}%
                              </span>
                            </div>
                            {record.source_name && (
                              <p className="text-xs text-gray-400 mt-1">
                                {record.source_name}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={(e) => handleDeleteHistory(e, record)}
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-lg btn-press"
                            aria-label="删除"
                          >
                            <span className="flex items-center justify-center text-red-500">
                              <MaterialSymbolsDeleteOutlineRounded className="text-[18px]" />
                            </span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Favorites Dropdown */}
          <div className="static md:relative" ref={favoritesDropdownRef}>
            <button
              aria-label="Favorites"
              className={`flex items-center justify-center size-10 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer btn-press ${showFavoritesDropdown ? "bg-gray-100 text-gray-900" : ""
                }`}
              onClick={() => setShowFavoritesDropdown(!showFavoritesDropdown)}
            >
              <MaterialSymbolsFavoriteOutlineRounded className="text-2xl" />
            </button>

            {/* Favorites Dropdown Menu */}
            {showFavoritesDropdown && (
              <div className="absolute left-0 right-0 md:left-auto md:right-0 top-full mt-2 w-full md:w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 dropdown-enter">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <h3 className="font-bold text-gray-900">我的收藏</h3>
                  {favorites.length > 0 && (
                    <button
                      onClick={handleClearAllFavorites}
                      className="text-xs text-red-500 hover:text-red-600 cursor-pointer font-medium transition-colors btn-press"
                    >
                      清空全部
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {favorites.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <MaterialSymbolsFavoriteOutlineRounded className="text-2xl mb-2 mx-auto block" />
                      <p>暂无收藏</p>
                    </div>
                  ) : (
                    favorites.map((favorite) => (
                      <div
                        key={`${favorite.source}-${favorite.id}`}
                        className="p-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0 group"
                        onClick={() => handleFavoriteClick(favorite)}
                      >
                        <div className="flex gap-3">
                          <div className="relative w-16 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                            <img
                              src={favorite.poster}
                              alt={favorite.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-primary transition-colors">
                              {favorite.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {favorite.type === "tv" ? "电视剧" : "电影"}
                            </p>
                            {favorite.genre && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                                {favorite.genre}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={(e) => handleDeleteFavorite(e, favorite)}
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-lg btn-press"
                            aria-label="删除"
                          >
                            <span className="flex items-center justify-center text-red-500">
                              <MaterialSymbolsDeleteOutlineRounded className="text-[18px]" />
                            </span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/settings"
            aria-label="Settings"
            className={`flex items-center justify-center size-10 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer btn-press ${pathname === "/settings" ? "bg-gray-100 text-gray-900" : ""
              }`}
          >
            <MaterialSymbolsSettingsOutlineRounded className="text-2xl" />
          </Link>
        </div>
      </header>
    </div>
  );
}
