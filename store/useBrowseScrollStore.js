"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const MAX_ENTRIES = 50;
const MAX_AGE = 30 * 60 * 1000;
const HISTORY_KEY = "__nexttvBrowseEntry";

export function getBrowseHref(pathname, search = "") {
  const params = new URLSearchParams(search);
  params.sort();
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
}

export function getBrowseEntry() {
  if (typeof window === "undefined") return null;
  const { pathname, search } = window.location;
  if (pathname !== "/search" && pathname !== "/source-browse") return null;

  const href = getBrowseHref(pathname, search);
  const savedEntry = window.history.state?.[HISTORY_KEY];
  if (savedEntry?.href === href && typeof savedEntry.id === "string") return savedEntry;

  const entry = {
    href,
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
  };
  try {
    // Preserve Next's history fields and do not add another history entry.
    window.history.replaceState({ ...window.history.state, [HISTORY_KEY]: entry }, "");
    return entry;
  } catch {
    return { href, id: `url:${href}` };
  }
}

function isFresh(entry, now) {
  return entry && typeof entry.href === "string" &&
    Number.isFinite(entry.scrollY) && entry.scrollY >= 0 &&
    Number.isFinite(entry.updatedAt) && entry.updatedAt <= now &&
    now - entry.updatedAt < MAX_AGE;
}

function pruneEntries(entries, now = Date.now()) {
  return Object.fromEntries(
    Object.entries(entries ?? {})
      .filter(([, entry]) => isFresh(entry, now))
      .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_ENTRIES),
  );
}

const sessionStorageAccess = {
  getItem: (name) => {
    try { return window.sessionStorage.getItem(name); } catch { return null; }
  },
  setItem: (name, value) => {
    try { window.sessionStorage.setItem(name, value); } catch { /* Keep the in-memory snapshot. */ }
  },
  removeItem: (name) => {
    try { window.sessionStorage.removeItem(name); } catch { /* Storage may be disabled. */ }
  },
};

export const useBrowseScrollStore = create(
  persist(
    (set, get) => ({
      entries: {},
      saveScrollPosition: (entry, scrollY) => {
        if (!entry || !Number.isFinite(scrollY) || scrollY < 0) return;
        const updatedAt = Date.now();
        set((state) => ({
          entries: pruneEntries({
            ...state.entries,
            [entry.id]: { href: entry.href, scrollY, updatedAt },
          }, updatedAt),
        }));
      },
      getScrollPosition: (entry) => {
        const saved = entry && get().entries[entry.id];
        return isFresh(saved, Date.now()) && saved.href === entry.href ? saved.scrollY : undefined;
      },
    }),
    {
      name: "nexttv-browse-scroll",
      storage: createJSONStorage(() => sessionStorageAccess),
      partialize: (state) => ({ entries: state.entries }),
      merge: (saved, current) => ({ ...current, entries: pruneEntries(saved?.entries) }),
    },
  ),
);

export function saveBrowseScrollPosition() {
  const entry = getBrowseEntry();
  if (entry) useBrowseScrollStore.getState().saveScrollPosition(entry, Math.max(0, window.scrollY));
}

export function isCurrentHref(href) {
  if (typeof window === "undefined") return false;
  const current = new URL(window.location.href);
  const next = new URL(href, current);
  return next.origin === current.origin && next.hash === current.hash &&
    getBrowseHref(next.pathname, next.search) === getBrowseHref(current.pathname, current.search);
}

export function pushBrowseRoute(router, href, options) {
  saveBrowseScrollPosition();
  // A same-URL push becomes a replace in Next and discards custom history state.
  if (!isCurrentHref(href)) router.push(href, options);
}
