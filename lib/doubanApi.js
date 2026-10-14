// 豆瓣API工具函数

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
