"use client";

import { useState, useEffect, useEffectEvent, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Artplayer from "artplayer";
import Hls from "hls.js";
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";
import artplayerPluginLiquidGlass from "@/lib/artplayer-plugin-liquid-glass";
import { FavoriteButton } from "@/components/FavoriteButton";
import { EpisodeList } from "@/components/EpisodeList";
import { useSettingsStore } from "@/store/useSettingsStore";
import { usePlayHistoryStore } from "@/store/usePlayHistoryStore";
import { formatTime } from "@/lib/util";
import { filterAdsFromM3U8 } from "@/lib/util";
import { getVideoDetail } from "@/lib/cmsApi";
import { scrapeDoubanDetails } from "@/lib/getDouban";
import { createDanmakuLoader } from "@/lib/danmakuApi";
import { LoadingSpinner } from "@/components/PlayerPageLoading";
// ============================================================================
// 主组件
// ============================================================================

export default function PlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id;
  const source = searchParams.get("source");
  // -------------------------------------------------------------------------
  // Store
  // -------------------------------------------------------------------------
  const addPlayRecord = usePlayHistoryStore((state) => state.addPlayRecord);
  const getPlayRecord = usePlayHistoryStore((state) => state.getPlayRecord);
  const danmakuSources = useSettingsStore((state) => state.danmakuSources);
  const blockAdEnabled = useSettingsStore((state) => state.blockAdEnabled);
  const skipConfig = useSettingsStore((state) => state.skipConfig);

  // -------------------------------------------------------------------------
  // 状态
  // -------------------------------------------------------------------------
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [videoDetail, setVideoDetail] = useState(null);
  const [doubanActors, setDoubanActors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // -------------------------------------------------------------------------
  // 播放器相关的 Refs（只保留必要的）
  // -------------------------------------------------------------------------
  const artRef = useRef(null); // 播放器容器 DOM
  const artPlayerRef = useRef(null); // Artplayer 实例
  const blockAdEnabledRef = useRef(blockAdEnabled);
  // 时间控制
  const lastSkipCheckRef = useRef(0);
  const lastSaveTimeRef = useRef(0);
  // 初始化剧集
  const initialEpisodeIndex = useRef(0);
  const initialTime = useRef(0);

  // ============================================================================
  // 普通版本的响应式函数
  // ============================================================================
  // 保存播放进度（普通响应式）
  const savePlayProgress = () => {
    if (!artPlayerRef.current || !videoDetail || !id || !source) return;

    const currentTime = artPlayerRef.current.currentTime || 0;
    const duration = artPlayerRef.current.duration || 0;

    if (currentTime < 1 || !duration) return;

    try {
      addPlayRecord({
        source,
        id,
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
  // 切换到指定集数（普通函数，可以在任何地方调用）
  const switchToEpisode = async (newIndex) => {
    if (!videoDetail || !artPlayerRef.current) return;

    const newUrl = videoDetail.episodes?.[newIndex];
    const newTitle = videoDetail.episodes_titles?.[newIndex] || `第 ${newIndex + 1} 集`;

    if (!newUrl) {
      console.error("无效的集数索引:", newIndex);
      return;
    }

    console.log("切换到集数:", newIndex + 1);

    // 1. 保存当前进度
    savePlayProgress();

    // 2. 更新集数索引
    setCurrentEpisodeIndex(newIndex);

    // 3. 检查 store 中是否有该集的播放记录
    const playRecord = getPlayRecord(source, id);
    let resumeTime = 0;
    if (playRecord && playRecord.currentEpisodeIndex === newIndex) {
      resumeTime = playRecord.currentTime > 5 ? playRecord.currentTime : 0;
      console.log(`找到第${newIndex + 1}集的播放记录，将恢复到 ${Math.floor(resumeTime)} 秒`);
    }

    // 4. 切换播放器 URL
    artPlayerRef.current.switch = newUrl;
    artPlayerRef.current.title = `${videoDetail.title} - ${newTitle}`;
    artPlayerRef.current.poster = videoDetail?.backdrop || videoDetail?.poster || "";
    // 4.1 清空弹幕
    artPlayerRef.current.plugins.artplayerPluginDanmuku.reset();
    artPlayerRef.current.plugins.artplayerPluginDanmuku.config({
      danmuku: [],
    });
    artPlayerRef.current.plugins.artplayerPluginDanmuku.load();
    console.log("清空弹幕");
    // 5. 恢复播放进度（如果有）
    if (resumeTime > 0) {
      // 使用 once 监听，确保只执行一次
      artPlayerRef.current.once("video:canplay", () => {
        try {
          const duration = artPlayerRef.current.duration || 0;
          let target = resumeTime;
          if (duration && target >= duration - 2) {
            target = Math.max(0, duration - 5);
          }
          artPlayerRef.current.currentTime = target;
          artPlayerRef.current.notice.show = `已恢复到 ${Math.floor(target / 60)}:${String(Math.floor(target % 60)).padStart(2, "0")}`;
          console.log("成功恢复播放进度到:", target);
        } catch (err) {
          console.warn("恢复播放进度失败:", err);
        }
      });
    }

    // 6. 尝试将弹幕的异步函数切换过去
    const isMovie = videoDetail.episodes?.length === 1;
    artPlayerRef.current.plugins.artplayerPluginDanmuku.config({
      danmuku: createDanmakuLoader(danmakuSources, videoDetail.douban_id, newTitle, newIndex, isMovie),
    });
    artPlayerRef.current.plugins.artplayerPluginDanmuku.load();
  };
  // -------------------------------------------------------------------------
  // useEffectEvent 创建只能在 useEffect 中调用的稳定函数
  // -------------------------------------------------------------------------
  // 保存播放进度 - 只在 useEffect 中调用
  const savePlayProgressEvent = useEffectEvent(savePlayProgress);

  // 定期保存进度 - 只在 useEffect 的 timeupdate 中调用
  // 先本地更新进度，再保存到store
  const handleTimeupdateSaveEvent = useEffectEvent(() => {
    const now = Date.now();
    if (now - lastSaveTimeRef.current > 5000) {
      savePlayProgress();
      lastSaveTimeRef.current = now;
    }
  });
  // 处理跳过片头片尾逻辑
  const handleSkipEvent = useEffectEvent(() => {
    if (!skipConfig.enable || !artPlayerRef.current) return;

    const currentTime = artPlayerRef.current.currentTime || 0;
    const duration = artPlayerRef.current.duration || 0;
    const now = Date.now();

    // 限制检查频率
    if (now - lastSkipCheckRef.current < 1500) return;
    lastSkipCheckRef.current = now;
    // 跳过片头
    if (skipConfig.intro_time > 0 && currentTime < skipConfig.intro_time) {
      artPlayerRef.current.currentTime = skipConfig.intro_time;
      artPlayerRef.current.notice.show = `已跳过片头 (${formatTime(skipConfig.intro_time)})`;
    }

    // 跳过片尾
    if (skipConfig.outro_time < 0 && duration > 0 && currentTime > duration + skipConfig.outro_time) {
      artPlayerRef.current.notice.show = `已跳过片尾 (${formatTime(-skipConfig.outro_time)})`;
      // 触发下一集或暂停
      if (videoDetail && videoDetail.episodes && currentEpisodeIndex < videoDetail.episodes.length - 1) {
        switchToEpisode(currentEpisodeIndex + 1);
      } else {
        artPlayerRef.current.pause();
      }
    }
  });

  // 键盘快捷键处理
  const handleKeyboardShortcutsEvent = useEffectEvent((e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    // Alt + 左箭头 = 上一集
    if (e.altKey && e.key === "ArrowLeft") {
      if (currentEpisodeIndex > 0) {
        switchToEpisode(currentEpisodeIndex - 1);
        e.preventDefault();
      }
    }

    // Alt + 右箭头 = 下一集
    if (e.altKey && e.key === "ArrowRight") {
      if (videoDetail && videoDetail.episodes && currentEpisodeIndex < videoDetail.episodes.length - 1) {
        switchToEpisode(currentEpisodeIndex + 1);
        e.preventDefault();
      }
    }

    // 左箭头 = 快退
    if (!e.altKey && e.key === "ArrowLeft") {
      if (artPlayerRef.current && artPlayerRef.current.currentTime > 5) {
        artPlayerRef.current.currentTime -= 10;
        e.preventDefault();
      }
    }

    // 右箭头 = 快进
    if (!e.altKey && e.key === "ArrowRight") {
      if (artPlayerRef.current && artPlayerRef.current.currentTime < artPlayerRef.current.duration - 5) {
        artPlayerRef.current.currentTime += 10;
        e.preventDefault();
      }
    }

    // 上箭头 = 音量+
    if (e.key === "ArrowUp") {
      if (artPlayerRef.current && artPlayerRef.current.volume < 1) {
        artPlayerRef.current.volume = Math.round((artPlayerRef.current.volume + 0.1) * 10) / 10;
        artPlayerRef.current.notice.show = `音量: ${Math.round(artPlayerRef.current.volume * 100)}`;
        e.preventDefault();
      }
    }

    // 下箭头 = 音量-
    if (e.key === "ArrowDown") {
      if (artPlayerRef.current && artPlayerRef.current.volume > 0) {
        artPlayerRef.current.volume = Math.round((artPlayerRef.current.volume - 0.1) * 10) / 10;
        artPlayerRef.current.notice.show = `音量: ${Math.round(artPlayerRef.current.volume * 100)}`;
        e.preventDefault();
      }
    }

    // 空格 = 播放/暂停
    if (e.key === " ") {
      if (artPlayerRef.current) {
        artPlayerRef.current.toggle();
        e.preventDefault();
      }
    }

    // f 键 = 切换全屏
    if (e.key === "f" || e.key === "F") {
      if (artPlayerRef.current) {
        artPlayerRef.current.fullscreen = !artPlayerRef.current.fullscreen;
        e.preventDefault();
      }
    }
  });
  const handleControlNextButtonEvent = useEffectEvent(() => {
    if (videoDetail && videoDetail.episodes && currentEpisodeIndex < videoDetail.episodes.length - 1) {
      savePlayProgress();
      switchToEpisode(currentEpisodeIndex + 1);
    }
  });
  const handleAutoNextEpisodeEvent = useEffectEvent(() => {
    if (videoDetail && videoDetail.episodes && currentEpisodeIndex < videoDetail.episodes.length - 1) {
      savePlayProgress();
      setTimeout(() => {
        switchToEpisode(currentEpisodeIndex + 1);
      }, 1000);
    }
  });
  // 自定义 HLS Loader（去广告）
  class CustomHlsJsLoader extends Hls.DefaultConfig.loader {
    constructor(config) {
      super(config);
      const load = this.load.bind(this);
      this.load = function (context, config, callbacks) {
        if (context.type === "manifest" || context.type === "level") {
          const onSuccess = callbacks.onSuccess;
          callbacks.onSuccess = function (response, stats, context) {
            if (response.data && typeof response.data === "string") {
              response.data = filterAdsFromM3U8(response.data, videoDetail.source_url || "");
            }
            return onSuccess(response, stats, context, null);
          };
        }
        load(context, config, callbacks);
      };
    }
  }
  // -------------------------------------------------------------------------
  // 加载数据
  // -------------------------------------------------------------------------
  useEffect(() => {
    blockAdEnabledRef.current = blockAdEnabled;
  }, [blockAdEnabled]);

  useEffect(() => {
    async function loadData() {
      if (!id || !source) {
        setError("缺少必要的参数");
        setLoading(false);
        return;
      }

      const videoSources = useSettingsStore.getState().videoSources;
      const sourceConfig = videoSources.find((s) => s.key === source);
      if (!sourceConfig) {
        setError("未找到对应的视频源");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const videoDetailData = await getVideoDetail(id, sourceConfig.name, sourceConfig.url);
        setVideoDetail(videoDetailData);
        // 2. 读取播放记录，确定初始集数
        const playHistory = usePlayHistoryStore.getState().playHistory;
        const playRecord = playHistory.find((item) => item.source === source && item.id === id);
        initialEpisodeIndex.current = playRecord?.currentEpisodeIndex ?? 0;
        setCurrentEpisodeIndex(() => initialEpisodeIndex.current);
        initialTime.current = playRecord?.currentTime && playRecord.currentTime > 5 ? playRecord.currentTime : 0;
        if (!videoDetailData.douban_id) {
          console.log("没有豆瓣ID，无法获取弹幕");
          return;
        }
        const doubanResult = await scrapeDoubanDetails(videoDetailData.douban_id);
        if (doubanResult.code === 200 && doubanResult.data.actors) {
          const doubanActorData = doubanResult.data.actors.map((actor) => {
            return {
              ...actor,
              avatar: actor.avatar.replace(/img\d+\.doubanio\.com/g, "img.doubanio.cmliussss.com"),
            };
          });
          setDoubanActors(doubanActorData);
        } else {
          console.warn("获取豆瓣演员数据失败:", doubanResult.reason?.message);
          setDoubanActors([]);
        }
      } catch (err) {
        console.error("加载数据失败:", err);
        setError("加载数据失败");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, source]);

  // -------------------------------------------------------------------------
  // 播放器初始化（当 DOM 容器和视频数据都准备好时执行）
  // -------------------------------------------------------------------------
  useEffect(() => {
    // 检查：1. 不在加载中 2. 有视频数据 3. DOM 已挂载 4. 播放器未初始化
    if (loading || !videoDetail || !artRef.current || artPlayerRef.current) {
      return;
    }

    try {
      const currentUrl = videoDetail?.episodes?.[initialEpisodeIndex.current] || "";
      const currentTitle = videoDetail?.episodes_titles?.[initialEpisodeIndex.current] || `第${initialEpisodeIndex.current + 1}集`;

      artPlayerRef.current = new Artplayer({
        container: artRef.current,
        url: currentUrl,
        title: `${videoDetail.title} - ${currentTitle}`,
        poster: videoDetail?.backdrop || videoDetail?.poster || "",
        volume: 0.7, // 默认音量
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

        // 弹幕插件
        plugins: [
          artplayerPluginDanmuku({
            danmuku: createDanmakuLoader(danmakuSources, videoDetail.douban_id, currentTitle, initialEpisodeIndex.current, videoDetail.episodes?.length === 1),
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

        // HLS 支持配置（强制使用 HLS.js 以支持去广告功能）
        customType: {
          m3u8: function (video, url) {
            // 优先使用 HLS.js（支持去广告），只有在 HLS.js 不支持时才降级到原生播放
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
              loader: blockAdEnabledRef.current ? CustomHlsJsLoader : Hls.DefaultConfig.loader,
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

        // 设置面板配置
        settings: [
          {
            html: "去广告",
            icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><text x="50%" y="50%" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="currentColor">AD</text></svg>',
            tooltip: blockAdEnabled ? "已开启" : "已关闭",
            switch: blockAdEnabled,
            onSwitch: function (item) {
              const newVal = !item.switch;
              useSettingsStore.getState().setBlockAdEnabled(newVal);
              if (artPlayerRef.current) {
                artPlayerRef.current.notice.show = newVal ? "去广告已开启，刷新生效" : "去广告已关闭，刷新生效";
              }
              return newVal;
            },
          },
          {
            html: "跳过片头片尾",
            tooltip: skipConfig.enable ? "已开启" : "已关闭",
            switch: skipConfig.enable,
            onSwitch: function (item) {
              // 使用 getState() 获取最新的 skipConfig，避免闭包捕获旧值
              const currentSkipConfig = useSettingsStore.getState().skipConfig;
              const newConfig = {
                ...currentSkipConfig,
                enable: !item.switch,
              };
              useSettingsStore.getState().setSkipConfig(newConfig);
              if (artPlayerRef.current) {
                artPlayerRef.current.notice.show = newConfig.enable ? "跳过片头片尾已开启" : "跳过片头片尾已关闭";
              }
              return !item.switch;
            },
          },
          {
            html: "设置片头",
            icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="12" r="2" fill="currentColor"/><path d="M10 12L17 12" stroke="currentColor" stroke-width="2"/><path d="M17 7L17 17" stroke="currentColor" stroke-width="2"/></svg>',
            tooltip: skipConfig.intro_time === 0 ? "点击设置片头时间" : `片头：${formatTime(skipConfig.intro_time)}`,
            onClick: function () {
              if (artPlayerRef.current) {
                const currentTime = artPlayerRef.current.currentTime || 0;
                if (currentTime > 0) {
                  // 使用 getState() 获取最新的 skipConfig，避免闭包捕获旧值
                  const currentSkipConfig = useSettingsStore.getState().skipConfig;
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
            tooltip: skipConfig.outro_time >= 0 ? "点击设置片尾时间" : `片尾：${formatTime(-skipConfig.outro_time)}`,
            onClick: function () {
              if (artPlayerRef.current) {
                const outroTime = -(artPlayerRef.current.duration - artPlayerRef.current.currentTime) || 0;
                if (outroTime < 0) {
                  // 使用 getState() 获取最新的 skipConfig，避免闭包捕获旧值
                  const currentSkipConfig = useSettingsStore.getState().skipConfig;
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

        // 控制栏：下一集按钮
        controls: [
          {
            position: "right",
            index: 10,
            html: '<button class="art-icon art-icon-next" style="display: flex; align-items: center; justify-content: center; cursor: pointer;"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>',
            tooltip: "下一集",
            click: handleControlNextButtonEvent,
          },
        ],
      });

      // -----------------------------------------------------------------------
      // 播放器事件监听（使用 useEffectEvent 中的函数）
      // -----------------------------------------------------------------------

      // 播放器就绪
      artPlayerRef.current.on("ready", () => {
        console.log("播放器就绪");
      });

      // 视频可播放时恢复初始进度（仅首次）
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

      // 时间更新：跳过片头片尾 + 定期保存进度
      artPlayerRef.current.on("video:timeupdate", () => {
        handleSkipEvent();
        handleTimeupdateSaveEvent();
      });

      // 暂停时保存进度
      artPlayerRef.current.on("pause", () => {
        savePlayProgressEvent();
      });

      // 视频播放结束时自动播放下一集
      artPlayerRef.current.on("video:ended", handleAutoNextEpisodeEvent);

      artPlayerRef.current.on("error", (err) => {
        console.error("播放器错误:", err);
      });
    } catch (err) {
      console.error("创建播放器失败:", err);
    }

    // 组件卸载时清理
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoDetail, loading]); // 当 DOM 容器挂载且 videoDetail 加载完成后初始化播放器

  // -------------------------------------------------------------------------
  // 键盘快捷键监听
  // -------------------------------------------------------------------------
  useEffect(() => {
    document.addEventListener("keydown", handleKeyboardShortcutsEvent);
    return () => {
      document.removeEventListener("keydown", handleKeyboardShortcutsEvent);
    };
  }, []);

  // -------------------------------------------------------------------------
  // 页面卸载前保存播放进度
  // -------------------------------------------------------------------------
  useEffect(() => {
    window.addEventListener("beforeunload", savePlayProgressEvent);
    return () => {
      window.removeEventListener("beforeunload", savePlayProgressEvent);
    };
  }, []); // useEffectEvent 无需依赖数组

  // -------------------------------------------------------------------------
  // 切换剧集（用户点击事件）
  // -------------------------------------------------------------------------
  const handleEpisodeClick = (index) => {
    switchToEpisode(index);
  };
  // 参数校验

  // -------------------------------------------------------------------------
  // 渲染
  // -------------------------------------------------------------------------
  if (error || !id || !source || !videoDetail) {
    return (
      <div className="w-full max-w-7xl pt-4 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }
  if (loading) {
    return <LoadingSpinner />;
  }
  if (loading) {
    return <LoadingSpinner />;
  }
  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <nav aria-label="Breadcrumb" className="flex text-sm text-slate-500 dark:text-slate-400 mb-4 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-primary flex items-center gap-1 transition-colors">
          <span className="material-symbols-outlined text-[18px]">home</span> 首页
        </Link>
        <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
        <span className="hover:text-primary transition-colors cursor-pointer">{videoDetail.type === "movie" ? "电影" : "电视剧"}</span>
        <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
        <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px]">{videoDetail.title}</span>
      </nav>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 transition-all duration-300 items-stretch">
        {/* Left Column: Player and Info */}
        <div className="flex flex-col gap-4 transition-all duration-300 lg:col-span-8 xl:col-span-9">
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group border border-gray-800/50">
            {videoDetail?.episodes?.[currentEpisodeIndex] ? (
              <div ref={artRef} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <span>暂无播放源</span>
              </div>
            )}
          </div>

          {/* Mobile Actions Bar (Visible only on mobile/tablet) */}
          <div className="flex lg:hidden justify-between items-center px-2 py-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
              <div className="flex gap-4">
                  <FavoriteButton source={source} id={id} videoDetail={videoDetail} className="flex flex-col items-center gap-1 text-xs text-slate-500 hover:text-primary" />
                  <button className="flex flex-col items-center gap-1 text-xs text-slate-500 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">share</span>
                      分享
                  </button>
                  {/* Keep only requested items: Favorite, Share, Source Name (shown below) */}
              </div>
               <div className="flex items-center gap-2">
                   <div className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[150px]">{videoDetail.title}</div>
                   <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-xs">{videoDetail.source || source}</span>
               </div>
          </div>
        </div>

        {/* Right Column: Episodes */}
        <div className="w-full lg:col-span-4 xl:col-span-3 flex flex-col h-full">
           <EpisodeList 
              episodes={videoDetail.episodes} 
              episodesTitles={videoDetail.episodes_titles} 
              currentEpisodeIndex={currentEpisodeIndex} 
              onEpisodeClick={handleEpisodeClick} 
           />
        </div>
      </div>
      
      {/* Bottom Section: Full Info Card (Hidden on Mobile as per request "mobile details only ...", keeping desktop rich) */}
      <div className="hidden lg:block bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
           <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
             <div className="w-full md:w-56 shrink-0 mx-auto md:mx-0 max-w-[240px]">
               <div className="relative aspect-2/3 rounded-lg overflow-hidden shadow-lg group">
                 <img alt={`${videoDetail.title} Poster`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={videoDetail.poster} />
                 <div className="absolute top-2 left-2 bg-primary/90 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
                    HD
                 </div>
               </div>
             </div>
             
             <div className="flex-1 space-y-6">
               <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-100 dark:border-slate-700 pb-4">
                 <div>
                   <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">{videoDetail.title}</h1>
                   <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                     <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-medium text-slate-600 dark:text-slate-300">{videoDetail.year}</span>
                     <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">movie</span> {videoDetail.genre}
                     </span>
                     {videoDetail.class && (
                        <span className="flex items-center gap-1">
                             <span className="material-symbols-outlined text-[16px] text-slate-400">public</span> {videoDetail.type_name}
                        </span>
                     )}
                     <span>全 {videoDetail.episodes?.length || 1} 集</span>
                     <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-xs">{videoDetail.source || source}</span>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-primary">
                            <span className="material-symbols-outlined fill-current text-[24px]">star</span>
                            <span className="text-2xl font-bold">{videoDetail.rating}</span>
                            <span className="text-xs text-slate-400 mt-2">/ 10</span>
                        </div>
                        <span className="text-xs text-slate-400">豆瓣评分</span>
                    </div>
                    <div className="hidden sm:flex gap-2">
                         <FavoriteButton source={source} id={id} videoDetail={videoDetail} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors" />
                         <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors">
                            <span className="material-symbols-outlined">share</span>
                         </button>
                    </div>
                 </div>
               </div>

               {videoDetail.desc && (
                 <div className="space-y-2">
                   <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">剧情简介</h3>
                   <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed text-justify">{videoDetail.desc}</p>
                 </div>
               )}

               {(doubanActors.length > 0 || (videoDetail.actors && videoDetail.actors.length > 0)) && (
                 <div className="space-y-3 pt-2">
                   <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">演员表</h3>
                   <div className="flex flex-wrap gap-6">
                     {(doubanActors.length > 0 ? doubanActors : videoDetail.actors).map((actor, idx) => (
                       <div key={actor.id || idx} className="flex flex-col items-center gap-2 group cursor-pointer">
                         <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all">
                           {actor.avatar ? (
                             <img
                               src={actor.avatar}
                               alt={actor.name}
                               className="w-full h-full object-cover"
                               onError={(e) => {
                                 e.target.style.display = "none";
                                 e.target.nextSibling.style.display = "flex";
                               }}
                             />
                           ) : null}
                           <span className="material-symbols-outlined text-gray-400 text-2xl items-center justify-center bg-gray-100" style={{ display: actor.avatar ? "none" : "flex", width: '100%', height: '100%' }}>
                             person
                           </span>
                         </div>
                         <div className="text-center">
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-primary max-w-[60px] truncate">{actor.name}</p>
                            {actor.role && <p className="text-[10px] text-slate-500 max-w-[60px] truncate">{actor.role}</p>}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </div>
        </div>
      </div>
    </div>
  );
}
