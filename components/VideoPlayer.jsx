import { usePlayer } from "@/hooks/usePlayer";

export function VideoPlayer({
  videoDetail,
  loading,
  currentEpisodeIndex,
  initialEpisodeIndex,
  initialTime,
  blockAdEnabledRef,
  skipConfigRef,
  id,
  source,
}) {
  const { artRef } = usePlayer({
    videoDetail,
    loading,
    currentEpisodeIndex,
    initialEpisodeIndex,
    initialTime,
    blockAdEnabledRef,
    skipConfigRef,
    id,
    source,
  });

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group border border-gray-800/50">
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
