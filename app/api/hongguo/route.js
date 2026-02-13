import {NextResponse} from "next/server";
import {unstable_cache} from "next/cache";

const getHongguoRecommend = unstable_cache(
  async () => {
    const response = await fetch(
      "https://novelquickapp.com/category?sort_type=1",
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

    // 从 <script> 标签中提取 window._ROUTER_DATA
    const startMarker = "window._ROUTER_DATA = ";
    const startIdx = html.indexOf(startMarker);
    if (startIdx === -1) {
      throw new Error("无法从页面中找到 _ROUTER_DATA");
    }
    const jsonStart = startIdx + startMarker.length;
    const jsonEnd = html.indexOf("</script>", jsonStart);
    if (jsonEnd === -1) {
      throw new Error("无法从页面中提取数据");
    }
    const rawJson = html.substring(jsonStart, jsonEnd).trim().replace(/;$/, "");

    // 解析 JSON（内容中包含 \u002F 等 Unicode 转义，JSON.parse 会自动处理）
    const routerData = JSON.parse(rawJson);

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
      hongguoUrl: `https://novelquickapp.com/detail?series_id=${item.series_id}`,
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
