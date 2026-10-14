import {NextResponse} from "next/server";
import {unstable_cache} from "next/cache";

const HONGGUO_BASE_URL = "https://hongguoduanju.com";
// 旧地址 /category?sort_type=1 现在会 301 到该页面
const HONGGUO_CATEGORY_PATH = "/category/real-drama";

// 页面改版后 loader 的 key 会变化（如 category_page → category_$），
// 因此在 loaderData 下查找任意包含 recommendList 的条目
function findRecommendList(routerData) {
  const loaderData = routerData?.loaderData;
  if (!loaderData || typeof loaderData !== "object") return null;

  for (const value of Object.values(loaderData)) {
    if (Array.isArray(value?.recommendList)) {
      return value.recommendList;
    }
  }
  return null;
}

function extractRouterData(html) {
  const assignmentMatch = html.match(/(?:window\.)?_ROUTER_DATA\s*=\s*/);
  if (!assignmentMatch || assignmentMatch.index === undefined) {
    throw new Error("无法从页面中找到 _ROUTER_DATA");
  }

  const jsonStart = assignmentMatch.index + assignmentMatch[0].length;
  if (html[jsonStart] !== "{") {
    throw new Error("_ROUTER_DATA 格式异常");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = jsonStart; index < html.length; index += 1) {
    const character = html[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(html.slice(jsonStart, index + 1));
      }
    }
  }

  throw new Error("无法从页面中完整提取 _ROUTER_DATA");
}

const getHongguoRecommend = unstable_cache(
  async () => {
    const response = await fetch(
      `${HONGGUO_BASE_URL}${HONGGUO_CATEGORY_PATH}`,
      {
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const html = await response.text();
    const routerData = extractRouterData(html);

    const recommendList = findRecommendList(routerData);

    if (!recommendList) {
      throw new Error("未找到 recommendList 数据");
    }

    // 转换数据格式
    return recommendList
      .filter((item) => item?.series_id && item?.series_name)
      .map((item) => ({
        title: item.series_name,
        poster: item.series_cover,
        hongguoUrl: `${HONGGUO_BASE_URL}/detail?series_id=${item.series_id}`,
      }));
  },
  ["hongguo-api"],
  {
    revalidate: 3600,
    tags: ["hongguo"],
  },
);

export async function GET(request) {
  try {
    const {searchParams} = new URL(request.url);
    const pageLimit = parseInt(searchParams.get("page_limit")) || 12;
    const pageStart = parseInt(searchParams.get("page_start")) || 0;

    const allList = await getHongguoRecommend();
    const list = allList.slice(pageStart, pageStart + pageLimit);
    const total = allList.length;

    return NextResponse.json(
      {list, total},
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error(
      "红果短剧API请求失败:",
      error.message,
      error.cause?.code || error.cause?.message || "",
    );
    // 降级为空列表，不缓存失败结果
    return NextResponse.json(
      {error: error.message || "获取红果短剧推荐失败", list: [], total: 0},
      {status: 200, headers: {"Cache-Control": "no-store"}},
    );
  }
}
