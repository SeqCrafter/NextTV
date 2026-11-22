import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import * as React from "react";
import * as Navigation from "next/navigation";
import { getBrowseEntry, saveBrowseScrollPosition, useBrowseScrollStore } from "../store/useBrowseScrollStore";
import { useBrowseScrollRestoration } from "./useBrowseScrollRestoration";

const routeSearch = "?q=film&source=one&page=2";

const globalNames = ["window", "document", "requestAnimationFrame", "cancelAnimationFrame", "ResizeObserver"];
const originalGlobals = Object.fromEntries(globalNames.map((name) => [name, globalThis[name]]));
let effect;
let cleanup;
let frames;
let timers;
let observer;
let nextId;

beforeEach(() => {
  effect = undefined;
  cleanup = undefined;
  nextId = 0;
  frames = new Map();
  timers = new Map();
  spyOn(Navigation, "usePathname").mockReturnValue("/search");
  spyOn(Navigation, "useSearchParams").mockImplementation(() => new URLSearchParams(routeSearch));
  spyOn(React, "useRef").mockReturnValue({ current: null });
  spyOn(React, "useLayoutEffect").mockImplementation((callback) => { effect = callback; });
  spyOn(globalThis, "setTimeout").mockImplementation((callback, delay) => {
    const id = ++nextId;
    timers.set(id, { callback, delay });
    return id;
  });
  spyOn(globalThis, "clearTimeout").mockImplementation((id) => { timers.delete(id); });
  globalThis.requestAnimationFrame = (callback) => {
    const id = ++nextId;
    frames.set(id, callback);
    return id;
  };
  globalThis.cancelAnimationFrame = (id) => { frames.delete(id); };
  globalThis.document = { body: {}, scrollingElement: { scrollHeight: 3600 } };
  globalThis.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.observe = mock(() => {});
      this.disconnect = mock(() => {});
      observer = this;
    }
  };
  globalThis.window = Object.assign(new EventTarget(), {
    location: new URL(`https://nexttv.test/search${routeSearch}`),
    innerHeight: 800,
    scrollY: 0,
    history: {
      state: { __NA: true },
      replaceState: (state) => { window.history.state = state; },
    },
    scrollTo: mock(({ top }) => {
      window.scrollY = top;
      window.dispatchEvent(new Event("scroll"));
    }),
  });
  useBrowseScrollStore.setState({ entries: {} });
});

afterEach(() => {
  cleanup?.();
  mock.restore();
  for (const name of globalNames) {
    if (originalGlobals[name] === undefined) delete globalThis[name];
    else globalThis[name] = originalGlobals[name];
  }
});

function RenderEffect(ready = true) {
  useBrowseScrollRestoration(ready);
  return effect();
}

function runFrame() {
  const callbacks = [...frames.values()];
  frames.clear();
  callbacks.forEach((callback) => callback(0));
}

describe("scroll restoration lifecycle", () => {
  test("does not restore before list data is ready", () => {
    cleanup = RenderEffect(false);
    expect(cleanup).toBeUndefined();
    expect(frames.size).toBe(0);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  test("same-page link protection leaves modified clicks and new tabs untouched", () => {
    const listen = spyOn(window, "addEventListener");
    cleanup = RenderEffect();
    const handler = listen.mock.calls.find(([event, , capture]) => event === "click" && capture === true)[1];
    const preventDefault = mock(() => {});
    const link = { href: window.location.href, target: "", hasAttribute: () => false };
    const event = { target: { closest: () => link }, button: 0, preventDefault };
    handler(event);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    handler({ ...event, metaKey: true });
    handler({ ...event, ctrlKey: true });
    link.target = "_blank";
    handler(event);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  test("restores the saved Y after the list and native scroll handling commit", () => {
    const entry = getBrowseEntry();
    useBrowseScrollStore.getState().saveScrollPosition(entry, 950);
    cleanup = RenderEffect();
    runFrame();
    expect(window.scrollTo).not.toHaveBeenCalled();
    runFrame();
    expect(window.scrollY).toBe(950);
    expect(observer.disconnect).toHaveBeenCalled();
  });

  test("a retained list restores after a long video even if its stored snapshot expired", () => {
    const clock = spyOn(Date, "now").mockReturnValue(1000);
    const entry = getBrowseEntry();
    useBrowseScrollStore.getState().saveScrollPosition(entry, 950);
    cleanup = RenderEffect();
    runFrame();
    runFrame();
    cleanup();
    cleanup = undefined;
    clock.mockReturnValue(1000 + 2 * 60 * 60 * 1000);
    expect(useBrowseScrollStore.getState().getScrollPosition(entry)).toBeUndefined();
    window.scrollY = 0;
    cleanup = RenderEffect();
    runFrame();
    runFrame();
    expect(window.scrollY).toBe(950);
  });

  test("waits for layout growth before restoring an initially unreachable Y", () => {
    useBrowseScrollStore.getState().saveScrollPosition(getBrowseEntry(), 950);
    document.scrollingElement.scrollHeight = 900;
    cleanup = RenderEffect();
    runFrame();
    runFrame();
    expect(window.scrollY).toBe(100);
    expect(observer.disconnect).not.toHaveBeenCalled();
    document.scrollingElement.scrollHeight = 3600;
    observer.callback();
    runFrame();
    expect(window.scrollY).toBe(950);
  });

  test("user input cancels a pending restore instead of forcing another jump", () => {
    useBrowseScrollStore.getState().saveScrollPosition(getBrowseEntry(), 1500);
    cleanup = RenderEffect();
    window.scrollY = 300;
    window.dispatchEvent(new Event("wheel"));
    runFrame();
    expect(window.scrollY).toBe(300);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(timers.size).toBe(0);
  });

  test("cleanup saves the observed list Y, not the destination's reset Y", () => {
    const entry = getBrowseEntry();
    useBrowseScrollStore.getState().saveScrollPosition(entry, 950);
    cleanup = RenderEffect();
    runFrame();
    runFrame();
    window.scrollY = 1150;
    window.dispatchEvent(new Event("scroll"));
    window.location = { pathname: "/play/7", search: "?source=one" };
    window.scrollY = 0;
    cleanup();
    cleanup = undefined;
    expect(useBrowseScrollStore.getState().getScrollPosition(entry)).toBe(1150);
    expect(frames.size).toBe(0);
    expect(timers.size).toBe(0);
    window.scrollY = 2000;
    window.dispatchEvent(new Event("scroll"));
    expect(useBrowseScrollStore.getState().getScrollPosition(entry)).toBe(1150);
  });

  test("navigation captures scroll synchronously before the pending debounce", () => {
    const entry = getBrowseEntry();
    cleanup = RenderEffect();
    window.scrollY = 600;
    window.dispatchEvent(new Event("click"));
    saveBrowseScrollPosition();
    window.location = { pathname: "/play/7", search: "?source=one" };
    window.scrollY = 0;
    cleanup();
    cleanup = undefined;
    expect(useBrowseScrollStore.getState().getScrollPosition(entry)).toBe(600);
  });

  test("clamps an unreachable Y and releases observers at the restore deadline", () => {
    useBrowseScrollStore.getState().saveScrollPosition(getBrowseEntry(), 1500);
    document.scrollingElement.scrollHeight = 1000;
    cleanup = RenderEffect();
    runFrame();
    runFrame();
    const [id, timer] = [...timers].find(([, item]) => item.delay === 2000);
    timers.delete(id);
    timer.callback();
    expect(window.scrollY).toBe(200);
    expect(observer.disconnect).toHaveBeenCalled();
    expect(timers.size).toBe(0);
  });
});
