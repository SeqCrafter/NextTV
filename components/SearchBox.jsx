"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, useIsPresent } from "motion/react";
import * as m from "motion/react-m";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { pressSpring, reducedMotionQuery, surfaceMotion, snappySpring } from "@/lib/motion";
import { useRouter } from "next/navigation";
import { useSearchHistoryStore } from "@/store/useSearchHistoryStore";
import { useSearchScrollStore } from "@/store/useSearchScrollStore";
import { MaterialSymbolsSearchRounded, MaterialSymbolsCloseRounded, MaterialSymbolsHistoryRounded } from "@/components/icons";

export function SearchBox({ initialValue = "", onSearch, placeholder = "搜索电影、电视剧、短剧", compact = false }) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(initialValue);
  const [showHistory, setShowHistory] = useState(false);
  const searchContainerRef = useRef(null);

  const searchHistory = useSearchHistoryStore((state) => state.searchHistory);
  const addToHistory = useSearchHistoryStore((state) => state.addToHistory);
  const removeFromHistory = useSearchHistoryStore((state) => state.removeFromHistory);
  const clearHistory = useSearchHistoryStore((state) => state.clearHistory);
  const clearScrollPosition = useSearchScrollStore((state) => state.clearScrollPosition);

  // 监听外部点击与新焦点，不在 blur 时卸载按钮，避免 Safari 丢失内部点击。
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowHistory(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("focusin", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("focusin", handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputValue && inputValue.trim()) {
      const trimmedValue = inputValue.trim();
      addToHistory(trimmedValue);
      setShowHistory(false);
      clearScrollPosition();

      if (onSearch) {
        onSearch(trimmedValue);
      } else {
        router.push(`/search?q=${encodeURIComponent(trimmedValue)}`);
      }
    }
  };

  const handleHistoryItemClick = (item) => {
    setInputValue(item);
    setShowHistory(false);
    addToHistory(item);
    clearScrollPosition();

    if (onSearch) {
      onSearch(item);
    } else {
      router.push(`/search?q=${encodeURIComponent(item)}`);
    }
  };

  const handleClearInput = () => {
    setInputValue("");
    if (onSearch) {
      router.push("/search");
    }
  };

  return (
    <div
      ref={searchContainerRef}
      className="w-full relative"
      onKeyDown={(e) => { if (e.key === "Escape") setShowHistory(false); }}
    >
      <form role="search" aria-label={compact ? "导航搜索" : "影视搜索"} onSubmit={handleSearch} className={`w-full relative flex items-center gap-1 border border-line bg-surface-light shadow-card transition-[border-color,box-shadow] hover:border-[#d6d2c7] focus-within:border-primary-dark/50 focus-within:ring-3 focus-within:ring-primary/15 ${compact ? "rounded-xl pr-1" : "rounded-2xl pr-1.5"}`}>
        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted">
          <MaterialSymbolsSearchRounded className="text-xl" aria-hidden="true" />
        </div>
        <input
          className={`w-full min-w-0 flex-1 bg-transparent pl-11 pr-1 text-ink placeholder:text-muted text-base outline-none ${compact ? "h-11 text-sm" : "h-14"}`}
          placeholder={placeholder}
          type="search"
          enterKeyHint="search"
          aria-label="搜索影视"
          autoComplete="off"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setShowHistory(true)}
        />
        {inputValue && (
          <button type="button" onClick={handleClearInput} aria-label="清空输入" className={`flex shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-active hover:text-ink transition-colors btn-press ${compact ? "size-9" : "size-11"}`}>
            <MaterialSymbolsCloseRounded className="text-xl" aria-hidden="true" />
          </button>
        )}
        <m.button type="submit" aria-label="搜索" whileTap={{ scale: 0.95 }} transition={pressSpring} className={`flex shrink-0 items-center justify-center rounded-[10px] bg-primary text-ink font-semibold hover:bg-primary-hover transition-colors cursor-pointer ${compact ? "size-9" : "h-11 px-4 text-sm"}`}>
          {compact ? <MaterialSymbolsSearchRounded className="text-xl" aria-hidden="true" /> : "搜索"}
        </m.button>
      </form>

      {/* Search History Dropdown */}
      <AnimatePresence>
      {showHistory && searchHistory.length > 0 && (
        <SearchHistoryDropdown key="history">
          <div className="flex items-center justify-between px-4 py-2 border-b border-line">
            <div className="flex items-center gap-2 text-muted text-sm">
              <MaterialSymbolsHistoryRounded className="text-[18px]" aria-hidden="true" />
              <span className="font-medium">搜索历史</span>
            </div>
            <button type="button" onClick={clearHistory} className="rounded-lg px-2 min-h-11 text-xs font-medium text-muted hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer btn-press">
              清除全部
            </button>
          </div>
          <m.div layoutScroll className="relative max-h-80 overflow-y-auto overscroll-contain p-1.5 custom-scrollbar">
            <AnimatePresence initial={false} mode="popLayout">
            {searchHistory.map((item) => (
               <m.div layout="position" key={item} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={snappySpring} className="flex items-center gap-1 rounded-xl hover:bg-surface-active transition-colors">
                 <button type="button" className="flex min-h-11 items-center gap-3 flex-1 min-w-0 px-3 text-left rounded-lg cursor-pointer" onClick={() => handleHistoryItemClick(item)}>
                   <MaterialSymbolsSearchRounded className="text-[18px] text-muted shrink-0" aria-hidden="true" />
                   <span className="text-ink truncate">{item}</span>
                 </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromHistory(item);
                  }}
                  type="button"
                  aria-label={`删除搜索记录 ${item}`}
                   className="flex size-11 shrink-0 items-center justify-center hover:bg-line rounded-lg text-muted hover:text-ink transition-colors btn-press cursor-pointer"
                 >
                   <MaterialSymbolsCloseRounded className="text-[18px]" aria-hidden="true" />
                </button>
              </m.div>
            ))}
            </AnimatePresence>
          </m.div>
        </SearchHistoryDropdown>
      )}
      </AnimatePresence>
    </div>
  );
}

function SearchHistoryDropdown({ children }) {
  const isPresent = useIsPresent();
  const reduceMotion = useMediaQuery(reducedMotionQuery);
  return (
    <m.div
      {...surfaceMotion(false, reduceMotion)}
      inert={!isPresent}
      aria-hidden={!isPresent || undefined}
      style={{ transformOrigin: "top center" }}
      className="glass-panel absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
    >
      {children}
    </m.div>
  );
}
