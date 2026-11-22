import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

const getDetailData = unstable_cache(
  async (url) => {
    const response = await fetch(decodeURIComponent(url), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  },
  ["detail-api"],
  {
    revalidate: 3600,
    tags: ["detail"],
  }
);
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  try {
    const apiUrl = searchParams.get("apiUrl");

    if (!apiUrl) {
      return NextResponse.json({ error: "缺少 apiUrl 参数" }, { status: 400 });
    }

    const data = await getDetailData(apiUrl);

    return NextResponse.json(data);
  } catch (error) {
    console.error("详情 API 代理错误:", error);
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
