import { usePlayerDirect } from "@/hooks/usePlayerDirect";

export function VideoPlayerDirect({ currentUrl, searchTitle, searchPoster, searchEpisodeId }) {
  const { artRef } = usePlayerDirect({
    currentUrl,
    searchTitle,
    searchPoster,
    searchEpisodeId,
  });

  return (
    <div className="relative w-full h-full bg-black sm:rounded-xl overflow-hidden group sm:border sm:border-gray-800/50">
      <div ref={artRef} className="w-full h-full" />
    </div>
  );
}
