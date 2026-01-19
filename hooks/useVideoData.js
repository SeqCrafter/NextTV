import { useState, useEffect, useRef } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { usePlayHistoryStore } from "@/store/usePlayHistoryStore";
import { getVideoDetail } from "@/lib/cmsApi";
import { scrapeDoubanDetails } from "@/lib/getDouban";

/**
 * Hook for fetching video data and managing video-related state
 * @param {string} id - Video ID
 * @param {string} source - Video source
 * @returns {Object} Video data and state
 */
export function useVideoData(id, source) {
  const [videoDetail, setVideoDetail] = useState(null);
  const [doubanActors, setDoubanActors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);

  const initialEpisodeIndex = useRef(0);
  const initialTime = useRef(0);
  const blockAdEnabledRef = useRef(null);
  const skipConfigRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      if (!id || !source) {
        setError("Missing necessary parameters");
        setLoading(false);
        return;
      }

      const videoSources = useSettingsStore.getState().videoSources;
      const sourceConfig = videoSources.find((s) => s.key === source);
      if (!sourceConfig) {
        setError("Video source not found");
        setLoading(false);
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const videoDetailData = await getVideoDetail(id, sourceConfig.name, sourceConfig.url);

        const playHistory = usePlayHistoryStore.getState().playHistory;
        const playRecord = playHistory.find((item) => item.source === source && item.id === id);

        initialEpisodeIndex.current = playRecord?.currentEpisodeIndex ?? 0;
        initialTime.current = playRecord?.currentTime && playRecord.currentTime > 5 ? playRecord.currentTime : 0;

        let actorsData = [];
        if (videoDetailData.douban_id) {
          const doubanResult = await scrapeDoubanDetails(videoDetailData.douban_id);
          if (doubanResult.code === 200 && doubanResult.data.actors) {
            actorsData = doubanResult.data.actors.map((actor) => ({
              ...actor,
              avatar: actor.avatar.replace(/img\d+\.doubanio\.com/g, "img.doubanio.cmliussss.com"),
            }));
          } else {
            console.warn("Failed to fetch Douban actor data:", doubanResult.reason?.message);
          }
        } else {
          console.log("No Douban ID, cannot get danmaku");
        }

        const enableRemoveAd = useSettingsStore.getState().blockAdEnabled;
        const skipConfig = useSettingsStore.getState().skipConfig;
        blockAdEnabledRef.current = enableRemoveAd;
        skipConfigRef.current = skipConfig;

        if (enableRemoveAd) {
          videoDetailData.episodes = videoDetailData.episodes.map((episode) => {
            return "/api/filterad?url=" + episode;
          });
        }

        setVideoDetail(videoDetailData);
        setCurrentEpisodeIndex(initialEpisodeIndex.current);
        setDoubanActors(actorsData);
        setLoading(false);

      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load data");
        setLoading(false);
      }
    }

    loadData();
    console.log("数据加载运行了")
  }, [id, source]);

  return {
    videoDetail,
    doubanActors,
    loading,
    error,
    currentEpisodeIndex,
    setCurrentEpisodeIndex,
    initialEpisodeIndex,
    initialTime,
    blockAdEnabledRef,
    skipConfigRef,
  };
}
