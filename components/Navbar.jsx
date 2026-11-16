"use client";

import { useState, useEffect, useRef, useId } from "react";
import { AnimatePresence, LayoutGroup, useIsPresent } from "motion/react";
import * as m from "motion/react-m";
import { backdropMotion, snappySpring } from "@/lib/motion";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { useMediaQuery, MOBILE_QUERY } from "@/hooks/useMediaQuery";
import { usePlayHistoryStore } from "@/store/usePlayHistoryStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useSearchScrollStore } from "@/store/useSearchScrollStore";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { SearchBox } from "@/components/SearchBox";
import {
  MaterialSymbolsHistoryRounded,
  MaterialSymbolsFavoriteOutlineRounded,
  MaterialSymbolsSettingsOutlineRounded,
  MaterialSymbolsDirectionsAltOutlineRounded,
  MaterialSymbolsHomeOutlineRounded,
  MaterialSymbolsSearchRounded,
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
  const navId = useId();
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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

  const libraryPanel = openPanel && (
    <LibraryPanel
      key={isMobile ? "sheet" : "dropdown"}
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
      <div className="sticky top-0 z-50 w-full border-b border-line bg-background-light/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <header className="relative max-w-[1504px] mx-auto flex h-16 md:h-18 items-center justify-between gap-3 px-4 sm:px-6 xl:px-8">
          <Link
            href="/"
            aria-label="NextTV 首页"
            className="flex items-center gap-2 select-none shrink-0 rounded-lg min-h-11"
          >
            <Image src="/logo.png" alt="" loading="eager" width={24} height={28} className="h-7 w-auto object-contain" />
            <span className="text-[20px] font-bold leading-none tracking-tight text-ink">
              Next<span className="text-primary-dark">TV</span>
            </span>
          </Link>

          <nav aria-label="内容导航" className="hidden md:flex items-center gap-1 mr-auto ml-2">
            <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className={`flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors ${pathname === "/" ? "bg-primary-soft text-primary-dark" : "text-muted hover:bg-surface-active hover:text-ink"}`}>
              <MaterialSymbolsHomeOutlineRounded className="text-xl" aria-hidden="true" />
              发现
            </Link>
            <Link href="/direct-input" aria-current={pathname === "/direct-input" || pathname === "/direct" ? "page" : undefined} className={`flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors ${pathname === "/direct-input" || pathname === "/direct" ? "bg-primary-soft text-primary-dark" : "text-muted hover:bg-surface-active hover:text-ink"}`}>
              <MaterialSymbolsDirectionsAltOutlineRounded className="text-xl" aria-hidden="true" />
              直链播放
            </Link>
          </nav>

          {pathname !== "/" && pathname !== "/search" && (
            <div className="hidden lg:block flex-1 min-w-0 max-w-xs mx-2">
              <SearchBox compact />
            </div>
          )}

          <nav aria-label="个人工具" className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/search"
              aria-label="搜索影视"
              className="ui-button ui-icon-button btn-press md:hidden border-transparent bg-transparent text-muted"
            >
              <MaterialSymbolsSearchRounded className="text-2xl" aria-hidden="true" />
            </Link>

            {/* 片库：观看历史 / 我的收藏 */}
            <div className="relative hidden md:flex items-center gap-1" ref={panelRef}>
              {LIBRARY_TABS.map(({ key, label, Icon }) => {
                const active = openPanel === key;
                return (
                  <button
                    key={key}
                    aria-label={label}
                    title={label}
                    aria-haspopup="dialog"
                    aria-expanded={active}
                    className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-sm transition-colors cursor-pointer btn-press ${active ? "bg-primary-soft text-primary-dark" : "text-muted hover:bg-surface-active hover:text-ink"}`}
                    onPointerEnter={loadLibraryPanel}
                    onFocus={loadLibraryPanel}
                    onClick={() => setOpenPanel(active ? null : key)}
                  >
                    <Icon className="text-xl" aria-hidden="true" />
                    <span className="hidden xl:inline">{key === "history" ? "历史" : "收藏"}</span>
                  </button>
                );
              })}

              <AnimatePresence>
                {!isMobile && libraryPanel}
              </AnimatePresence>
            </div>

            <Link
              href="/settings"
              aria-label="设置"
              title="设置"
              aria-current={pathname === "/settings" ? "page" : undefined}
              className={`ui-button ui-icon-button hidden md:flex border-transparent bg-transparent text-muted btn-press ${pathname === "/settings" ? "bg-primary-soft text-primary-dark" : ""}`}
            >
              <MaterialSymbolsSettingsOutlineRounded className="text-xl" aria-hidden="true" />
            </Link>

            <span className="hidden md:block h-5 w-px bg-line mx-1" aria-hidden="true" />
            <Link
              href="https://github.com/SeqCrafter/NextTV"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub 开源项目"
              className="ui-button ui-icon-button border-transparent bg-transparent text-muted btn-press"
            >
              <SimpleIconsGithub aria-hidden="true" className="size-5" fill="currentColor" viewBox="0 0 24 24" />
            </Link>
          </nav>
        </header>
      </div>

      {/* 手机端底部导航栏 */}
      <LayoutGroup id={`bottom-nav-${navId}`}>
      <m.nav
        layoutRoot
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
      </m.nav>
      </LayoutGroup>

      {isMobile && createPortal(
        <AnimatePresence>
          {openPanel && (
            <LibrarySheet key="library-sheet" sheetRef={sheetRef} onClose={() => setOpenPanel(null)}>
              {libraryPanel}
            </LibrarySheet>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

function LibrarySheet({ children, onClose, sheetRef }) {
  const isPresent = useIsPresent();
  return (
    <div ref={sheetRef} inert={!isPresent} aria-hidden={!isPresent || undefined}>
      <m.div {...backdropMotion} aria-hidden="true" className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      {children}
    </div>
  );
}

function bottomNavItemClass(active) {
  return `flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 text-[11px] font-medium transition-colors cursor-pointer btn-press ${
    active ? "text-primary-dark" : "text-muted"
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
      <span className="relative isolate flex items-center justify-center h-7 w-12 rounded-lg">
        {active && <m.span layoutId="active" aria-hidden="true" transition={snappySpring} className="absolute inset-0 -z-10 rounded-lg bg-primary-soft" />}
        <Icon className="text-[24px]" aria-hidden="true" />
      </span>
      <span>{label}</span>
    </>
  );
}
