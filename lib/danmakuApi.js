/**
 * 弹幕相关API函数
 */

import { extractEpisodeNumberFromTitle } from "@/lib/util";

const DANMAKU_FORMAT = "artplayer.json";

function addDanmakuFormat(url) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}format=${DANMAKU_FORMAT}`;
}

function getDanmakuList(data) {
  return Array.isArray(data?.danmuku) ? data.danmuku : [];
}

export function createDanmakuLoader(
  danmakuSources,
  doubanId,
  episodeTitle,
  episodeIndex,
  isMovie,
) {
  const enabledSources = danmakuSources.filter((source) => source.enabled);
  if (!doubanId || !episodeTitle || enabledSources.length === 0) {
    console.log("缺少必要的参数：豆瓣ID 或 集数 或 没有启用的弹幕源");
    return () => {
      return new Promise((resolve) => {
        resolve([]);
      });
    };
  }
  let episodeNumber = extractEpisodeNumberFromTitle(episodeTitle, isMovie);
  if (episodeNumber === null) {
    episodeNumber = episodeIndex + 1;
    console.warn(
      `无法从标题 "${episodeTitle}" 中提取集数，使用索引 ${episodeNumber}`,
    );
  }
  const finalDanmuUrl = addDanmakuFormat(
    `${enabledSources[0].url}/api/v2/douban?douban_id=${doubanId}&episode_number=${episodeNumber}`,
  );
  console.log("获取弹幕URL:", finalDanmuUrl);
  return () => {
    return new Promise((resolve) => {
      fetch(finalDanmuUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          const danmaku = getDanmakuList(data);
          console.log(`成功获取 ${danmaku.length} 条弹幕`);
          resolve(danmaku);
        })
        .catch((error) => {
          console.error("获取弹幕失败:", error);
          resolve([]);
        });
    });
  };
}

export async function searchAnime(baseUrl, animeName) {
  const apiUrl = addDanmakuFormat(
    `${baseUrl}/api/v2/search/anime?keyword=${encodeURIComponent(animeName)}`,
  );
  // 添加超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 10秒超时
  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      keepalive: true,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("搜索动漫失败:", error);
  }
}

export async function getEpisodes(baseUrl, animeId) {
  const apiUrl = addDanmakuFormat(`${baseUrl}/api/v2/bangumi/${animeId}`);
  // 添加超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 10秒超时
  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      keepalive: true,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("获取动漫集数失败:", error);
  }
}


export function createDanmakuLoaderDirect(
  danmakuSources,
  episodeId
) {
  const enabledSources = danmakuSources.filter((source) => source.enabled);
  const finalDanmuUrl = addDanmakuFormat(
    `${enabledSources[0].url}/api/v2/comment/${episodeId}`,
  );
  console.log("获取弹幕URL:", finalDanmuUrl);
  return () => {
    return new Promise((resolve, reject) => {
      fetch(finalDanmuUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          const danmaku = getDanmakuList(data);
          console.log(`成功获取 ${danmaku.length} 条弹幕`);
          resolve(danmaku);
        })
        .catch((error) => {
          console.error("获取弹幕失败:", error);
          resolve([]);
        });
    });
  };
}
