import { usePlayer } from "@/hooks/usePlayer";

export function VideoPlayer({
  videoDetail,
  currentEpisodeIndex,
  setCurrentEpisodeIndex
}) {
  const { artRef } = usePlayer({
    videoDetail,
    currentEpisodeIndex,
    setCurrentEpisodeIndex
  });

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden group border border-gray-800/50">
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
