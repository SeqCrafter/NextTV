import {NextResponse} from "next/server";
import {unstable_cache} from "next/cache";

// 创建缓存函数，根据 URL 自动缓存不同的请求
const getDoubanData = unstable_cache(
  async (url) => {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://movie.douban.com/",
        Accept: "application/json, text/plain, */*",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  },
  ["douban-api"], // cache key prefix
  {
    revalidate: 3600, // 1小时缓存
    tags: ["douban"],
  },
);

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "movie";
    const tag = searchParams.get("tag") || "热门";
    const pageLimit = searchParams.get("page_limit") || "12";
    const pageStart = searchParams.get("page_start") || "0";
    const proxy =
      searchParams.get("douban_proxy") || "https://movie.douban.cmliussss.com";

    // 构建豆瓣API URL
    const doubanUrl = `${proxy}/j/search_subjects?type=${type}&tag=${encodeURIComponent(tag)}&sort=recommend&page_limit=${pageLimit}&page_start=${pageStart}`;

    const data = await getDoubanData(doubanUrl);

    // 返回数据
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error(
      "豆瓣API请求失败:",
      error.message,
      error.cause?.code || error.cause?.message || "",
    );

    // 豆瓣代理不可达时降级为空列表，不缓存失败结果
    return NextResponse.json(
      {
        error: "获取数据失败",
        message: error.message,
        subjects: [],
      },
      {status: 200, headers: {"Cache-Control": "no-store"}},
    );
  }
}
