"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MaterialSymbolsPlayArrowRounded,
  MaterialSymbolsDirectionsAltOutlineRounded,
  MaterialSymbolsMovieOutlineRounded,
  MaterialSymbolsSearchRounded,
  MaterialSymbolsHistoryRounded,
  MaterialSymbolsChevronRightRounded,
} from "@/components/icons";

export default function DirectInputPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  const handlePlay = () => {
    if (!url.trim()) return;
    const params = new URLSearchParams({
      playerurl: url.trim(),
      title: title.trim(),
    });
    router.push(`/direct?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto pt-5 sm:pt-6 page-enter">
      <header className="mb-5 sm:mb-6 flex items-center gap-3">
        <div aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-dark">
          <MaterialSymbolsDirectionsAltOutlineRounded className="text-xl" />
        </div>
        <h1 className="page-heading">
          直链播放
        </h1>
        <span className="ml-auto text-xs text-muted">MP4 / M3U8 / HLS</span>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_304px] xl:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
      <section aria-label="视频链接" className="rounded-2xl bg-surface-light p-5 sm:p-7">
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handlePlay(); }}>
          <div>
            <label htmlFor="stream-url" className="block text-sm font-medium text-ink mb-2">
              播放链接 <span aria-hidden="true" className="text-rose-700">*</span>
            </label>
            <input
              id="stream-url"
              type="text"
              inputMode="url"
              required
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-describedby="stream-url-help"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/video.m3u8"
              className="ui-input"
            />
            <p id="stream-url-help" className="mt-2 text-xs leading-6 text-muted">粘贴视频文件或 M3U8 播放列表的完整链接。</p>
          </div>
          <div>
            <label htmlFor="stream-title" className="block text-sm font-medium text-ink mb-2">
              视频标题{" "}
              <span className="text-muted font-normal text-xs">
                (可选)
              </span>
            </label>
            <input
              id="stream-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="为视频取个名字，方便在历史中找到"
              className="ui-input"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
          <p className="text-xs leading-6 text-muted">播放进度保存在当前浏览器，下次可以接着看。</p>
          <button
            type="submit"
            disabled={!url.trim()}
            className="ui-button ui-button-primary w-full sm:w-auto sm:min-w-36 min-h-12 shrink-0 text-base btn-press"
          >
            <MaterialSymbolsPlayArrowRounded className="text-xl" aria-hidden="true" />
            开始播放
          </button>
          </div>
        </form>
      </section>

      <aside aria-label="播放说明" className="space-y-6">
        <div aria-hidden="true" className="hidden lg:flex aspect-video items-center justify-center rounded-2xl bg-cinema">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary"><MaterialSymbolsPlayArrowRounded className="text-3xl text-[var(--color-primary)]" /></div>
        </div>
      <section aria-label="直链播放功能" className="space-y-5 px-1">
        {[
          {
            Icon: MaterialSymbolsMovieOutlineRounded,
            title: "视频直链",
            desc: "支持 MP4 和 HLS 流媒体，具体格式取决于浏览器。",
          },
          {
            Icon: MaterialSymbolsSearchRounded,
            title: "弹幕匹配",
            desc: "播放时可搜索片名，选择对应版本和集数。",
          },
          {
            Icon: MaterialSymbolsHistoryRounded,
            title: "继续观看",
            desc: "可从观看历史重新打开视频，恢复上次的进度。",
          },
        ].map(({ Icon, title, desc }) => (
          <div
            key={title}
            className="flex items-start gap-3"
          >
            <Icon className="text-xl text-primary-dark shrink-0 mt-0.5" aria-hidden="true" />
            <div><h2 className="text-sm font-medium text-ink mb-1">{title}</h2>
            <p className="text-xs text-muted leading-6">{desc}</p></div>
          </div>
        ))}
      </section>

      {/* Usage Tips */}
      <details className="group px-1">
        <summary className="flex min-h-11 items-center gap-2 text-sm font-medium text-ink cursor-pointer"><MaterialSymbolsChevronRightRounded className="text-lg transition-transform group-open:rotate-90" aria-hidden="true" />获取链接与使用提示</summary>
        <ul className="text-xs text-muted leading-6 space-y-1 list-disc pl-4">
          <li>
            推荐使用{" "}
            <a
              href="https://openlist.cc"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-amber-900 transition-colors"
            >
              OpenList
            </a>{" "}
            等网盘直链工具获取高清视频链接
          </li>
          <li>支持直接粘贴 m3u8 地址，播放器将自动解析 HLS 流</li>
          <li>填写标题有助于在观看历史中快速找到该视频</li>
        </ul>
      </details>
      </aside>
      </div>
    </div>
  );
}
