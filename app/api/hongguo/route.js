import {NextResponse} from "next/server";
import {unstable_cache} from "next/cache";

const HONGGUO_BASE_URL = "https://hongguoduanju.com";

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
      `${HONGGUO_BASE_URL}/category?sort_type=1`,
      {
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

    // 路径: loaderData.category_page.recommendList
    const recommendList =
      routerData?.loaderData?.category_page?.recommendList;

    if (!recommendList || !Array.isArray(recommendList)) {
      throw new Error("未找到 recommendList 数据");
    }

    // 转换数据格式
    return recommendList.map((item) => ({
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
    console.error("红果短剧API请求失败:", error);
    return NextResponse.json(
      {error: error.message || "获取红果短剧推荐失败", list: [], total: 0},
      {status: 500},
    );
  }
}
