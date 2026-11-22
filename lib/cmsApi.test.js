import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { searchVideos } from "./cmsApi";

const originalFetch = globalThis.fetch;
const source = { id: "one", key: "one", name: "Test source", url: "https://example.test/api", enabled: true };

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restore();
});

describe("search request lifecycle", () => {
  test("cancels every in-flight request when the list becomes hidden", async () => {
    const signals = [];
    const errors = spyOn(console, "error").mockImplementation(() => {});
    globalThis.fetch = mock((_url, options) => new Promise((_resolve, reject) => {
      signals.push(options.signal);
      options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    }));
    const controller = new AbortController();
    const request = searchVideos("film", [source, { ...source, key: "two" }], 2, undefined, controller.signal);
    controller.abort();
    const result = await request;
    expect(signals).toHaveLength(2);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
    expect(result.results).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
  });

  test("passes an already-aborted signal to fetch without logging a timeout", async () => {
    const errors = spyOn(console, "error").mockImplementation(() => {});
    globalThis.fetch = mock((_url, options) => {
      expect(options.signal.aborted).toBe(true);
      return Promise.reject(new DOMException("Aborted", "AbortError"));
    });
    const controller = new AbortController();
    controller.abort();
    await searchVideos("film", [source], 1, source.key, controller.signal);
    expect(errors).not.toHaveBeenCalled();
  });

  test("retains normal search results and pagination with a cancellation signal", async () => {
    globalThis.fetch = mock(() => Promise.resolve(new Response(JSON.stringify({
      pagecount: 4,
      list: [{ vod_id: 7, vod_name: "Film", vod_play_url: "Episode$https://example.test/video.m3u8" }],
    }))));
    const result = await searchVideos("film", [source], 3, source.key, new AbortController().signal);
    expect(result.results[0].id).toBe("7");
    expect(result.results[0].source).toBe("one");
    expect(result.pageCount).toBe(4);
    expect(result.failed).toBe(false);
    const apiUrl = new URL(globalThis.fetch.mock.calls[0][0], "https://nexttv.test").searchParams.get("apiUrl");
    expect(apiUrl).toBe("https://example.test/api?ac=detail&wd=film&pg=3");
  });
});
