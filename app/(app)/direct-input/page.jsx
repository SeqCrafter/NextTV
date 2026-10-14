"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MaterialSymbolsPlayArrowRounded,
  MaterialSymbolsDirectionsAltOutlineRounded,
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
    <div className="w-full max-w-4xl mx-auto page-enter">
      {/* Hero Section */}
      <div className="text-center mt-4 sm:mt-8 mb-6 sm:mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
          <MaterialSymbolsDirectionsAltOutlineRounded className="text-3xl text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          直链播放
        </h1>
        <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
          粘贴视频直链，即刻畅享播放体验
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 md:p-8 shadow-soft mb-6 sm:mb-10">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              播放链接 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePlay()}
              placeholder="粘贴 m3u8、mp4、flv 等视频链接…"
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary focus:bg-white transition-all"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              视频标题{" "}
              <span className="text-gray-400 font-normal text-xs">
                (可选)
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePlay()}
              placeholder="为视频取一个名称，方便回顾历史记录"
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary focus:bg-white transition-all"
            />
          </div>
          <button
            onClick={handlePlay}
            disabled={!url.trim()}
            className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md btn-press"
          >
            <MaterialSymbolsPlayArrowRounded className="text-xl" />
            开始播放
          </button>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          {
            emoji: "🎬",
            title: "多格式支持",
            desc: "兼容 M3U8 / HLS、MP4、FLV、TS 等主流视频格式，无需额外转码。",
          },
          {
            emoji: "💬",
            title: "弹幕互动",
            desc: "播放页右侧可搜索并加载弹幕，让你独自观影也能感受弹幕氛围。",
          },
          {
            emoji: "📝",
            title: "进度记忆",
            desc: "自动保存播放进度与历史记录，下次打开直链即可从上次位置继续。",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-card transition-shadow"
          >
            <div className="text-2xl mb-3">{item.emoji}</div>
            <h3 className="font-bold text-gray-900 mb-1.5">{item.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Usage Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-10">
        <h4 className="font-bold text-amber-800 mb-2">💡 使用提示</h4>
        <ul className="text-sm text-amber-700 space-y-1.5 list-disc list-inside">
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
