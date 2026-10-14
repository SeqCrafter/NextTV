import { useEffect, useRef } from "react";
import { usePlayer } from "@/hooks/usePlayer";
import { useSettingsStore } from "@/store/useSettingsStore";
import { replaceDanmakuLoader } from "@/lib/artplayerDanmaku";
import { createDanmakuLoaderDirect } from "@/lib/danmakuApi";

export function VideoPlayer({
  videoDetail,
  currentEpisodeIndex,
  setCurrentEpisodeIndex,
  loadManualDanmakuRef,
}) {
  const { artRef, artPlayerRef } = usePlayer({
    videoDetail,
    currentEpisodeIndex,
    setCurrentEpisodeIndex,
  });

  // Expose an imperative method via ref for manual danmaku loading
  // This avoids state/effect indirection and works reliably for repeated calls
  useEffect(() => {
    if (!loadManualDanmakuRef) return;

    loadManualDanmakuRef.current = (episodeId) => {
      if (!artPlayerRef.current || !episodeId) return;

      const { danmakuSources } = useSettingsStore.getState();
      const hasEnabledDanmaku = danmakuSources.some((s) => s.enabled);

      if (hasEnabledDanmaku) {
        const danmakuPlugin =
          artPlayerRef.current.plugins.artplayerPluginDanmuku;
        void replaceDanmakuLoader(
          danmakuPlugin,
          createDanmakuLoaderDirect(danmakuSources, episodeId),
        );
        danmakuPlugin.show();
        artPlayerRef.current.notice.show = "弹幕已切换";
        console.log("手动弹幕加载已触发, episodeId:", episodeId);
      } else {
        artPlayerRef.current.notice.show = "请先启用弹幕源";
      }
    };

    return () => {
      if (loadManualDanmakuRef) {
        loadManualDanmakuRef.current = null;
      }
    };
  }, [loadManualDanmakuRef, artPlayerRef]);

  return (
    <div className="relative w-full h-full bg-black sm:rounded-xl overflow-hidden group sm:border sm:border-gray-800/50">
      {videoDetail?.episodes?.[currentEpisodeIndex] ? (
        <div ref={artRef} className="w-full h-full" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white">
          <span>暂无播放源</span>
        </div>
      )}
    </div>
  );
}
