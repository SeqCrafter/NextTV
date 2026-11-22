"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getBrowseEntry, getBrowseHref, isCurrentHref, useBrowseScrollStore } from "@/store/useBrowseScrollStore";

export function useBrowseScrollRestoration(ready) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const href = getBrowseHref(pathname, searchParams.toString());
  const retainedPositionRef = useRef(null);

  useLayoutEffect(() => {
    if (!ready || getBrowseHref(window.location.pathname, window.location.search) !== href) return;
    const entry = getBrowseEntry();
    if (!entry) return;

    const { getScrollPosition, saveScrollPosition } = useBrowseScrollStore.getState();
    const retained = retainedPositionRef.current;
    // A long playback must not expire the position of a still-retained list.
    const targetY = retained?.id === entry.id && retained.href === href
      ? retained.scrollY
      : getScrollPosition(entry) ?? 0;
    let lastY = Math.max(0, window.scrollY);
    let restoring = true;
    let frame;
    let saveTimer;
    let restoreTimer;
    let observer;

    function persistPosition() {
      if (!restoring) {
        retainedPositionRef.current = { ...entry, scrollY: lastY };
        saveScrollPosition(entry, lastY);
      }
    }

    function finishRestoring() {
      restoring = false;
      lastY = Math.max(0, window.scrollY);
      observer?.disconnect();
      clearTimeout(restoreTimer);
      cancelAnimationFrame(frame);
    }

    function restorePosition() {
      const height = (document.scrollingElement ?? document.documentElement).scrollHeight;
      const maxY = Math.max(0, height - window.innerHeight);
      window.scrollTo({ top: Math.min(targetY, maxY), behavior: "instant" });
      if (maxY >= targetY) finishRestoring();
    }

    function queueRestore() {
      if (!restoring || frame) return;
      frame = requestAnimationFrame(() => {
        frame = undefined;
        restorePosition();
      });
    }

    function handleScroll() {
      if (restoring || getBrowseHref(window.location.pathname, window.location.search) !== href) return;
      lastY = Math.max(0, window.scrollY);
      clearTimeout(saveTimer);
      saveTimer = setTimeout(persistPosition, 150);
    }

    function preventSameHrefNavigation(event) {
      const link = event.target?.closest?.("a[href]");
      if (!link || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      if (isCurrentHref(link.href)) event.preventDefault();
    }

    // Wait until the list has committed and Next's own scroll handling has run.
    frame = requestAnimationFrame(() => {
      frame = undefined;
      queueRestore();
    });
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(queueRestore);
      observer.observe(document.body);
    }
    restoreTimer = setTimeout(() => {
      restorePosition();
      finishRestoring();
    }, 2000);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("click", preventSameHrefNavigation, true);
    window.addEventListener("pagehide", persistPosition);
    const inputEvents = ["wheel", "touchstart", "pointerdown", "click", "keydown"];
    for (const event of inputEvents) window.addEventListener(event, finishRestoring, { passive: true });

    return () => {
      // The destination may have reset window.scrollY already; use the last observed value.
      persistPosition();
      clearTimeout(saveTimer);
      clearTimeout(restoreTimer);
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", preventSameHrefNavigation, true);
      window.removeEventListener("pagehide", persistPosition);
      for (const event of inputEvents) window.removeEventListener(event, finishRestoring);
    };
  }, [href, ready]);
}
