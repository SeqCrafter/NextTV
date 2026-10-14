"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearchHistoryStore } from "@/store/useSearchHistoryStore";
import { useSearchScrollStore } from "@/store/useSearchScrollStore";
import { MaterialSymbolsSearchRounded, MaterialSymbolsCloseRounded, MaterialSymbolsHistoryRounded } from "@/components/icons";

export function SearchBox({ initialValue = "", onSearch, placeholder = "搜索电影、电视剧、短剧..." }) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(initialValue);
  const [showHistory, setShowHistory] = useState(false);
  const searchContainerRef = useRef(null);

  const searchHistory = useSearchHistoryStore((state) => state.searchHistory);
  const addToHistory = useSearchHistoryStore((state) => state.addToHistory);
  const removeFromHistory = useSearchHistoryStore((state) => state.removeFromHistory);
  const clearHistory = useSearchHistoryStore((state) => state.clearHistory);
  const clearScrollPosition = useSearchScrollStore((state) => state.clearScrollPosition);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowHistory(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
    <div ref={searchContainerRef} className="w-full relative">
      <form onSubmit={handleSearch} className="w-full relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 transition-colors">
          <MaterialSymbolsSearchRounded className="text-xl" />
        </div>
        <input
          className="w-full h-12 sm:h-14 bg-white border border-gray-900/[0.06] rounded-xl pl-12 pr-24 text-gray-900 placeholder-gray-400 shadow-[0_1px_2px_rgba(17,24,39,0.03)] transition-all text-base placeholder:text-sm hover:border-gray-900/10 focus:outline-none focus:border-primary/60 focus:ring-[3px] focus:ring-primary/10"
          placeholder={placeholder}
          type="search"
          enterKeyHint="search"
          aria-label="搜索影视"
          autoComplete="off"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setShowHistory(true)}
        />
        <div className="absolute inset-y-0 right-4 flex items-center">
          <div className="flex items-center gap-2">
            {inputValue && (
              <button type="button" onClick={handleClearInput} aria-label="清空输入" className="p-2 -mr-2 sm:p-1 sm:mr-0 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors btn-press">
                <MaterialSymbolsCloseRounded className="text-xl" />
              </button>
            )}
            <div className="hidden sm:block w-px h-5 bg-gray-900/[0.06] self-center"></div>
            <kbd aria-hidden="true" className="hidden sm:inline-flex min-w-8 items-center justify-center rounded-md bg-gray-900/[0.04] px-2 py-[5px] text-[10px] font-medium leading-none text-gray-400 self-center">
              ⏎
            </kbd>
          </div>
        </div>
      </form>

      {/* Search History Dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <div className="glass-panel absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50 dropdown-enter">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-900/[0.06]">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <MaterialSymbolsHistoryRounded className="text-[18px]" />
              <span className="font-medium">搜索历史</span>
            </div>
            <button type="button" onClick={clearHistory} className="rounded-lg px-2 py-1 min-h-9 sm:min-h-0 text-xs font-semibold text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer btn-press">
              清除全部
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto overscroll-contain p-1.5 custom-scrollbar">
            {searchHistory.map((item, index) => (
              <div key={index} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-900/[0.04] transition-colors group cursor-pointer" onClick={() => handleHistoryItemClick(item)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <MaterialSymbolsSearchRounded className="text-[20px] text-gray-400" />
                  <span className="text-gray-900 truncate">{item}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromHistory(item);
                  }}
                  type="button"
                  aria-label={`删除搜索记录 ${item}`}
                  className="md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 p-2 -my-1 -mr-1 md:p-1 md:my-0 md:mr-0 hover:bg-gray-200 rounded-md text-gray-400 hover:text-gray-600 transition-all btn-press"
                >
                  <MaterialSymbolsCloseRounded className="text-[18px]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
