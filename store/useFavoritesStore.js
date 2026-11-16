'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      // 收藏列表
      favorites: [],

      // 添加收藏
      addFavorite: (item) => set((state) => {
        const { source, id, title, type, genre, poster } = item;

        // 检查是否已收藏（使用some优化性能）
        const exists = state.favorites.some(
          (fav) => fav.source === source && fav.id === id
        );

        if (exists) {
          return state; // 已存在，不重复添加
        }

        // 创建新收藏项
        const newFavorite = {
          source,
          id,
          title,
          type, // movie 或 tv
          genre,
          poster,
          addedAt: Date.now(),
        };

        return {
          favorites: [newFavorite, ...state.favorites], // 新收藏在前
        };
      }),

      // 删除收藏
      removeFavorite: (source, id) => set((state) => ({
        favorites: state.favorites.filter(
          (fav) => !(fav.source === source && fav.id === id)
        ),
      })),

      // 切换收藏状态（优化版：减少查询次数）
      toggleFavorite: (item) => {
        const state = get();
        const { source, id } = item;

        // 在一次遍历中查找是否存在
        const existingIndex = state.favorites.findIndex(
          (fav) => fav.source === source && fav.id === id
        );

        if (existingIndex !== -1) {
          // 已收藏，删除
          set((state) => ({
            favorites: state.favorites.filter((_, idx) => idx !== existingIndex)
          }));
          return false;
        } else {
          // 未收藏，添加
          const newFavorite = {
            source,
            id,
            title: item.title,
            type: item.type,
            genre: item.genre,
            poster: item.poster,
            addedAt: Date.now(),
          };
          set((state) => ({
            favorites: [newFavorite, ...state.favorites]
          }));
          return true;
        }
      },

      // 清空所有收藏
      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: 'NextTV-favorites',
    }
  )
);
