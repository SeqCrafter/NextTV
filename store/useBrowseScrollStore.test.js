import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import {
  getBrowseEntry,
  getBrowseHref,
  isCurrentHref,
  pushBrowseRoute,
  saveBrowseScrollPosition,
  useBrowseScrollStore,
} from "./useBrowseScrollStore";

const originalWindow = globalThis.window;
let storage;

beforeEach(() => {
  storage = new Map();
  globalThis.window = {
    location: new URL("https://nexttv.test/search?q=film&source=one&page=2"),
    scrollY: 0,
    history: {
      state: { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: { tree: ["search"] } },
      replaceState: mock((state) => { window.history.state = state; }),
    },
    sessionStorage: {
      getItem: (name) => storage.get(name) ?? null,
      setItem: (name, value) => storage.set(name, value),
      removeItem: (name) => storage.delete(name),
    },
  };
  useBrowseScrollStore.setState({ entries: {} });
});

afterEach(() => {
  mock.restore();
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
});

describe("browse history and scroll snapshots", () => {
  test("normalizes query ordering and URL encoding", () => {
    expect(getBrowseHref("/search", "?source=one&q=a%20b&page=2"))
      .toBe("/search?page=2&q=a+b&source=one");
    expect(getBrowseHref("/source-browse")).toBe("/source-browse");
  });

  test("tags the current entry without replacing Next's internal history state", () => {
    const tree = window.history.state.__PRIVATE_NEXTJS_INTERNALS_TREE;
    const entry = getBrowseEntry();
    expect(getBrowseEntry()).toEqual(entry);
    expect(window.history.replaceState).toHaveBeenCalledTimes(1);
    expect(window.history.state.__NA).toBe(true);
    expect(window.history.state.__PRIVATE_NEXTJS_INTERNALS_TREE).toBe(tree);
    expect(window.history.replaceState.mock.calls[0]).toHaveLength(2);
  });

  test("keeps separate snapshots for query, page, source and browse route", () => {
    const { saveScrollPosition, getScrollPosition } = useBrowseScrollStore.getState();
    const entries = [
      { id: "a", href: "/search?q=film&source=one&page=2" },
      { id: "b", href: "/search?q=other&source=one&page=2" },
      { id: "c", href: "/search?q=film&source=one&page=3" },
      { id: "d", href: "/source-browse?source=two&category=6&page=2" },
    ];
    entries.forEach((entry, index) => saveScrollPosition(entry, (index + 1) * 100));
    entries.forEach((entry, index) => expect(getScrollPosition(entry)).toBe((index + 1) * 100));
    expect(getScrollPosition({ ...entries[0], href: "/search?q=wrong" })).toBeUndefined();
  });

  test("distinguishes two fresh visits to the same URL", () => {
    const first = getBrowseEntry();
    useBrowseScrollStore.getState().saveScrollPosition(first, 1200);
    window.history.state = { __NA: true };
    const second = getBrowseEntry();
    useBrowseScrollStore.getState().saveScrollPosition(second, 400);
    expect(first.id).not.toBe(second.id);
    expect(useBrowseScrollStore.getState().getScrollPosition(first)).toBe(1200);
    expect(useBrowseScrollStore.getState().getScrollPosition(second)).toBe(400);
  });

  test("back and forward reuse the original entry without consuming its snapshot", () => {
    const first = getBrowseEntry();
    const firstHistory = window.history.state;
    window.scrollY = 800;
    saveBrowseScrollPosition();
    window.history.state = { __NA: true };
    getBrowseEntry();
    window.history.state = firstHistory;
    expect(getBrowseEntry()).toEqual(first);
    expect(useBrowseScrollStore.getState().getScrollPosition(first)).toBe(800);
    expect(useBrowseScrollStore.getState().getScrollPosition(first)).toBe(800);
  });

  test("does not associate a copied entry with different search params", () => {
    const first = getBrowseEntry();
    window.location.search = "?q=film&source=two&page=1";
    const second = getBrowseEntry();
    expect(second.id).not.toBe(first.id);
    expect(second.href).not.toBe(first.href);
  });

  test("same-URL pushes do not let Next discard the current history ID", () => {
    const router = { push: mock(() => { window.history.state = { __NA: true }; }) };
    const entry = getBrowseEntry();
    window.scrollY = 650;
    pushBrowseRoute(router, "/search?page=2&source=one&q=film", { scroll: false });
    expect(router.push).not.toHaveBeenCalled();
    expect(getBrowseEntry()).toEqual(entry);
    expect(useBrowseScrollStore.getState().getScrollPosition(entry)).toBe(650);
  });

  test("genuine navigation saves the outgoing position and keeps navigation options", () => {
    const router = { push: mock(() => {}) };
    const entry = getBrowseEntry();
    window.scrollY = 420;
    pushBrowseRoute(router, "/search?q=film&source=one&page=3", { scroll: false });
    expect(router.push).toHaveBeenCalledWith("/search?q=film&source=one&page=3", { scroll: false });
    expect(useBrowseScrollStore.getState().getScrollPosition(entry)).toBe(420);
  });

  test("hash changes and external origins remain genuine navigations", () => {
    expect(isCurrentHref("/search?page=2&source=one&q=film")).toBe(true);
    expect(isCurrentHref("/search?q=film&source=one&page=2#results")).toBe(false);
    expect(isCurrentHref("https://other.test/search?q=film&source=one&page=2")).toBe(false);
  });

  test("restores persisted snapshots after store rehydration", async () => {
    const entry = getBrowseEntry();
    useBrowseScrollStore.getState().saveScrollPosition(entry, 925);
    const persisted = storage.get("nexttv-browse-scroll");
    useBrowseScrollStore.setState({ entries: {} });
    storage.set("nexttv-browse-scroll", persisted);
    await useBrowseScrollStore.persist.rehydrate();
    expect(useBrowseScrollStore.getState().getScrollPosition(getBrowseEntry())).toBe(925);
  });

  test("preserves an explicit scroll position of zero", () => {
    const entry = getBrowseEntry();
    useBrowseScrollStore.getState().saveScrollPosition(entry, 0);
    expect(useBrowseScrollStore.getState().getScrollPosition(entry)).toBe(0);
  });

  test("normalizes Safari's negative overscroll position to the top of the page", () => {
    const entry = getBrowseEntry();
    window.scrollY = -40;
    saveBrowseScrollPosition();
    expect(useBrowseScrollStore.getState().getScrollPosition(entry)).toBe(0);
  });

  test("expires and prunes snapshots after thirty minutes", () => {
    const clock = spyOn(Date, "now").mockReturnValue(1000);
    const entry = getBrowseEntry();
    useBrowseScrollStore.getState().saveScrollPosition(entry, 500);
    clock.mockReturnValue(1000 + 30 * 60 * 1000);
    expect(useBrowseScrollStore.getState().getScrollPosition(entry)).toBeUndefined();
    useBrowseScrollStore.getState().saveScrollPosition({ id: "new", href: "/search" }, 0);
    expect(useBrowseScrollStore.getState().entries[entry.id]).toBeUndefined();
  });

  test("bounds snapshot memory to the fifty most recently updated entries", () => {
    const clock = spyOn(Date, "now");
    for (let index = 0; index < 55; index++) {
      clock.mockReturnValue(1000 + index);
      useBrowseScrollStore.getState().saveScrollPosition({ id: String(index), href: "/search" }, index);
    }
    const entries = useBrowseScrollStore.getState().entries;
    expect(Object.keys(entries)).toHaveLength(50);
    expect(entries["0"]).toBeUndefined();
    expect(entries["54"].scrollY).toBe(54);
  });

  test("rejects corrupt or expired persisted snapshots", async () => {
    const now = Date.now();
    storage.set("nexttv-browse-scroll", JSON.stringify({ state: { entries: {
      valid: { href: "/search", scrollY: 50, updatedAt: now },
      negative: { href: "/search", scrollY: -50, updatedAt: now },
      invalid: { href: "/search", scrollY: "100", updatedAt: now },
      future: { href: "/search", scrollY: 50, updatedAt: now + 10000 },
      stale: { href: "/search", scrollY: 50, updatedAt: now - 30 * 60 * 1000 },
    } }, version: 0 }));
    await useBrowseScrollStore.persist.rehydrate();
    expect(Object.keys(useBrowseScrollStore.getState().entries)).toEqual(["valid"]);
  });

  test("rejects non-finite or negative scroll positions", () => {
    const entry = getBrowseEntry();
    for (const position of [NaN, Infinity, -1]) {
      useBrowseScrollStore.getState().saveScrollPosition(entry, position);
    }
    expect(useBrowseScrollStore.getState().getScrollPosition(entry)).toBeUndefined();
  });

  test("keeps in-memory restoration when sessionStorage is unavailable", () => {
    Object.defineProperty(window, "sessionStorage", { get: () => { throw new Error("Blocked storage"); } });
    const entry = getBrowseEntry();
    window.scrollY = 700;
    expect(saveBrowseScrollPosition).not.toThrow();
    expect(useBrowseScrollStore.getState().getScrollPosition(entry)).toBe(700);
  });

  test("falls back to URL-scoped snapshots if tagging history is blocked", () => {
    window.history.replaceState = () => { throw new Error("Blocked history"); };
    const entry = getBrowseEntry();
    useBrowseScrollStore.getState().saveScrollPosition(entry, 300);
    expect(useBrowseScrollStore.getState().getScrollPosition(getBrowseEntry())).toBe(300);
  });

  test("player scroll never overwrites list snapshots", () => {
    const entry = getBrowseEntry();
    window.scrollY = 1000;
    saveBrowseScrollPosition();
    window.location = { pathname: "/play/123", search: "?source=one" };
    window.scrollY = 200;
    saveBrowseScrollPosition();
    expect(getBrowseEntry()).toBeNull();
    expect(useBrowseScrollStore.getState().getScrollPosition(entry)).toBe(1000);
  });

  test("can run on the server without browser globals", () => {
    delete globalThis.window;
    expect(getBrowseEntry()).toBeNull();
    expect(saveBrowseScrollPosition).not.toThrow();
  });
});
