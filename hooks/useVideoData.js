import { useState, useEffect, useRef } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { getVideoDetail } from "@/lib/cmsApi";
import { scrapeDoubanDetails } from "@/lib/getDouban";
import { usePlayHistoryStore } from "@/store/usePlayHistoryStore";

export function useVideoData(id, source, setCurrentEpisodeIndex) {
  const [videoDetail, setVideoDetail] = useState(null);
  const [doubanActors, setDoubanActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const completedLoadRef = useRef(null);
  const sourceUrl = useSettingsStore((state) => state.videoSources.find((item) => item.key === source)?.url);
  const loadKey = JSON.stringify([id, source, sourceUrl]);

  useEffect(() => {
    if (completedLoadRef.current === loadKey) return;
    let cancelled = false;

    async function loadData() {
      if (!id || !source) {
        if (!cancelled) {
          setVideoDetail(null);
          setDoubanActors([]);
          setError("Missing necessary parameters");
          setLoading(false);
        }
        return;
      }

      const videoSources = useSettingsStore.getState().videoSources;
      const sourceConfig = videoSources.find((s) => s.key === source);
      const playRecord = usePlayHistoryStore
        .getState()
        .playHistory.find((item) => item.source === source && item.id === id);
      if (!sourceConfig) {
        if (!cancelled) {
          setVideoDetail(null);
          setDoubanActors([]);
          setError("Video source not found");
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setError(null);
        setLoading(true);
        setVideoDetail(null);
        setDoubanActors([]);
      }

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
              avatar: doubanImageProxy === 'server' ? `/api/douban/image?url=${encodeURIComponent(actor.avatar)}` : actor.avatar.replace(
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
        if (cancelled) return;
        setCurrentEpisodeIndex(playRecord?.currentEpisodeIndex || 0);
        setVideoDetail(videoDetailData);
        setDoubanActors(actorsData);
        setLoading(false);
        completedLoadRef.current = loadKey;
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load data:", err);
        setVideoDetail(null);
        setDoubanActors([]);
        setError("Failed to load data");
        setLoading(false);
      }
    }

    loadData();
    console.log("数据加载运行了");

    return () => {
      cancelled = true;
    };
  }, [id, source, loadKey, setCurrentEpisodeIndex]);

  return {
    videoDetail,
    doubanActors,
    loading,
    error,
  };
}
