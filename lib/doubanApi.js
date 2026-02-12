// 豆瓣API工具函数

import crypto from "node:crypto";

/**
 * 生成豆瓣 Frodo API 签名
 *
 * @param {string} urlPath - URL 路径，例如: /api/v2/movie/1419297
 * @param {string} timestamp - 时间戳，格式: YYYYMMDD
 * @param {string} method - HTTP 方法，默认 GET
 * @returns {string} Base64 编码的 HMAC-SHA1 签名
 */
export function generateDoubanSignature(urlPath, timestamp, method = "GET") {
  const secretKey = "bf7dddc7c9cfe6f7";

  // 等价于 Python 的 quote(url_path, safe='')
  const encodedPath = encodeURIComponent(urlPath);

  // 构造签名原文: METHOD&URL_PATH&TIMESTAMP
  const rawSign = [method.toUpperCase(), encodedPath, String(timestamp)].join(
    "&",
  );

  // HMAC-SHA1 + Base64
  return crypto.createHmac("sha1", secretKey).update(rawSign).digest("base64");
}

// 默认标签
export const defaultMovieTags = [
  "华语",
  "热门",
  "最新",
  "经典",
  "豆瓣高分",
  "冷门佳片",
  "欧美",
  "韩国",
  "日本",
  "动作",
  "喜剧",
  "爱情",
  "科幻",
  "悬疑",
  "恐怖",
  "治愈",
];

export const defaultTvTags = [
  "国产剧",
  "热门",
  "美剧",
  "英剧",
  "韩剧",
  "日剧",
  "港剧",
  "日本动画",
  "综艺",
  "纪录片",
];

// 获取推荐内容（通过本地API路由）
export async function fetchRecommendations(
  type,
  tag,
  pageLimit = 12,
  pageStart = 0,
  proxy = "",
) {
  try {
    const params = new URLSearchParams({
      type,
      tag,
      page_limit: pageLimit.toString(),
      page_start: pageStart.toString(),
    });

    if (proxy) {
      params.append("douban_proxy", proxy);
    }

    const response = await fetch(`/api/douban?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("获取推荐内容失败:", error);
    return {subjects: []};
  }
}

// 加载用户标签
export function loadUserTags() {
  try {
    const savedMovieTags = localStorage.getItem("userMovieTags");
    const savedTvTags = localStorage.getItem("userTvTags");

    return {
      movieTags: savedMovieTags
        ? JSON.parse(savedMovieTags)
        : [...defaultMovieTags],
      tvTags: savedTvTags ? JSON.parse(savedTvTags) : [...defaultTvTags],
    };
  } catch (e) {
    console.error("加载标签失败：", e);
    return {
      movieTags: [...defaultMovieTags],
      tvTags: [...defaultTvTags],
    };
  }
}

// 保存用户标签
export function saveUserTags(movieTags, tvTags) {
  try {
    localStorage.setItem("userMovieTags", JSON.stringify(movieTags));
    localStorage.setItem("userTvTags", JSON.stringify(tvTags));
  } catch (e) {
    console.error("保存标签失败：", e);
  }
}

// 转换豆瓣数据为应用格式
export function convertDoubanToMovie(item) {
  return {
    id: item.id,
    title: item.title,
    rating: item.rate || "暂无",
    type: "movie",
    poster: item.cover,
    backdrop: item.cover,
    doubanUrl: item.url,
  };
}

export async function getDoubanActors(doubanId) {
  //使用豆瓣Frodo API(参考MoviePilot的实现)
  const api_key = "0dad551ec0f84ed02907ff5c42e8ec70";
  const url_path = `/api/v2/movie/${doubanId}/celebrities`;
  // 生成时间戳 (格式: YYYYMMDD)
  const timestamp = new Date().toISOString().split("T")[0].replace(/-/g, "");
  // Android豆瓣客户端User - Agent
  const user_agent =
    "api-client/1 com.douban.frodo/7.22.0.beta9(231) Android/23 product/Mate 40 vendor/HUAWEI model/Mate 40 brand/HUAWEI  rom/android  network/wifi  platform/AndroidPad";

  const signature = generateDoubanSignature(url_path, timestamp);
  // 构造请求参数
  const params = new URLSearchParams({
    apiKey: api_key,
    os_rom: "android",
    _ts: timestamp,
    _sig: signature,
  });

  const base_url = `https://frodo.douban.com${url_path}?${params.toString()}`;

  const response = await fetch(base_url, {
    headers: {
      "User-Agent": user_agent,
      Referer: "https://frodo.douban.com",
      Accept: "*/*",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`);
  }

  const data = await response.json();
  const actors = (data.actors || []).slice(0, 5).map((actor, index) => ({
    id: actor.id || `actor-${index}`,
    name: actor.name || "",
    avatar: actor.avatar?.large || actor.avatar?.normal || "",
    role: actor.roles[0] || "演员",
    avatars: actor.avatar
      ? {
          small: actor.avatar.small || "",
          medium: actor.avatar.normal || "",
          large: actor.avatar.large || "",
        }
      : undefined,
  }));
  return actors;
}
