"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePlayHistoryStore } from "@/store/usePlayHistoryStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useSearchScrollStore } from "@/store/useSearchScrollStore";
import { LibraryPanel } from "@/components/LibraryPanel";
import Image from "next/image";
import Link from "next/link";
import {
  MaterialSymbolsHistoryRounded,
  MaterialSymbolsFavoriteOutlineRounded,
  MaterialSymbolsSettingsOutlineRounded,
  MaterialSymbolsDirectionsAltOutlineRounded,
  SimpleIconsGithub,
} from "@/components/icons";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  // 当前打开的片库面板：null | "history" | "favorites"
  const [openPanel, setOpenPanel] = useState(null);
  const panelRef = useRef(null);

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

  // 点击外部或按 Esc 关闭面板
  useEffect(() => {
    if (!openPanel) return;

    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpenPanel(null);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpenPanel(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openPanel]);

  const handleHistoryClick = (record) => {
    setOpenPanel(null);
    if (record.source_name === "直链播放") {
      const params = new URLSearchParams({
        playerurl: record.source,
        title: record.title || "",
        poster: record.poster || "",
      });
      router.push(`/direct?${params.toString()}`);
    } else {
      router.push(`/play/${record.id}?source=${record.source}`);
    }
  };

  const clearScrollPosition = useSearchScrollStore((state) => state.clearScrollPosition);

  const handleFavoriteClick = (favorite) => {
    setOpenPanel(null);
    clearScrollPosition();
    router.push(`/search?q=${encodeURIComponent(favorite.title)}`);
  };

  return (
    <div className="sticky top-0 z-50 w-full px-3 md:px-8 py-3 md:py-4">
      <header
        className="glass-bar relative max-w-7xl mx-auto rounded-2xl flex items-center justify-between gap-2 px-3 sm:px-6 py-2.5 sm:py-3"
      >
        <Link
          href="/"
          aria-label="NextTV 首页"
          className="flex items-center content-center gap-2 sm:gap-3 cursor-pointer select-none group shrink-0 rounded-lg"
        >
          <div className="relative group-hover:scale-105 transition-transform duration-200">
            <Image
              src="https://tncache1-f1.v3mh.com/image/2026/01/14/67727e3ade57c7062ef81a16d4f711a0.png"
              alt=""
              priority
              width={24}
              height={24}
              className="w-6 h-6 object-contain"
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
        </Link>

        <div className="hidden md:flex flex-1 max-w-md mx-6">
          {/* Minimal search for navbar if needed */}
        </div>

        <nav aria-label="主导航" className="flex items-center gap-0.5 sm:gap-2 md:gap-3">
          <Link
            href="https://github.com/SeqCrafter/NextTV"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="hidden sm:flex items-center justify-center size-10 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors btn-press"
          >
            <SimpleIconsGithub
              aria-hidden="true"
              className="size-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            />
          </Link>

          {/* Direct Play Link */}
          <Link
            href="/direct-input"
            aria-label="直链播放"
            title="直链播放"
            aria-current={pathname === "/direct-input" ? "page" : undefined}
            className={`flex items-center justify-center size-10 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer btn-press ${pathname === "/direct-input" ? "bg-gray-100 text-gray-900" : ""}`}
          >
            <MaterialSymbolsDirectionsAltOutlineRounded className="text-2xl" />
          </Link>

          {/* 片库：观看历史 / 我的收藏 */}
          <div className="static md:relative flex items-center gap-0.5 sm:gap-2 md:gap-3" ref={panelRef}>
            {[
              { key: "history", label: "观看历史", Icon: MaterialSymbolsHistoryRounded },
              { key: "favorites", label: "我的收藏", Icon: MaterialSymbolsFavoriteOutlineRounded },
            ].map(({ key, label, Icon }) => {
              const active = openPanel === key;
              return (
                <button
                  key={key}
                  aria-label={label}
                  title={label}
                  aria-haspopup="dialog"
                  aria-expanded={active}
                  className={`flex items-center justify-center size-10 rounded-full transition-colors cursor-pointer btn-press ${active ? "bg-primary/20 text-gray-900" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}`}
                  onClick={() => setOpenPanel(active ? null : key)}
                >
                  <Icon className="text-2xl" />
                </button>
              );
            })}

            {openPanel && (
              <LibraryPanel
                activeTab={openPanel}
                onTabChange={setOpenPanel}
                onClose={() => setOpenPanel(null)}
                playHistory={playHistory}
                favorites={favorites}
                onHistoryClick={handleHistoryClick}
                onDeleteHistory={(record) => removePlayRecord(record.source, record.id)}
                onClearHistory={clearPlayHistory}
                onFavoriteClick={handleFavoriteClick}
                onDeleteFavorite={(favorite) => removeFavorite(favorite.source, favorite.id)}
                onClearFavorites={clearFavorites}
              />
            )}
          </div>

          <Link
            href="/settings"
            aria-label="设置"
            title="设置"
            aria-current={pathname === "/settings" ? "page" : undefined}
            className={`flex items-center justify-center size-10 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer btn-press ${pathname === "/settings" ? "bg-gray-100 text-gray-900" : ""
              }`}
          >
            <MaterialSymbolsSettingsOutlineRounded className="text-2xl" />
          </Link>
        </nav>
      </header>
    </div>
  );
}
