import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { Activity, act, useState } from "react";
import { createPortal } from "react-dom";
import { Window } from "happy-dom";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext, PathParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { useSearchParams } from "next/navigation";
import { useRetainedRoute } from "./useRetainedRoute";
import { useActivityPortal } from "./useActivityPortal";

let testWindow;
let createRoot;
let SearchContent;
let SourceBrowsePage;
let MotionProvider;
let useVideoData;
let settingsStore;
let historyStore;
let scrollStore;
let originalSettings;
let originalHistory;
let originalGlobals;
let originalAnimate;
let container;
let root;
let requests;
const originalFetch = globalThis.fetch;
const sources = [
  { id: "one", key: "one", name: "Source One", url: "https://cms.test/one", enabled: true },
  { id: "two", key: "two", name: "Source Two", url: "https://cms.test/two", enabled: true },
];
const fixture = {
  pagecount: 4,
  total: 120,
  class: [{ type_id: "2", type_name: "Action" }],
  list: [{
    vod_id: "7", vod_name: "Film", vod_pic: "/poster.png", vod_year: "2026",
    vod_remarks: "HD", type_name: "movie", vod_content: "A film.",
    vod_play_from: "test", vod_play_url: "Episode$https://example.test/video.m3u8",
  }],
};
const router = {
  push: () => {}, replace: () => {}, prefetch: () => {}, refresh: () => {},
  back: () => {}, forward: () => {}, bfcacheId: "activity-test",
};

beforeAll(async () => {
  testWindow = new Window({ url: "https://nexttv.test/search?q=film&source=two&page=3" });
  // Happy DOM is not a compositor; exercise Motion's JS fallback, not partial WAAPI.
  originalAnimate = Object.getOwnPropertyDescriptor(testWindow.Element.prototype, "animate");
  delete testWindow.Element.prototype.animate;
  const globals = {
    window: testWindow, document: testWindow.document, navigator: testWindow.navigator,
    HTMLElement: testWindow.HTMLElement, HTMLIFrameElement: testWindow.HTMLIFrameElement,
    HTMLInputElement: testWindow.HTMLInputElement, SVGElement: testWindow.SVGElement,
    Element: testWindow.Element, Node: testWindow.Node, Event: testWindow.Event,
    MouseEvent: testWindow.MouseEvent, MutationObserver: testWindow.MutationObserver,
    ResizeObserver: testWindow.ResizeObserver, localStorage: testWindow.localStorage,
    sessionStorage: testWindow.sessionStorage, getComputedStyle: testWindow.getComputedStyle.bind(testWindow),
    requestAnimationFrame: testWindow.requestAnimationFrame.bind(testWindow),
    cancelAnimationFrame: testWindow.cancelAnimationFrame.bind(testWindow),
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  originalGlobals = Object.fromEntries(Object.keys(globals).map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  for (const [name, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  ({ createRoot } = await import("react-dom/client"));
  ({ default: SearchContent } = await import("../components/SearchContent"));
  ({ default: SourceBrowsePage } = await import("../app/(app)/source-browse/page"));
  ({ MotionProvider } = await import("../components/MotionProvider"));
  ({ useVideoData } = await import("./useVideoData"));
  ({ useSettingsStore: settingsStore } = await import("../store/useSettingsStore"));
  ({ usePlayHistoryStore: historyStore } = await import("../store/usePlayHistoryStore"));
  ({ useBrowseScrollStore: scrollStore } = await import("../store/useBrowseScrollStore"));
  originalSettings = settingsStore.getState();
  originalHistory = historyStore.getState();
});

beforeEach(() => {
  testWindow.history.replaceState(null, "", "https://nexttv.test/search?q=film&source=two&page=3");
  settingsStore.setState({ videoSources: sources });
  historyStore.setState({ playHistory: [] });
  scrollStore.setState({ entries: {} });
  requests = mock(() => Promise.resolve(new Response(JSON.stringify(fixture), {
    headers: { "Content-Type": "application/json" },
  })));
  globalThis.fetch = requests;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  globalThis.fetch = originalFetch;
  mock.restore();
});

afterAll(async () => {
  settingsStore.setState(originalSettings);
  historyStore.setState(originalHistory);
  await testWindow.happyDOM.abort();
  if (originalAnimate) Object.defineProperty(testWindow.Element.prototype, "animate", originalAnimate);
  for (const [name, descriptor] of Object.entries(originalGlobals)) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
});

function Harness({ Component, url, hidden, params }) {
  const location = new URL(url, "https://nexttv.test");
  return (
    <AppRouterContext.Provider value={router}>
      <PathnameContext.Provider value={location.pathname}>
        <SearchParamsContext.Provider value={location.searchParams}>
          <PathParamsContext.Provider value={params}>
            <Activity mode={hidden ? "hidden" : "visible"}>
              <MotionProvider><Component /></MotionProvider>
            </Activity>
          </PathParamsContext.Provider>
        </SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>
  );
}

async function renderRoute(Component, url, hidden = false, params = {}) {
  window.history.replaceState(window.history.state, "", url);
  await act(async () => {
    root.render(<Harness Component={Component} url={url} hidden={hidden} params={params} />);
  });
}

function VideoDataProbe() {
  const { params, searchParams } = useRetainedRoute();
  const [episode, setEpisode] = useState(0);
  const { videoDetail, loading } = useVideoData(params.id, searchParams.get("source"), setEpisode);
  return loading ? <p data-loading>Loading</p> : <article data-detail>{videoDetail?.title}:{episode}</article>;
}

function PortalProbe() {
  const portal = useActivityPortal();
  return portal ? createPortal(<div role="dialog">Open dialog</div>, portal) : null;
}

function UnprotectedRouteProbe() {
  const query = useSearchParams().get("q") || "empty";
  return <article key={query} data-unprotected>{query}</article>;
}

describe("real React Activity route retention", () => {
  test("the control case really re-renders hidden children with the global URL", async () => {
    await renderRoute(UnprotectedRouteProbe, "/search?q=film");
    const original = container.querySelector("[data-unprotected]");
    await renderRoute(UnprotectedRouteProbe, "/play/7?source=two", true, { id: "7" });
    expect(original.isConnected).toBe(false);
    expect(container.querySelector("[data-unprotected]").textContent).toBe("empty");
  });

  test("search keeps the exact card DOM and does not refetch when the global URL becomes /play", async () => {
    const href = "/search?q=film&source=two&page=3";
    await renderRoute(SearchContent, href);
    const cardLink = document.querySelector('a[href^="/play/"]');
    expect(cardLink).not.toBeNull();
    const searchInput = container.querySelector('input[type="search"]');
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(testWindow.HTMLInputElement.prototype, "value").set;
      setter.call(searchInput, "unsent draft");
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const count = requests.mock.calls.length;
    await renderRoute(SearchContent, "/play/7?source=one", true, { id: "7" });
    expect(cardLink.isConnected).toBe(true);
    expect(container.querySelector('a[href^="/play/"]')).toBe(cardLink);
    await renderRoute(SearchContent, href);
    expect(container.querySelector('a[href^="/play/"]')).toBe(cardLink);
    expect(searchInput.value).toBe("unsent draft");
    expect(container.querySelector('[aria-current="page"]').textContent).toBe("3");
    expect(requests.mock.calls.length).toBe(count);
  });

  test("an older hidden search is not overwritten by another search route's query", async () => {
    const href = "/search?q=film&source=two&page=3";
    await renderRoute(SearchContent, href);
    const cardLink = container.querySelector('a[href^="/play/"]');
    const count = requests.mock.calls.length;
    await renderRoute(SearchContent, "/play/7?source=two", true, { id: "7" });
    await renderRoute(SearchContent, "/search?q=other&source=one&page=1", true);
    expect(cardLink.isConnected).toBe(true);
    expect(container.querySelector('a[href^="/play/"]')).toBe(cardLink);
    await renderRoute(SearchContent, href);
    expect(requests.mock.calls.length).toBe(count);
  });

  test("source browsing keeps its selected source, category, page and card DOM while hidden", async () => {
    const href = "/source-browse?source=two&category=2&page=3";
    await renderRoute(SourceBrowsePage, href);
    const cardLink = container.querySelector('a[href^="/play/"]');
    expect(cardLink).not.toBeNull();
    const count = requests.mock.calls.length;
    await renderRoute(SourceBrowsePage, "/play/7?source=one", true, { id: "7" });
    expect(cardLink.isConnected).toBe(true);
    expect(container.querySelector('[role="combobox"]').textContent).toContain("Source Two");
    expect(container.querySelector('[aria-current="page"]').textContent).toBe("3");
    await renderRoute(SourceBrowsePage, href);
    expect(container.querySelector('a[href^="/play/"]')).toBe(cardLink);
    expect(requests.mock.calls.length).toBe(count);
  });

  test("a visible query change still loads the new page", async () => {
    await renderRoute(SearchContent, "/search?q=film&source=two&page=3");
    const count = requests.mock.calls.length;
    await renderRoute(SearchContent, "/search?q=film&source=two&page=4");
    expect(requests.mock.calls.length).toBe(count + 1);
    expect(container.querySelector('[aria-current="page"]').textContent).toBe("4");
  });

  test("same-page navbar/footer links cannot discard a list's history ID", async () => {
    await renderRoute(SourceBrowsePage, "/source-browse");
    const entry = window.history.state.__nexttvBrowseEntry;
    expect(entry).toBeDefined();
    const link = document.createElement("a");
    link.href = "/source-browse";
    link.addEventListener("click", (event) => {
      if (!event.defaultPrevented) window.history.replaceState({ __NA: true }, "", link.href);
    });
    container.appendChild(link);
    await act(async () => {
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    });
    expect(window.history.state.__nexttvBrowseEntry).toEqual(entry);
  });

  test("playback details remain loaded across hide/reveal without another fetch or spinner", async () => {
    const href = "/play/7?source=two";
    await renderRoute(VideoDataProbe, href, false, { id: "7" });
    const detail = container.querySelector("[data-detail]");
    expect(detail?.textContent).toBe("Film:0");
    const count = requests.mock.calls.length;
    await renderRoute(VideoDataProbe, "/search?q=other&source=one", true);
    expect(detail.isConnected).toBe(true);
    await renderRoute(VideoDataProbe, href, false, { id: "7" });
    expect(container.querySelector("[data-detail]")).toBe(detail);
    expect(container.querySelector("[data-loading]")).toBeNull();
    expect(requests.mock.calls.length).toBe(count);
  });

  test("body portals are detached synchronously on hide and do not accumulate on reveal", async () => {
    const href = "/source-browse?source=two";
    for (let index = 0; index < 3; index++) {
      await renderRoute(PortalProbe, href);
      expect(document.querySelectorAll("[data-activity-portal]")).toHaveLength(1);
      expect(document.querySelector('[role="dialog"]')).not.toBeNull();
      await renderRoute(PortalProbe, "/play/7?source=two", true, { id: "7" });
      expect(document.querySelectorAll("[data-activity-portal]")).toHaveLength(0);
      expect(document.querySelector('[role="dialog"]')).toBeNull();
    }
  });
});
