/**
 * 视频搜索和详情获取 API
 * 基于 search.ts 逻辑的 JavaScript 实现
 */

// API 配置
const API_CONFIG = {
  search: {
    path: "?ac=detail&wd=",
    pagePath: "?ac=detail&wd={query}&pg={page}",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  },
  detail: {
    path: "?ac=detail&ids=",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  },
};

// 清理 HTML 标签
function cleanHtmlTags(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * 从单个 API 源搜索视频
 * @param {Object} apiSite - API 源配置对象 {key, name, url}
 * @param {string} query - 搜索关键词
 * @param {number} page - 页码
 * @param {number} timeoutMs - 超时时间（毫秒）
 */
async function searchFromApiWithPage(
  apiSite,
  query,
  page = 1,
  timeoutMs = 8000,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const apiUrl =
      page === 1
        ? apiSite.url + API_CONFIG.search.path + encodeURIComponent(query)
        : apiSite.url +
        API_CONFIG.search.pagePath
          .replace("{query}", encodeURIComponent(query))
          .replace("{page}", page.toString());

    // 通过本地 API 路由代理请求
    const proxyUrl = `/api/search?apiUrl=${encodeURIComponent(apiUrl)}`;
    const response = await fetch(proxyUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[${apiSite.name}] 搜索失败: ${response.status}`);
      return { results: [], pageCount: 0 };
    }

    const data = await response.json();

    if (
      !data ||
      !data.list ||
      !Array.isArray(data.list) ||
      data.list.length === 0
    ) {
      return { results: [], pageCount: 0 };
    }

    // 处理结果数据
    const allResults = data.list.map((item) => {
      let episodes = [];
      let titles = [];

      // 从 vod_play_url 提取 m3u8 链接
      if (item.vod_play_url) {
        // 先用 $$$ 分割不同播放源
        const vodPlayUrlArray = item.vod_play_url.split("$$$");

        vodPlayUrlArray.forEach((url) => {
          const matchEpisodes = [];
          const matchTitles = [];
          // 分集之间 # 分割
          const titleUrlArray = url.split("#");

          titleUrlArray.forEach((titleUrl) => {
            // 标题和播放链接 $ 分割
            const episodeTitleUrl = titleUrl.split("$");
            if (
              episodeTitleUrl.length === 2 &&
              episodeTitleUrl[1].endsWith(".m3u8")
            ) {
              matchTitles.push(episodeTitleUrl[0]);
              matchEpisodes.push(episodeTitleUrl[1]);
            }
          });

          // 选择集数最多的播放源
          if (matchEpisodes.length > episodes.length) {
            episodes = matchEpisodes;
            titles = matchTitles;
          }
        });
      }

      return {
        id: item.vod_id.toString(),
        title: item.vod_name.trim().replace(/\s+/g, " "),
        poster: item.vod_pic,
        backdrop: item.vod_pic, // 使用海报作为背景
        pageCount: parseInt(data.pagecount) || 1,
        episodes,
        episodes_titles: titles,
        source: apiSite.key,
        source_name: apiSite.name,
        class: item.vod_class,
        year: item.vod_year
          ? item.vod_year.match(/\d{4}/)?.[0] || "unknown"
          : "unknown",
        desc: cleanHtmlTags(item.vod_content || ""),
        type_name: item.type_name || "",
        rating: "7.0", // API 通常没有评分，默认值
        genre: item.vod_class || "未知",
        type: item.type_name?.includes("电影") ? "movie" : item.type_name?.includes("短剧") ? "short" : "tv",
        source_url: apiSite.url,
      };
    });

    // 过滤掉没有播放源的结果
    const results = allResults.filter((result) => result.episodes.length > 0);

    const pageCount = data.pagecount || 1;
    return { results, pageCount };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      console.error(`[${apiSite.name}] 搜索超时`);
    } else {
      console.error(`[${apiSite.name}] 搜索错误:`, error.message);
    }
    return { results: [], pageCount: 0 };
  }
}

/**
 * 从所有启用的 API 源搜索视频
 * @param {string} query - 搜索关键词
 * @param {Array} videoSources - 视频源数组
 */
export async function searchVideos(query, videoSources, page = 1) {
  if (!query || !query.trim()) {
    return [];
  }

  // 只使用启用的源
  const enabledSources = videoSources.filter((source) => source.enabled);

  if (enabledSources.length === 0) {
    console.warn("没有启用的视频源");
    return [];
  }

  // 并行搜索所有源
  const searchPromises = enabledSources.map((source) =>
    searchFromApiWithPage(source, query, page),
  );

  const searchResults = await Promise.all(searchPromises);

  // 合并所有结果
  let allResults = [];
  searchResults.forEach((result) => {
    if (result.results.length > 0) {
      allResults.push(...result.results);
    }
  });
  // get max pagecount from all sources
  const maxPagecount = Math.max(...searchResults.map((result) => result.pageCount));
  // return allResults with pagecount
  return {
    results: allResults,
    pageCount: maxPagecount,
  };
}

/**
 * 获取视频详情
 * @param {string} id - 视频 ID
 * @param {string} sourceKey - 源标识
 * @param {string} sourceUrl - 源 URL
 */
export async function getVideoDetail(id, sourceId, sourceName, sourceUrl) {
  const detailUrl = `${sourceUrl}${API_CONFIG.detail.path}${id}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // 通过本地 API 路由代理请求
    const proxyUrl = `/api/detail?apiUrl=${encodeURIComponent(detailUrl)}`;
    const response = await fetch(proxyUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`详情请求失败: ${response.status}`);
    }

    const data = await response.json();

    if (
      !data ||
      !data.list ||
      !Array.isArray(data.list) ||
      data.list.length === 0
    ) {
      throw new Error("获取到的详情内容无效");
    }

    const videoDetail = data.list[0];
    let episodes = [];
    let titles = [];

    // 处理播放源拆分
    if (videoDetail.vod_play_url) {
      const vodPlayUrlArray = videoDetail.vod_play_url.split("$$$");

      vodPlayUrlArray.forEach((url) => {
        const matchEpisodes = [];
        const matchTitles = [];
        const titleUrlArray = url.split("#");

        titleUrlArray.forEach((titleUrl) => {
          const episodeTitleUrl = titleUrl.split("$");
          if (
            episodeTitleUrl.length === 2 &&
            episodeTitleUrl[1].endsWith(".m3u8")
          ) {
            matchTitles.push(episodeTitleUrl[0]);
            matchEpisodes.push(episodeTitleUrl[1]);
          }
        });

        if (matchEpisodes.length > episodes.length) {
          episodes = matchEpisodes;
          titles = matchTitles;
        }
      });
    }

    return {
      id: id.toString(),
      title: videoDetail.vod_name,
      poster: videoDetail.vod_pic,
      backdrop: videoDetail.vod_pic,
      episodes,
      episodes_titles: titles,
      douban_id: videoDetail.vod_douban_id || 0,
      source: sourceId,
      source_name: sourceName,
      source_url: sourceUrl,
      class: videoDetail.vod_class,
      year: videoDetail.vod_year
        ? videoDetail.vod_year.match(/\d{4}/)?.[0] || "unknown"
        : "unknown",
      desc: cleanHtmlTags(videoDetail.vod_content),
      type_name: videoDetail.type_name || "",
      rating: "7.0",
      genre: videoDetail.vod_class || "未知",
      type: videoDetail.type_name?.includes("电影") ? "movie" : videoDetail.type_name?.includes("短剧") ? "short" : "tv",
      actors: videoDetail.vod_actor
        ? videoDetail.vod_actor
          .split(",")
          .slice(0, 5)
          .map((name) => ({
            name: name.trim(),
            avatar: "/placeholder-avatar.jpg", // 占位头像
          }))
        : [],
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("获取详情错误:", error.message);
    throw error;
  }
}
