import { useEffect, useRef, useEffectEvent } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";
import { useSettingsStore } from "@/store/useSettingsStore";
import { usePlayHistoryStore } from "@/store/usePlayHistoryStore";
import { formatTime, CustomHlsJsLoader } from "@/lib/util";
import { createDanmakuLoader } from "@/lib/danmakuApi";
export function usePlayer({
  videoDetail,
  currentEpisodeIndex,
  setCurrentEpisodeIndex,
}) {
  const artRef = useRef(null);
  const artPlayerRef = useRef(null);
  const lastSkipCheckRef = useRef(0);
  const lastSaveTimeRef = useRef(0);
  const blockAdEnabledRef = useRef(useSettingsStore.getState().blockAdEnabled);
  const skipConfigRef = useRef(useSettingsStore.getState().skipConfig);
  const isSwitchingEpisodeRef = useRef(false); // 标记是否正在切换剧集
  const prevEpisodeIndexRef = useRef(currentEpisodeIndex); // 记录上一次的剧集索引
  const CurrentEpisodeIndexEvent = useEffectEvent(() => {
    return currentEpisodeIndex;
  });

  const savePlayProgress = () => {
    if (!artPlayerRef.current || !videoDetail) return;

    // 如果正在切换剧集，跳过保存（避免保存错误的 currentTime）
    if (isSwitchingEpisodeRef.current) return;

    const currentTime = artPlayerRef.current.currentTime || 0;
    const duration = artPlayerRef.current.duration || 0;

    if (currentTime < 1 || !duration) return;

    try {
      const { addPlayRecord } = usePlayHistoryStore.getState();

      addPlayRecord({
        source: videoDetail.source,
        source_name: videoDetail.source_name,
        id: videoDetail.id,
        title: videoDetail.title,
        poster: videoDetail.poster,
        year: videoDetail.year,
        currentEpisodeIndex,
        totalEpisodes: videoDetail.episodes?.length || 1,
        currentTime,
        duration,
      });
      console.log("播放进度已保存:", {
        title: videoDetail.title,
        episode: currentEpisodeIndex + 1,
        progress: `${Math.floor(currentTime)}/${Math.floor(duration)}`,
      });
    } catch (err) {
      console.error("保存播放进度失败:", err);
    }
  };
  const savePlayProgressEvent = useEffectEvent(savePlayProgress);

  // 加载当前剧集的弹幕
  const loadDanmaku = () => {
    if (!videoDetail || !artPlayerRef.current) return;

    const currentTitle =
      videoDetail.episodes_titles?.[currentEpisodeIndex] ||
      `第 ${currentEpisodeIndex + 1} 集`;

    const { danmakuSources } = useSettingsStore.getState();
    const hasEnabledDanmaku = danmakuSources.some((s) => s.enabled);

    if (hasEnabledDanmaku) {
      const isMovie = videoDetail.episodes?.length === 1;
      artPlayerRef.current.plugins.artplayerPluginDanmuku.config({
        danmuku: createDanmakuLoader(
          danmakuSources,
          videoDetail.douban_id,
          currentTitle,
          currentEpisodeIndex,
          isMovie,
        ),
      });
      artPlayerRef.current.plugins.artplayerPluginDanmuku.load();
      console.log("弹幕加载已触发");
    }
  };
  const loadDanmakuEvent = useEffectEvent(loadDanmaku);

  const switchToEpisode = () => {
    if (!videoDetail || !artPlayerRef.current) return;

    const currentUrl = videoDetail.episodes?.[currentEpisodeIndex];
    const currentTitle =
      videoDetail.episodes_titles?.[currentEpisodeIndex] ||
      `第 ${currentEpisodeIndex + 1} 集`;

    if (!currentUrl) {
      console.error("Invalid episode index:", currentEpisodeIndex);
      return;
    }

    console.log("Switching to episode:", currentEpisodeIndex + 1);

    // 标记开始切换剧集，阻止保存错误的进度
    isSwitchingEpisodeRef.current = true;

    // 1. 切换播放源 && 清空弹幕
    artPlayerRef.current.switch = currentUrl;
    artPlayerRef.current.title = `${videoDetail.title} - ${currentTitle}`;
    artPlayerRef.current.poster =
      videoDetail?.backdrop || videoDetail?.poster || "";
    artPlayerRef.current.plugins.artplayerPluginDanmuku.reset();
    artPlayerRef.current.plugins.artplayerPluginDanmuku.config({
      danmuku: [],
    });
    artPlayerRef.current.plugins.artplayerPluginDanmuku.load();
    console.log("Cleared danmaku");

    // 2. 加载弹幕（仅当有启用的弹幕源时）
    const { danmakuSources } = useSettingsStore.getState();
    const hasEnabledDanmaku = danmakuSources.some((s) => s.enabled);
    if (hasEnabledDanmaku) {
      const isMovie = videoDetail.episodes?.length === 1;
      artPlayerRef.current.plugins.artplayerPluginDanmuku.config({
        danmuku: createDanmakuLoader(
          danmakuSources,
          videoDetail.douban_id,
          currentTitle,
          currentEpisodeIndex,
          isMovie,
        ),
      });
      artPlayerRef.current.plugins.artplayerPluginDanmuku.load();
      console.log("弹幕加载已触发");
    } else {
      console.log("没有启用的弹幕源，跳过加载弹幕");
    }

    // 3. 监听新视频开始播放，重置切换标志
    artPlayerRef.current.once("video:canplay", () => {
      isSwitchingEpisodeRef.current = false;
      console.log("新剧集已就绪，恢复进度保存");
    });
  };

  const switchToEpisodeEvent = useEffectEvent(switchToEpisode);

  useEffect(() => {
    if (!videoDetail || !artRef.current || artPlayerRef.current) {
      return;
    }

    const isIOS =
      typeof navigator !== "undefined" &&
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      typeof window !== "undefined" &&
      !window.MSStream;

    try {
      console.log("重新初始化播放器了！");
      const realtimeCurrentEpisodeIndex = CurrentEpisodeIndexEvent();
      console.log("realtimeCurrentEpisodeIndex", realtimeCurrentEpisodeIndex);
      const currentUrl =
        videoDetail?.episodes?.[realtimeCurrentEpisodeIndex] || "";
      const currentTitle =
        videoDetail?.episodes_titles?.[realtimeCurrentEpisodeIndex] ||
        `第${realtimeCurrentEpisodeIndex + 1}集`;

      const { danmakuSources } = useSettingsStore.getState();
      const hasEnabledDanmaku = danmakuSources.some((s) => s.enabled);

      // 根据是否有启用的弹幕源决定是否加载弹幕
      const danmakuLoader = hasEnabledDanmaku
        ? createDanmakuLoader(
          danmakuSources,
          videoDetail.douban_id,
          currentTitle,
          realtimeCurrentEpisodeIndex,
          videoDetail.episodes?.length === 1,
        )
        : () => Promise.resolve([]);

      artPlayerRef.current = new Artplayer({
        container: artRef.current,
        url: currentUrl,
        title: `${videoDetail.title} - ${currentTitle}`,
        poster: videoDetail?.backdrop || videoDetail?.poster || "",
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
          crossOrigin: "anonymous",
        },
        plugins: [
          artplayerPluginDanmuku({
            danmuku: danmakuLoader,
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
              console.warn("HLS.js 不支持，降级到原生播放（去广告功能不可用）");
              video.src = url;
              return;
            }

            console.log("使用 HLS.js 播放（去广告功能已启用）");

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
                console.error("HLS 致命错误:", data.type, data.details);
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.log("网络错误，尝试恢复...");
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log("媒体错误，尝试恢复...");
                    hls.recoverMediaError();
                    break;
                  default:
                    console.log("无法恢复的错误，回退到原生播放");
                    hls.destroy();
                    video.src = url;
                    break;
                }
              } else {
                console.warn("HLS 非致命错误:", data.details);
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
                  // 开启弹幕：加载弹幕并显示弹幕层
                  loadDanmakuEvent();
                  artPlayerRef.current.plugins.artplayerPluginDanmuku.show();
                  artPlayerRef.current.notice.show = "弹幕已开启";
                } else {
                  // 关闭弹幕：隐藏弹幕层
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
          {
            html: "跳过片头片尾",
            tooltip: skipConfigRef.current.enable ? "已开启" : "已关闭",
            switch: skipConfigRef.current.enable,
            onSwitch: function (item) {
              const currentSkipConfig = useSettingsStore.getState().skipConfig;
              const newConfig = {
                ...currentSkipConfig,
                enable: !item.switch,
              };
              useSettingsStore.getState().setSkipConfig(newConfig);
              if (artPlayerRef.current) {
                artPlayerRef.current.notice.show = newConfig.enable
                  ? "跳过片头片尾已开启"
                  : "跳过片头片尾已关闭";
              }
              return !item.switch;
            },
          },
          {
            html: "设置片头",
            icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="12" r="2" fill="currentColor"/><path d="M10 12L17 12" stroke="currentColor" stroke-width="2"/><path d="M17 7L17 17" stroke="currentColor" stroke-width="2"/></svg>',
            tooltip:
              skipConfigRef.current.intro_time === 0
                ? "点击设置片头时间"
                : `片头：${formatTime(skipConfigRef.current.intro_time)}`,
            onClick: function () {
              if (artPlayerRef.current) {
                const currentTime = artPlayerRef.current.currentTime || 0;
                if (currentTime > 0) {
                  const currentSkipConfig =
                    useSettingsStore.getState().skipConfig;
                  const newConfig = {
                    ...currentSkipConfig,
                    intro_time: currentTime,
                  };
                  useSettingsStore.getState().setSkipConfig(newConfig);
                  artPlayerRef.current.notice.show = `片头已设置：${formatTime(currentTime)}`;
                  return `片头：${formatTime(currentTime)}`;
                }
              }
            },
          },
          {
            html: "设置片尾",
            icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 7L7 17" stroke="currentColor" stroke-width="2"/><path d="M7 12L14 12" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="12" r="2" fill="currentColor"/></svg>',
            tooltip:
              skipConfigRef.current.outro_time >= 0
                ? "点击设置片尾时间"
                : `片尾：${formatTime(-skipConfigRef.current.outro_time)}`,
            onClick: function () {
              if (artPlayerRef.current) {
                const outroTime =
                  -(
                    artPlayerRef.current.duration -
                    artPlayerRef.current.currentTime
                  ) || 0;
                if (outroTime < 0) {
                  const currentSkipConfig =
                    useSettingsStore.getState().skipConfig;
                  const newConfig = {
                    ...currentSkipConfig,
                    outro_time: outroTime,
                  };
                  useSettingsStore.getState().setSkipConfig(newConfig);
                  artPlayerRef.current.notice.show = `片尾已设置：${formatTime(-outroTime)}`;
                  return `片尾：${formatTime(-outroTime)}`;
                }
              }
            },
          },
          {
            html: "清除跳过配置",
            icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
            onClick: function () {
              const newConfig = { enable: false, intro_time: 0, outro_time: 0 };
              useSettingsStore.getState().setSkipConfig(newConfig);
              if (artPlayerRef.current) {
                artPlayerRef.current.notice.show = "跳过配置已清除";
              }
              return "已清除";
            },
          },
        ],

        controls: [
          {
            position: "left",
            index: 11,
            html: '<button class="art-icon art-icon-next" style="display: flex; align-items: center; justify-content: center; cursor: pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>',
            tooltip: "下一集",
            click: () => {
              // 每次点击时获取最新的 episodeIndex
              const currentIdx = CurrentEpisodeIndexEvent();
              if (
                videoDetail &&
                videoDetail.episodes &&
                currentIdx < videoDetail.episodes.length - 1
              ) {
                // 仅更新状态，由 Effect 触发切换和保存
                setCurrentEpisodeIndex(currentIdx + 1);
              }
            },
          },
        ],
      });

      artPlayerRef.current.on("ready", () => {
        console.log("播放器就绪");
        // 如果没有启用的弹幕源，初始隐藏弹幕层
        const { danmakuSources } = useSettingsStore.getState();
        if (!danmakuSources.some((s) => s.enabled)) {
          artPlayerRef.current.plugins.artplayerPluginDanmuku.hide();
        }
      });
      artPlayerRef.current.on("fullscreen", () => {
        if (isIOS) {
          artPlayerRef.current.fullscreen = false; // 阻止 ArtPlayer 的 fullscreen
          const video = artPlayerRef.current.video;

          if (video.webkitEnterFullscreen) {
            video.webkitEnterFullscreen(); // ✅ iOS 真全屏
          }
        }
      });

      artPlayerRef.current.once("video:canplay", () => {
        // 从store中获取播放记录
        const playRecord = usePlayHistoryStore
          .getState()
          .getPlayRecord(videoDetail.source, videoDetail.id);
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
            console.log("成功恢复播放进度到:", target);
          } catch (err) {
            console.warn("恢复播放进度失败:", err);
          }
        }
      });

      artPlayerRef.current.on("video:timeupdate", () => {
        const { skipConfig } = useSettingsStore.getState();
        // 自动保存数据
        const now = Date.now();
        if (now - lastSaveTimeRef.current > 5000) {
          savePlayProgressEvent();
          lastSaveTimeRef.current = now;
        }

        if (skipConfig.enable && artPlayerRef.current) {
          const currentTime = artPlayerRef.current.currentTime || 0;
          const duration = artPlayerRef.current.duration || 0;

          if (now - lastSkipCheckRef.current >= 1500) {
            lastSkipCheckRef.current = now;

            if (
              skipConfig.intro_time > 0 &&
              currentTime < skipConfig.intro_time
            ) {
              artPlayerRef.current.currentTime = skipConfig.intro_time;
              artPlayerRef.current.notice.show = `Skipped intro (${formatTime(skipConfig.intro_time)})`;
            }

            if (
              skipConfig.outro_time < 0 &&
              duration > 0 &&
              currentTime > duration + skipConfig.outro_time
            ) {
              artPlayerRef.current.notice.show = `Skipped outro (${formatTime(-skipConfig.outro_time)})`;
              const currentIdx = CurrentEpisodeIndexEvent();
              if (
                videoDetail &&
                videoDetail.episodes &&
                currentIdx < videoDetail.episodes.length - 1
              ) {
                setCurrentEpisodeIndex(currentIdx + 1);
              } else {
                artPlayerRef.current.pause();
              }
            }
          }
        }
      });

      artPlayerRef.current.on("pause", () => {
        savePlayProgressEvent();
      });

      artPlayerRef.current.on("video:ended", () => {
        const currentIdx = CurrentEpisodeIndexEvent();
        if (
          videoDetail &&
          videoDetail.episodes &&
          currentIdx < videoDetail.episodes.length - 1
        ) {
          setTimeout(() => {
            setCurrentEpisodeIndex(currentIdx + 1);
          }, 1000);
        }
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
          if (artPlayerRef.current.video && artPlayerRef.current.video.hls) {
            artPlayerRef.current.video.hls.destroy();
          }
          artPlayerRef.current.destroy();
          artPlayerRef.current = null;
          console.log("播放器资源已清理");
        } catch (err) {
          console.warn("清理播放器资源时出错:", err);
          artPlayerRef.current = null;
        }
      }
    };
  }, [videoDetail, setCurrentEpisodeIndex]);

  // 核心 Play Effect: 监听 currentEpisodeIndex 变化，统一执行切换
  useEffect(() => {
    // 只在 currentEpisodeIndex 真正变化时才切换，避免首次挂载时重复切换
    if (
      artPlayerRef.current &&
      prevEpisodeIndexRef.current !== currentEpisodeIndex
    ) {
      switchToEpisodeEvent(currentEpisodeIndex);
    }
    // 更新上一次的索引
    prevEpisodeIndexRef.current = currentEpisodeIndex;
  }, [currentEpisodeIndex]);

  useEffect(() => {
    const handleKeyboardShortcuts = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      // 每次按键时获取最新的 episodeIndex
      const currentIdx = CurrentEpisodeIndexEvent();

      if (e.altKey && e.key === "ArrowLeft") {
        if (currentIdx > 0) {
          setCurrentEpisodeIndex(currentIdx - 1);
          e.preventDefault();
        }
      }

      if (e.altKey && e.key === "ArrowRight") {
        if (
          videoDetail &&
          videoDetail.episodes &&
          currentIdx < videoDetail.episodes.length - 1
        ) {
          setCurrentEpisodeIndex(currentIdx + 1);
          e.preventDefault();
        }
      }

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
  }, [videoDetail, setCurrentEpisodeIndex]);

  useEffect(() => {
    window.addEventListener("beforeunload", savePlayProgressEvent);
    return () => {
      window.removeEventListener("beforeunload", savePlayProgressEvent);
    };
  }, []);

  return { artRef };
}
