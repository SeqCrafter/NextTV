import {useEffect, useRef, useCallback} from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";
import artplayerPluginLiquidGlass from "@/lib/artplayer-plugin-liquid-glass";
import {useSettingsStore} from "@/store/useSettingsStore";
import {usePlayHistoryStore} from "@/store/usePlayHistoryStore";
import {formatTime} from "@/lib/util";
import {createDanmakuLoader} from "@/lib/danmakuApi";

export function usePlayer({
  videoDetail,
  loading,
  currentEpisodeIndex,
  initialEpisodeIndex,
  initialTime,
  blockAdEnabledRef,
  skipConfigRef,
  id,
  source,
}) {
  const artRef = useRef(null);
  const artPlayerRef = useRef(null);
  const lastSkipCheckRef = useRef(0);
  const lastSaveTimeRef = useRef(0);
  const playingEpisodeIndexRef = useRef(initialEpisodeIndex.current || 0);

  const savePlayProgress = useCallback(() => {
    if (!artPlayerRef.current || !videoDetail || !id || !source) return;

    const currentTime = artPlayerRef.current.currentTime || 0;
    const duration = artPlayerRef.current.duration || 0;

    if (currentTime < 1 || !duration) return;

    try {
      const {addPlayRecord} = usePlayHistoryStore.getState();
      const episodeIndexToSave = playingEpisodeIndexRef.current;

      addPlayRecord({
        source,
        source_name: videoDetail.source,
        id,
        title: videoDetail.title,
        poster: videoDetail.poster,
        year: videoDetail.year,
        currentEpisodeIndex: episodeIndexToSave,
        totalEpisodes: videoDetail.episodes?.length || 1,
        currentTime,
        duration,
      });
      console.log("播放进度已保存:", {
        title: videoDetail.title,
        episode: episodeIndexToSave + 1,
        progress: `${Math.floor(currentTime)}/${Math.floor(duration)}`,
      });
    } catch (err) {
      console.error("保存播放进度失败:", err);
    }
  }, [videoDetail, id, source]);

  const switchToEpisode = useCallback(
    (newIndex) => {
      if (!videoDetail || !artPlayerRef.current) return;

      const newUrl = videoDetail.episodes?.[newIndex];
      const newTitle =
        videoDetail.episodes_titles?.[newIndex] || `第 ${newIndex + 1} 集`;

      if (!newUrl) {
        console.error("Invalid episode index:", newIndex);
        return;
      }

      console.log("Switching to episode:", newIndex + 1);

      savePlayProgress();

      const {getPlayRecord} = usePlayHistoryStore.getState();
      const {danmakuSources} = useSettingsStore.getState();

      const playRecord = getPlayRecord(source, id);
      let resumeTime = 0;
      if (playRecord && playRecord.currentEpisodeIndex === newIndex) {
        resumeTime = playRecord.currentTime > 5 ? playRecord.currentTime : 0;
        console.log(
          `Found play record for episode ${newIndex + 1}, resuming to ${Math.floor(resumeTime)} seconds`,
        );
      }

      artPlayerRef.current.switch = newUrl;
      artPlayerRef.current.title = `${videoDetail.title} - ${newTitle}`;
      artPlayerRef.current.poster =
        videoDetail?.backdrop || videoDetail?.poster || "";
      artPlayerRef.current.plugins.artplayerPluginDanmuku.reset();
      artPlayerRef.current.plugins.artplayerPluginDanmuku.config({
        danmuku: [],
      });
      artPlayerRef.current.plugins.artplayerPluginDanmuku.load();
      console.log("Cleared danmaku");

      if (resumeTime > 0) {
        artPlayerRef.current.once("video:canplay", () => {
          try {
            const duration = artPlayerRef.current.duration || 0;
            let target = resumeTime;
            if (duration && target >= duration - 2) {
              target = Math.max(0, duration - 5);
            }
            artPlayerRef.current.currentTime = target;
            artPlayerRef.current.notice.show = `Resumed to ${Math.floor(target / 60)}:${String(Math.floor(target % 60)).padStart(2, "0")}`;
            console.log("Successfully resumed playback progress to:", target);
          } catch (err) {
            console.warn("Failed to resume playback progress:", err);
          }
        });
      }

      const isMovie = videoDetail.episodes?.length === 1;
      artPlayerRef.current.plugins.artplayerPluginDanmuku.config({
        danmuku: createDanmakuLoader(
          danmakuSources,
          videoDetail.douban_id,
          newTitle,
          newIndex,
          isMovie,
        ),
      });
      artPlayerRef.current.plugins.artplayerPluginDanmuku.load();

      playingEpisodeIndexRef.current = newIndex;
    },
    [videoDetail, id, source, savePlayProgress],
  );

  useEffect(() => {
    if (loading || !videoDetail || !artRef.current || artPlayerRef.current) {
      return;
    }
    try {
      console.log("重新初始化播放器了！");
      const currentUrl =
        videoDetail?.episodes?.[initialEpisodeIndex.current] || "";
      const currentTitle =
        videoDetail?.episodes_titles?.[initialEpisodeIndex.current] ||
        `第${initialEpisodeIndex.current + 1}集`;

      // Ensure the playing ref starts with the correct loaded initial index
      playingEpisodeIndexRef.current = initialEpisodeIndex.current;

      const {danmakuSources} = useSettingsStore.getState();

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
            danmuku: createDanmakuLoader(
              danmakuSources,
              videoDetail.douban_id,
              currentTitle,
              initialEpisodeIndex.current,
              videoDetail.episodes?.length === 1,
            ),
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
          artplayerPluginLiquidGlass(),
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
              lowLatencyMode: true,
              maxBufferLength: 30,
              backBufferLength: 30,
              maxBufferSize: 60 * 1000 * 1000,
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
              const newConfig = {enable: false, intro_time: 0, outro_time: 0};
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
            position: "right",
            index: 10,
            html: '<button class="art-icon art-icon-next" style="display: flex; align-items: center; justify-content: center; cursor: pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>',
            tooltip: "下一集",
            click: () => {
              const currentIdx = playingEpisodeIndexRef.current;
              if (
                videoDetail &&
                videoDetail.episodes &&
                currentIdx < videoDetail.episodes.length - 1
              ) {
                savePlayProgress();
                switchToEpisode(currentIdx + 1);
              }
            },
          },
        ],
      });

      artPlayerRef.current.on("ready", () => {
        console.log("播放器就绪");
      });

      artPlayerRef.current.once("video:canplay", () => {
        if (initialTime.current > 0) {
          try {
            const duration = artPlayerRef.current.duration || 0;
            let target = initialTime.current;
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
        const {skipConfig} = useSettingsStore.getState();

        const now = Date.now();
        if (now - lastSaveTimeRef.current > 5000) {
          savePlayProgress();
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
              const currentIdx = playingEpisodeIndexRef.current;
              if (
                videoDetail &&
                videoDetail.episodes &&
                currentIdx < videoDetail.episodes.length - 1
              ) {
                switchToEpisode(currentIdx + 1);
              } else {
                artPlayerRef.current.pause();
              }
            }
          }
        }
      });

      artPlayerRef.current.on("pause", () => {
        savePlayProgress();
      });

      artPlayerRef.current.on("video:ended", () => {
        const currentIdx = playingEpisodeIndexRef.current;
        if (
          videoDetail &&
          videoDetail.episodes &&
          currentIdx < videoDetail.episodes.length - 1
        ) {
          savePlayProgress();
          setTimeout(() => {
            switchToEpisode(currentIdx + 1);
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
  }, [
    videoDetail,
    loading,
    blockAdEnabledRef,
    skipConfigRef,
    initialEpisodeIndex,
    initialTime,
    switchToEpisode,
    savePlayProgress,
  ]);

  // 新增 effect: 监听 currentEpisodeIndex 变化，复用播放器
  useEffect(() => {
    if (
      artPlayerRef.current &&
      currentEpisodeIndex !== playingEpisodeIndexRef.current
    ) {
      switchToEpisode(currentEpisodeIndex);
    }
  }, [currentEpisodeIndex, switchToEpisode]);

  useEffect(() => {
    const handleKeyboardShortcuts = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      if (e.altKey && e.key === "ArrowLeft") {
        if (currentEpisodeIndex > 0) {
          switchToEpisode(currentEpisodeIndex - 1);
          e.preventDefault();
        }
      }

      if (e.altKey && e.key === "ArrowRight") {
        if (
          videoDetail &&
          videoDetail.episodes &&
          currentEpisodeIndex < videoDetail.episodes.length - 1
        ) {
          switchToEpisode(currentEpisodeIndex + 1);
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
  }, [videoDetail, currentEpisodeIndex, switchToEpisode]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      savePlayProgress();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [savePlayProgress]);

  return {
    artRef,
    switchToEpisode,
  };
}
