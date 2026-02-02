import {useState, useEffect} from "react";
import {useSettingsStore} from "@/store/useSettingsStore";
import {getVideoDetail} from "@/lib/cmsApi";
import {scrapeDoubanDetails} from "@/lib/getDouban";
import {usePlayHistoryStore} from "@/store/usePlayHistoryStore";

export function useVideoData(id, source, setCurrentEpisodeIndex) {
  const [videoDetail, setVideoDetail] = useState(null);
  const [doubanActors, setDoubanActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      if (!id || !source) {
        setError("Missing necessary parameters");
        setLoading(false);
        return;
      }

      const videoSources = useSettingsStore.getState().videoSources;
      const sourceConfig = videoSources.find((s) => s.key === source);
      const playRecord = usePlayHistoryStore
        .getState()
        .playHistory.find((item) => item.source === source && item.id === id);
      if (!sourceConfig) {
        setError("Video source not found");
        setLoading(false);
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const videoDetailData = await getVideoDetail(
          id,
          source,
          sourceConfig.name,
          sourceConfig.url,
        );
        const doubanImageProxy = useSettingsStore.getState().doubanImageProxy;
        let actorsData = [];
        if (videoDetailData.douban_id) {
          const doubanResult = await scrapeDoubanDetails(
            videoDetailData.douban_id,
          );
          if (doubanResult.code === 200 && doubanResult.data) {
            actorsData = doubanResult.data.map((actor) => ({
              ...actor,
              avatar: actor.avatar.replace(
                /img\d+\.doubanio\.com/g,
                doubanImageProxy,
              ),
            }));
          } else {
            console.warn(
              "Failed to fetch Douban actor data:",
              doubanResult.reason?.message,
            );
          }
        } else {
          console.log("No Douban ID, cannot get danmaku");
        }
        setCurrentEpisodeIndex(playRecord?.currentEpisodeIndex || 0);
        setVideoDetail(videoDetailData);
        setDoubanActors(actorsData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load data");
        setLoading(false);
      }
    }

    loadData();
    console.log("数据加载运行了");
  }, [id, source, setCurrentEpisodeIndex]);

  return {
    videoDetail,
    doubanActors,
    loading,
    error,
  };
}
