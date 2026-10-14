import {NextResponse} from "next/server";
import {unstable_cache} from "next/cache";

function parseSingleVideo(videoDetail) {
  let episodes = [];
  // 处理播放源拆分
  if (videoDetail.vod_play_url) {
    const vodPlayUrlArray = videoDetail.vod_play_url.split("$$$");

    vodPlayUrlArray.forEach((url) => {
      const matchEpisodes = [];
      const titleUrlArray = url.split("#");

      titleUrlArray.forEach((titleUrl) => {
        const episodeTitleUrl = titleUrl.split("$");
        if (
          episodeTitleUrl.length === 2 &&
          episodeTitleUrl[1].endsWith(".m3u8")
        ) {
          matchEpisodes.push(episodeTitleUrl[1]);
        }
      });
      if (matchEpisodes.length > episodes.length) {
        episodes = matchEpisodes;
      }
    });
  }
  return episodes.length;
}

const checkVideoUpgrade = unstable_cache(
  async (ids, sourceUrl) => {
    const detailUrl = `${sourceUrl}?ac=detail&ids=${ids}`;

    try {
      const response = await fetch(detailUrl, {
        signal: AbortSignal.timeout(10000),
      });

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

      const episodeLength = data.list.map((videoDetail) => ({
        id: videoDetail.vod_id.toString(),
        length: parseSingleVideo(videoDetail),
      }));

      return {
        episodeLength,
      };
    } catch (error) {
      // 底层网络错误（如 fetch failed）的真实原因在 error.cause 中
      console.error(
        "获取详情错误:",
        error.message,
        error.cause?.code || error.cause?.message || "",
      );
      throw error;
    }
  },
  ["upgrade-api"],
  {revalidate: 3600, tags: ["upgrade"]},
);

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const ids = searchParams.get("ids");
  const sourceUrl = searchParams.get("sourceUrl");

  if (!ids || !sourceUrl) {
    return NextResponse.json(
      {error: "缺少 ids 或 sourceUrl 参数", episodeLength: []},
      {status: 400},
    );
  }

  try {
    const episodeLength = await checkVideoUpgrade(ids, sourceUrl);
    return NextResponse.json({
      episodeLength,
    });
  } catch (error) {
    // 更新检查只是辅助信息，视频源不可达时降级为空结果，不影响页面
    return NextResponse.json(
      {error: error.message, episodeLength: []},
      {status: 200, headers: {"Cache-Control": "no-store"}},
    );
  }
}
