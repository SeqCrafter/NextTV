'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePlayHistoryStore = create(
  persist(
    (set, get) => ({
      // 播放记录数组，按时间倒序排列
      playHistory: [],

      // 添加或更新播放记录
      addPlayRecord: (record) => set((state) => {
        const {
          source,
          source_name,
          id,
          title,
          poster,
          year,
          currentEpisodeIndex,
          totalEpisodes,
          currentTime,
          duration,
        } = record;

        // 生成唯一key
        const key = `${source}-${id}`;

        // 移除已存在的相同记录
        const filteredHistory = state.playHistory.filter(
          (item) => `${item.source}-${item.id}` !== key
        );

        // 创建新记录
        const newRecord = {
          source,
          source_name,
          id,
          title,
          poster,
          year,
          currentEpisodeIndex,
          totalEpisodes,
          currentTime: Math.floor(currentTime),
          duration: Math.floor(duration),
          progress: duration > 0 ? (currentTime / duration) * 100 : 0,
          updatedAt: Date.now(),
        };

        // 添加到最前面（最新的在前）
        return {
          playHistory: [newRecord, ...filteredHistory].slice(0, 20), // 只保留最近20条
        };
      }),

      // 删除播放记录
      removePlayRecord: (source, id) => set((state) => ({
        playHistory: state.playHistory.filter(
          (item) => !(item.source === source && item.id === id)
        ),
      })),

      // 清空所有播放记录
      clearPlayHistory: () => set({ playHistory: [] }),

      // 获取特定视频的播放记录
      getPlayRecord: (source, id) => {
        const state = get();
        return state.playHistory.find(
          (item) => item.source === source && item.id === id
        );
      },
    }),
    {
      name: 'NextTV-play-history',
    }
  )
);
