"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MaterialSymbolsPlayArrowRounded,
  MaterialSymbolsDirectionsAltOutlineRounded,
  MaterialSymbolsMovieOutlineRounded,
  MaterialSymbolsSearchRounded,
  MaterialSymbolsHistoryRounded,
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
    <div className="w-full max-w-4xl mx-auto pt-6 sm:pt-8 page-enter">
      <div className="mb-6 flex items-center gap-4">
        <div aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-dark">
          <MaterialSymbolsDirectionsAltOutlineRounded className="text-2xl" />
        </div>
        <div>
        <h1 className="text-[28px] sm:text-[34px] leading-snug font-semibold text-ink">
          直链播放
        </h1>
        <p className="mt-1 text-sm text-muted">
          粘贴一个视频链接，留一段时间给自己。
        </p>
        </div>
      </div>

      <div className="surface-panel p-4 sm:p-6 md:p-8 mb-6">
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
              aria-describedby="stream-url-help"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/video.m3u8"
              className="w-full px-4 py-3 text-base rounded-xl border border-line bg-background-light/50 text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-dark/30 focus:border-primary-dark/50 focus:bg-surface-light transition-[border-color,background-color,box-shadow]"
            />
            <p id="stream-url-help" className="mt-2 text-xs leading-6 text-muted">支持 MP4、M3U8 / HLS 等视频直链，实际可播放格式取决于浏览器。</p>
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
              placeholder="为视频取一个名称，方便回顾历史记录"
              className="w-full px-4 py-3 text-base rounded-xl border border-line bg-background-light/50 text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-dark/30 focus:border-primary-dark/50 focus:bg-surface-light transition-[border-color,background-color,box-shadow]"
            />
          </div>
          <button
            type="submit"
            disabled={!url.trim()}
            className="ui-button ui-button-primary w-full min-h-12 text-base btn-press"
          >
            <MaterialSymbolsPlayArrowRounded className="text-xl" aria-hidden="true" />
            开始播放
          </button>
        </form>
      </div>

      <section aria-label="直链播放功能" className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 px-1">
        {[
          {
            Icon: MaterialSymbolsMovieOutlineRounded,
            title: "多格式支持",
            desc: "播放浏览器支持的视频直链与 HLS 流媒体，无需额外转码。",
          },
          {
            Icon: MaterialSymbolsSearchRounded,
            title: "弹幕匹配",
            desc: "播放页右侧可搜索并加载弹幕，让你独自观影也能感受弹幕氛围。",
          },
          {
            Icon: MaterialSymbolsHistoryRounded,
            title: "进度记忆",
            desc: "自动保存播放进度与历史记录，下次打开直链即可从上次位置继续。",
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
      <div className="border-t border-line pt-5 mb-6">
        <h2 className="text-sm font-medium text-ink mb-2">使用提示</h2>
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
      </div>
    </div>
  );
}
