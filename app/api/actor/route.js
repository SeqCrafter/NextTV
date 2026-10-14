import { NextResponse } from "next/server";
import { getDoubanActors } from "@/lib/doubanServer";
import { unstable_cache } from "next/cache";

// 使用 Next.js 缓存包装，缓存1小时
const getDoubanActorsCached = unstable_cache(
  async (doubanId) => {
    return await getDoubanActors(doubanId);
  },
  ["douban-actors"],
  { revalidate: 3600, tags: ["douban-actors"] }
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const doubanId = searchParams.get("id");

    if (!doubanId) {
      return NextResponse.json(
        { code: 400, error: "缺少豆瓣ID参数" },
        { status: 400 }
      );
    }

    const actors = await getDoubanActorsCached(doubanId);

    return NextResponse.json({
      code: 200,
      data: actors,
    });
  } catch (error) {
    console.error("获取演员信息失败:", error);
    return NextResponse.json(
      { code: 500, error: "获取演员信息失败", message: error.message },
      { status: 500 }
    );
  }
}
