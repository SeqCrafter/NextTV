"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { useMediaQuery, MOBILE_QUERY } from "@/hooks/useMediaQuery";
import { usePlayHistoryStore } from "@/store/usePlayHistoryStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useSearchScrollStore } from "@/store/useSearchScrollStore";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MaterialSymbolsHistoryRounded,
  MaterialSymbolsFavoriteOutlineRounded,
  MaterialSymbolsSettingsOutlineRounded,
  MaterialSymbolsDirectionsAltOutlineRounded,
  MaterialSymbolsHomeOutlineRounded,
  SimpleIconsGithub,
} from "@/components/icons";

const LIBRARY_TABS = [
  { key: "history", label: "观看历史", shortLabel: "历史", Icon: MaterialSymbolsHistoryRounded },
  { key: "favorites", label: "我的收藏", shortLabel: "收藏", Icon: MaterialSymbolsFavoriteOutlineRounded },
];

// 片库面板仅在点击后展示，按需加载，避免进入每个页面的首屏 JS
const loadLibraryPanel = () => import("@/components/LibraryPanel");
const LibraryPanel = dynamic(
  () => loadLibraryPanel().then((m) => m.LibraryPanel),
  { ssr: false },
);

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  // 当前打开的片库面板：null | "history" | "favorites"
  const [openPanel, setOpenPanel] = useState(null);
  const panelRef = useRef(null);
  const bottomNavRef = useRef(null);
  const sheetRef = useRef(null);
  // 手机端片库以底部抽屉形式展示，桌面端仍为导航栏下拉面板
  const isMobile = useMediaQuery(MOBILE_QUERY);

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
      const inside = [panelRef, bottomNavRef, sheetRef].some((ref) => ref.current?.contains(event.target));
      if (!inside) setOpenPanel(null);
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

  // 手机端抽屉打开时锁定背景滚动
  useEffect(() => {
    if (!openPanel || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openPanel, isMobile]);

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

  const libraryPanel = openPanel && (
    <LibraryPanel
      variant={isMobile ? "sheet" : "dropdown"}
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
  );

  const isActiveRoute = (href) => !openPanel && pathname === href;

  return (
    <>
      <div className="sticky top-0 z-50 w-full px-3 md:px-8 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 md:py-4">
        <header className="glass-bar relative max-w-7xl mx-auto rounded-2xl flex items-center justify-between gap-2 px-3 sm:px-6 py-2 sm:py-3">
          <Link
            href="/"
            aria-label="NextTV 首页"
            className="flex items-center content-center gap-2 sm:gap-3 cursor-pointer select-none group shrink-0 rounded-lg min-h-11"
          >
            <div className="relative group-hover:scale-105 transition-transform duration-200">
              <Image
                src="https://tncache1-f1.v3mh.com/image/2026/01/14/67727e3ade57c7062ef81a16d4f711a0.png"
                alt=""
                loading="eager"
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
              className="flex items-center justify-center size-11 md:size-10 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors btn-press"
            >
              <SimpleIconsGithub
                aria-hidden="true"
                className="size-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              />
            </Link>

            {/* 以下入口在手机端移到底部导航栏 */}
            <Link
              href="/direct-input"
              aria-label="直链播放"
              title="直链播放"
              aria-current={pathname === "/direct-input" ? "page" : undefined}
              className={`hidden md:flex items-center justify-center size-10 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer btn-press ${pathname === "/direct-input" ? "bg-gray-100 text-gray-900" : ""}`}
            >
              <MaterialSymbolsDirectionsAltOutlineRounded className="text-2xl" />
            </Link>

            {/* 片库：观看历史 / 我的收藏 */}
            <div className="relative hidden md:flex items-center gap-2 md:gap-3" ref={panelRef}>
              {LIBRARY_TABS.map(({ key, label, Icon }) => {
                const active = openPanel === key;
                return (
                  <button
                    key={key}
                    aria-label={label}
                    title={label}
                    aria-haspopup="dialog"
                    aria-expanded={active}
                    className={`flex items-center justify-center size-10 rounded-full transition-colors cursor-pointer btn-press ${active ? "bg-primary/20 text-gray-900" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}`}
                    onPointerEnter={loadLibraryPanel}
                    onFocus={loadLibraryPanel}
                    onClick={() => setOpenPanel(active ? null : key)}
                  >
                    <Icon className="text-2xl" />
                  </button>
                );
              })}

              {!isMobile && libraryPanel}
            </div>

            <Link
              href="/settings"
              aria-label="设置"
              title="设置"
              aria-current={pathname === "/settings" ? "page" : undefined}
              className={`hidden md:flex items-center justify-center size-10 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer btn-press ${pathname === "/settings" ? "bg-gray-100 text-gray-900" : ""}`}
            >
              <MaterialSymbolsSettingsOutlineRounded className="text-2xl" />
            </Link>
          </nav>
        </header>
      </div>

      {/* 手机端底部导航栏 */}
      <nav
        ref={bottomNavRef}
        aria-label="底部导航"
        className="mobile-nav md:hidden fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around px-[max(0.5rem,env(safe-area-inset-left))]"
      >
        <BottomNavLink href="/" label="首页" Icon={MaterialSymbolsHomeOutlineRounded} active={isActiveRoute("/")} />
        <BottomNavLink
          href="/direct-input"
          label="直链"
          Icon={MaterialSymbolsDirectionsAltOutlineRounded}
          active={isActiveRoute("/direct-input")}
        />
        {LIBRARY_TABS.map(({ key, shortLabel, label, Icon }) => {
          const active = openPanel === key;
          return (
            <button
              key={key}
              type="button"
              aria-label={label}
              aria-haspopup="dialog"
              aria-expanded={active}
              onPointerDown={loadLibraryPanel}
              onClick={() => setOpenPanel(active ? null : key)}
              className={bottomNavItemClass(active)}
            >
              <BottomNavItemContent Icon={Icon} label={shortLabel} active={active} />
            </button>
          );
        })}
        <BottomNavLink
          href="/settings"
          label="设置"
          Icon={MaterialSymbolsSettingsOutlineRounded}
          active={isActiveRoute("/settings")}
        />
      </nav>

      {isMobile &&
        openPanel &&
        createPortal(
          <div ref={sheetRef}>
            <div
              aria-hidden="true"
              className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm modal-backdrop-enter"
              onClick={() => setOpenPanel(null)}
            />
            {libraryPanel}
          </div>,
          document.body,
        )}
    </>
  );
}

function bottomNavItemClass(active) {
  return `flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 text-[11px] font-medium transition-colors cursor-pointer btn-press ${
    active ? "text-gray-900" : "text-gray-500"
  }`;
}

function BottomNavLink({ href, label, Icon, active }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={bottomNavItemClass(active)}>
      <BottomNavItemContent Icon={Icon} label={label} active={active} />
    </Link>
  );
}

function BottomNavItemContent({ Icon, label, active }) {
  return (
    <>
      <span
        className={`flex items-center justify-center h-7 w-12 rounded-full transition-colors ${active ? "bg-primary/25" : ""}`}
      >
        <Icon className="text-[24px]" aria-hidden="true" />
      </span>
      <span>{label}</span>
    </>
  );
}
