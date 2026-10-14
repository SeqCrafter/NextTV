import { useEffect, useRef, useEffectEvent, useCallback } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";
import { useSettingsStore } from "@/store/useSettingsStore";
import { usePlayHistoryStore } from "@/store/usePlayHistoryStore";
import { CustomHlsJsLoader } from "@/lib/hlsLoader";
import { replaceDanmakuLoader } from "@/lib/artplayerDanmaku";
import { createDanmakuLoaderDirect } from "@/lib/danmakuApi";

// 从 URL 检测视频格式
function detectVideoType(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (pathname.endsWith(".m3u8")) return "m3u8";
    if (pathname.endsWith(".flv")) return "flv";
    if (pathname.endsWith(".ts")) return "ts";
    if (pathname.endsWith(".mp4")) return "mp4";
    if (pathname.endsWith(".mkv")) return "mkv";
    if (pathname.endsWith(".webm")) return "webm";
  } catch {
    // URL 解析失败，降级到字符串匹配
  }
  const lower = url.toLowerCase();
  if (lower.includes(".m3u8")) return "m3u8";
  if (lower.includes(".flv")) return "flv";
  if (lower.includes(".ts")) return "ts";
  if (lower.includes(".mp4")) return "mp4";
  if (lower.includes(".mkv")) return "mkv";
  if (lower.includes(".webm")) return "webm";
  // 默认返回空串，让 Artplayer 自行判断或原生播放
  return "";
}

export function usePlayerDirect({
  currentUrl,
  searchTitle,
  searchPoster,
  searchEpisodeId,
}) {
  const artRef = useRef(null);
  const artPlayerRef = useRef(null);
  const lastSaveTimeRef = useRef(0);
  const blockAdEnabledRef = useRef(useSettingsStore.getState().blockAdEnabled);

  // 设置 no-referrer 防止 CDN 校验 Referer 导致视频加载失败
  useEffect(() => {
    let meta = document.querySelector('meta[name="referrer"]');
    const existed = !!meta;
    const previousContent = meta?.content;

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "referrer";
      document.head.appendChild(meta);
    }
    meta.content = "no-referrer";

    return () => {
      if (existed) {
        meta.content = previousContent;
      } else {
        meta.remove();
      }
    };
  }, []);

  const savePlayProgress = () => {
    if (!artPlayerRef.current || !currentUrl) return;

    const currentTime = artPlayerRef.current.currentTime || 0;
    const duration = artPlayerRef.current.duration || 0;

    if (currentTime < 1 || !duration) return;

    try {
      const { addPlayRecord } = usePlayHistoryStore.getState();

      addPlayRecord({
        source: currentUrl,
        source_name: "直链播放",
        id: '直链',
        title: searchTitle || "未知标题",
        poster:
          searchPoster ||
          "https://tncache1-f1.v3mh.com/image/2026/02/18/f46c4dc098bae2bc83090d709b42d00f.jpg",
        year: new Date().getFullYear(),
        currentEpisodeIndex: 0,
        totalEpisodes: 1,
        currentTime,
        duration,
      });
    } catch (err) {
      console.error("保存播放进度失败:", err);
    }
  };

  const savePlayProgressEvent = useEffectEvent(savePlayProgress);

  // 加载弹幕
  const loadDanmaku = useCallback(() => {
    if (!artPlayerRef.current || !searchEpisodeId) return;

    const { danmakuSources } = useSettingsStore.getState();
    const hasEnabledDanmaku = danmakuSources.some((s) => s.enabled);

    if (hasEnabledDanmaku) {
      void replaceDanmakuLoader(
        artPlayerRef.current.plugins.artplayerPluginDanmuku,
        createDanmakuLoaderDirect(danmakuSources, searchEpisodeId),
      );
      console.log("弹幕加载已触发, episodeId:", searchEpisodeId);
    }
  }, [searchEpisodeId]);

  const loadDanmakuEvent = useEffectEvent(loadDanmaku);

  useEffect(() => {
    loadDanmaku();
  }, [loadDanmaku]);

  useEffect(() => {
    if (!currentUrl || !artRef.current || artPlayerRef.current) {
      return;
    }

    try {
      const { danmakuSources } = useSettingsStore.getState();
      const hasEnabledDanmaku = danmakuSources.some((s) => s.enabled);

      artPlayerRef.current = new Artplayer({
        container: artRef.current,
        url: currentUrl,
        type: detectVideoType(currentUrl),
        title: "直链播放",
        poster: "",
        volume: 0.7,
        isLive: false,
        muted: false,
        autoplay: true,
        pip: true,
        autoSize: false,
        autoMini: false,
        screenshot: false,
        setting: true,
        loop: false,
        flip: false,
        playbackRate: true,
        aspectRatio: false,
        fullscreen: true,
        fullscreenWeb: true,
        subtitleOffset: false,
        miniProgressBar: false,
        mutex: true,
        playsInline: true,
        autoPlayback: false,
        airplay: true,
        theme: "#FAC638",
        lang: "zh-cn",
        hotkey: false,
        fastForward: true,
        autoOrientation: true,
        lock: true,
        moreVideoAttr: {
          playsInline: true,
          'webkit-playsinline': 'true',
          referrerpolicy: 'no-referrer',
        },
        plugins: [
          artplayerPluginDanmuku({
            danmuku: [],
            speed: 7.5,
            opacity: 1,
            fontSize: 23,
            emitter: false,
            color: "#FFFFFF",
            mode: 0,
            margin: [10, "25%"],
            antiOverlap: true,
            useWorker: true,
            synchronousPlayback: true,
            filter: (danmu) => danmu.text.length <= 50,
            lockTime: 5,
            maxLength: 100,
            minWidth: 200,
            maxWidth: 400,
            theme: "dark",
          }),
        ],

        customType: {
          m3u8: function (video, url) {
            if (!Hls || !Hls.isSupported()) {
              video.src = url;
              return;
            }

            if (video.hls) {
              video.hls.destroy();
            }

            const hls = new Hls({
              debug: false,
              enableWorker: true,
              lowLatencyMode: false,
              maxBufferLength: 10,
              backBufferLength: 5,
              maxBufferSize: 80 * 1000 * 1000,
              liveSyncDurationCount: 3,
              loader: blockAdEnabledRef.current
                ? CustomHlsJsLoader
                : Hls.DefaultConfig.loader,
            });

            hls.loadSource(url);
            hls.attachMedia(video);
            video.hls = hls;

            hls.on(Hls.Events.ERROR, function (event, data) {
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    hls.recoverMediaError();
                    break;
                  default:
                    hls.destroy();
                    video.src = url;
                    break;
                }
              }
            });
          },
        },
        settings: [
          {
            html: "弹幕",
            icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM5 8H11V10H5V8ZM5 12H9V14H5V12ZM19 16H5V14H13V16H19ZM19 12H11V10H19V12ZM19 8H13V10H19V8Z" fill="currentColor"/></svg>',
            tooltip: hasEnabledDanmaku ? "已开启" : "已关闭",
            switch: hasEnabledDanmaku,
            onSwitch: function (item) {
              const newVal = !item.switch;
              useSettingsStore.getState().setAllDanmakuSourcesEnabled(newVal);
              if (artPlayerRef.current) {
                if (newVal) {
                  loadDanmakuEvent();
                  artPlayerRef.current.plugins.artplayerPluginDanmuku.show();
                  artPlayerRef.current.notice.show = "弹幕已开启";
                } else {
                  artPlayerRef.current.plugins.artplayerPluginDanmuku.hide();
                  artPlayerRef.current.notice.show = "弹幕已关闭";
                }
              }
              return newVal;
            },
          },
          {
            html: "去广告",
            icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><text x="50%" y="50%" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="currentColor">AD</text></svg>',
            tooltip: blockAdEnabledRef.current ? "已开启" : "已关闭",
            switch: blockAdEnabledRef.current,
            onSwitch: function (item) {
              const newVal = !item.switch;
              useSettingsStore.getState().setBlockAdEnabled(newVal);
              if (artPlayerRef.current) {
                artPlayerRef.current.notice.show = newVal
                  ? "去广告已开启，刷新生效"
                  : "去广告已关闭，刷新生效";
              }
              return newVal;
            },
          },
        ],
      });

      artPlayerRef.current.on("ready", () => {
        console.log("播放器就绪");
      });

      artPlayerRef.current.once("video:canplay", () => {
        const playRecord = usePlayHistoryStore
          .getState()
          .getPlayRecord(currentUrl, '直链');
        const initialTime = playRecord?.currentTime || 0;
        if (initialTime > 0) {
          try {
            const duration = artPlayerRef.current.duration || 0;
            let target = initialTime;
            if (duration && target >= duration - 2) {
              target = Math.max(0, duration - 5);
            }
            artPlayerRef.current.currentTime = target;
            artPlayerRef.current.notice.show = `已恢复到 ${Math.floor(target / 60)}:${String(Math.floor(target % 60)).padStart(2, "0")}`;
          } catch (err) {
            console.warn("恢复播放进度失败:", err);
          }
        }
      });

      artPlayerRef.current.on("video:timeupdate", () => {
        const now = Date.now();
        if (now - lastSaveTimeRef.current > 5000) {
          savePlayProgressEvent();
          lastSaveTimeRef.current = now;
        }
      });

      artPlayerRef.current.on("pause", () => {
        savePlayProgressEvent();
      });

      artPlayerRef.current.on("error", (err) => {
        console.error("播放器错误:", err);
      });
    } catch (err) {
      console.error("创建播放器失败:", err);
    }

    return () => {
      if (artPlayerRef.current) {
        try {
          if (artPlayerRef.current.video?.hls) {
            artPlayerRef.current.video.hls.destroy();
          }
          if (artPlayerRef.current.video?.mpegtsPlayer) {
            artPlayerRef.current.video.mpegtsPlayer.destroy();
          }
          artPlayerRef.current.destroy();
          artPlayerRef.current = null;
        } catch (err) {
          console.warn("清理播放器资源时出错:", err);
          artPlayerRef.current = null;
        }
      }
    };
  }, [currentUrl]);

  useEffect(() => {
    const handleKeyboardShortcuts = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      if (!e.altKey && e.key === "ArrowLeft") {
        if (artPlayerRef.current && artPlayerRef.current.currentTime > 5) {
          artPlayerRef.current.currentTime -= 10;
          e.preventDefault();
        }
      }

      if (!e.altKey && e.key === "ArrowRight") {
        if (
          artPlayerRef.current &&
          artPlayerRef.current.currentTime < artPlayerRef.current.duration - 5
        ) {
          artPlayerRef.current.currentTime += 10;
          e.preventDefault();
        }
      }

      if (e.key === "ArrowUp") {
        if (artPlayerRef.current && artPlayerRef.current.volume < 1) {
          artPlayerRef.current.volume =
            Math.round((artPlayerRef.current.volume + 0.1) * 10) / 10;
          artPlayerRef.current.notice.show = `Volume: ${Math.round(artPlayerRef.current.volume * 100)}`;
          e.preventDefault();
        }
      }

      if (e.key === "ArrowDown") {
        if (artPlayerRef.current && artPlayerRef.current.volume > 0) {
          artPlayerRef.current.volume =
            Math.round((artPlayerRef.current.volume - 0.1) * 10) / 10;
          artPlayerRef.current.notice.show = `Volume: ${Math.round(artPlayerRef.current.volume * 100)}`;
          e.preventDefault();
        }
      }

      if (e.key === " ") {
        if (artPlayerRef.current) {
          artPlayerRef.current.toggle();
          e.preventDefault();
        }
      }

      if (e.key === "f" || e.key === "F") {
        if (artPlayerRef.current) {
          artPlayerRef.current.fullscreen = !artPlayerRef.current.fullscreen;
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleKeyboardShortcuts);
    return () => {
      document.removeEventListener("keydown", handleKeyboardShortcuts);
    };
  }, []);

  useEffect(() => {
    window.addEventListener("beforeunload", savePlayProgressEvent);
    return () => {
      window.removeEventListener("beforeunload", savePlayProgressEvent);
    };
  }, []);

  return { artRef };
}
