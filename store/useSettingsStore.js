"use client";

import {create} from "zustand";
import {persist} from "zustand/middleware";
import {DEFAULT_VIDEO_SOURCES, DEFAULT_DANMAKU_SOURCES} from "../lib/constants";

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      videoSources: DEFAULT_VIDEO_SOURCES,
      danmakuSources: DEFAULT_DANMAKU_SOURCES,

      // 播放器配置
      blockAdEnabled: false,
      skipConfig: {enable: false, intro_time: 0, outro_time: 0},

      // 豆瓣配置
      doubanProxy: "https://movie.douban.cmliussss.com",
      doubanImageProxy: "img.doubanio.cmliussss.com",

      // 设置去广告开关
      setBlockAdEnabled: (enabled) => set({blockAdEnabled: enabled}),

      // 设置跳过配置
      setSkipConfig: (config) => set({skipConfig: config}),

      // 一键开关所有弹幕源
      setAllDanmakuSourcesEnabled: (enabled) =>
        set((state) => ({
          danmakuSources: state.danmakuSources.map((source) => ({
            ...source,
            enabled,
          })),
        })),

      // 检查是否有启用的弹幕源
      hasEnabledDanmakuSources: () => {
        const state = get();
        return state.danmakuSources.some((source) => source.enabled);
      },

      // 设置豆瓣代理
      setDoubanProxy: (url) => set({doubanProxy: url}),
      setDoubanImageProxy: (url) => set({doubanImageProxy: url}),

      toggleSource: (id, type) =>
        set((state) => {
          const key = type === "video" ? "videoSources" : "danmakuSources";
          return {
            [key]: state[key].map((source) =>
              source.id === id ? {...source, enabled: !source.enabled} : source,
            ),
          };
        }),

      addSource: (source, type) =>
        set((state) => {
          const key = type === "video" ? "videoSources" : "danmakuSources";
          const newSource = {
            ...source,
            id: Date.now().toString(),
            enabled: true,
          };
          return {
            [key]: [...state[key], newSource],
          };
        }),

      updateSource: (id, updatedData, type) =>
        set((state) => {
          const key = type === "video" ? "videoSources" : "danmakuSources";
          return {
            [key]: state[key].map((source) =>
              source.id === id ? {...source, ...updatedData} : source,
            ),
          };
        }),

      removeSource: (id, type) =>
        set((state) => {
          const key = type === "video" ? "videoSources" : "danmakuSources";
          return {
            [key]: state[key].filter((source) => source.id !== id),
          };
        }),

      moveSource: (id, direction, type) =>
        set((state) => {
          const key = type === "video" ? "videoSources" : "danmakuSources";
          const sources = [...state[key]];
          const index = sources.findIndex((s) => s.id === id);

          if (index === -1) return state;

          const newIndex = direction === "up" ? index - 1 : index + 1;

          if (newIndex < 0 || newIndex >= sources.length) return state;

          [sources[index], sources[newIndex]] = [
            sources[newIndex],
            sources[index],
          ];

          return {[key]: sources};
        }),

      resetToDefaults: (type) =>
        set((state) => {
          if (type === "video") {
            return {videoSources: DEFAULT_VIDEO_SOURCES};
          } else if (type === "danmaku") {
            return {danmakuSources: DEFAULT_DANMAKU_SOURCES};
          } else {
            return {
              videoSources: DEFAULT_VIDEO_SOURCES,
              danmakuSources: DEFAULT_DANMAKU_SOURCES,
            };
          }
        }),

      exportSettings: () => {
        const state = get();
        return {
          videoSources: state.videoSources,
          danmakuSources: state.danmakuSources,
          exportDate: new Date().toISOString(),
        };
      },

      importSettings: (data) =>
        set(() => {
          return {
            videoSources: data.videoSources || DEFAULT_VIDEO_SOURCES,
            danmakuSources: data.danmakuSources || DEFAULT_DANMAKU_SOURCES,
          };
        }),
    }),
    {
      name: "streambox-settings",
    },
  ),
);
