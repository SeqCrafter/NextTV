"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearchHistoryStore } from "@/store/useSearchHistoryStore";
import {
  MaterialSymbolsSearchRounded,
  MaterialSymbolsCloseRounded,
  MaterialSymbolsHistoryRounded
} from "@/components/icons";

export function SearchBox({ initialValue = "", onSearch, placeholder = "搜索电影、电视剧..." }) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(initialValue);
  const [showHistory, setShowHistory] = useState(false);
  const searchContainerRef = useRef(null);

  const searchHistory = useSearchHistoryStore((state) => state.searchHistory);
  const addToHistory = useSearchHistoryStore((state) => state.addToHistory);
  const removeFromHistory = useSearchHistoryStore((state) => state.removeFromHistory);
  const clearHistory = useSearchHistoryStore((state) => state.clearHistory);

  // Update input value when initialValue changes
  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

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
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
          <MaterialSymbolsSearchRounded className="text-xl" />
        </div>
        <input
          className="w-full h-14 bg-white border border-gray-200 rounded-xl pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm text-base placeholder:text-sm"
          placeholder={placeholder}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setShowHistory(true)}
        />
        <div className="absolute inset-y-0 right-4 flex items-center">
          <div className="flex gap-2">
            {inputValue && (
              <button
                type="button"
                onClick={handleClearInput}
                className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors btn-press"
              >
                <MaterialSymbolsCloseRounded className="text-xl" />
              </button>
            )}
            <div className="w-px h-6 bg-gray-200 self-center"></div>
            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded border border-gray-200 self-center">
              ⌘K
            </span>
          </div>
        </div>
      </form>

      {/* Search History Dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50 dropdown-enter">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <MaterialSymbolsHistoryRounded className="text-[18px]" />
              <span className="font-medium">搜索历史</span>
            </div>
            <button
              onClick={clearHistory}
              className="text-primary text-sm hover:text-primary/80 transition-colors font-medium btn-press"
            >
              清除全部
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {searchHistory.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group cursor-pointer"
                onClick={() => handleHistoryItemClick(item)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <MaterialSymbolsSearchRounded className="text-[20px] text-gray-400" />
                  <span className="text-gray-900 truncate">{item}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromHistory(item);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-md text-gray-400 hover:text-gray-600 transition-all btn-press"
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
