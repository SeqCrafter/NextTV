import React, { useState, useEffect, useCallback } from "react";
import { getVideoDetail } from "@/lib/cmsApi";
import { testStreamUrl } from "@/lib/clientSpeedTest";
import { MaterialSymbolsRefreshRounded } from "@/components/icons";

// Global cache to store speed test results by key (videoId + sourceKey)
// Global cache to store speed test results by key (videoId + sourceKey)
// Value format: { data: result, timestamp: number }
const resultCache = new Map();
const CACHE_DURATION = 60 * 1000; // 1 minute

export function SpeedTestBadge({ videoId, sourceKey, sourceName, sourceUrl }) {
  const cacheKey = `${videoId}-${sourceKey}`;

  const getCachedResult = useCallback(() => {
    if (resultCache.has(cacheKey)) {
      const cached = resultCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      } else {
        resultCache.delete(cacheKey);
      }
    }
    return null;
  }, [cacheKey]);

  const initialResult = getCachedResult();
  const [loading, setLoading] = useState(!initialResult);
  const [result, setResult] = useState(initialResult);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check cache again in effect in case it was populated by another component instance
    const cached = getCachedResult();
    if (cached) {
      setResult(cached);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function runTest() {
      try {
        setLoading(true);
        // 1. Get video details
        const detail = await getVideoDetail(videoId, sourceKey, sourceName, sourceUrl);

        if (!detail || !detail.episodes || detail.episodes.length === 0) {
          throw new Error("No episodes found");
        }

        // 2. Get last episode URL
        const lastEpisodeUrl = detail.episodes[detail.episodes.length - 1];

        // 3. Run speed test client-side
        const testResult = await testStreamUrl(lastEpisodeUrl, "GET", 30000, true);

        // Cache the result with timestamp
        resultCache.set(cacheKey, {
          data: testResult,
          timestamp: Date.now()
        });

        if (mounted) {
          setResult(testResult);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          console.error("Speed test error:", err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (videoId && sourceUrl) {
      runTest();
    }

    return () => {
      mounted = false;
    };
  }, [videoId, sourceKey, sourceUrl, cacheKey, getCachedResult, sourceName]);

  if (loading) {
    return (
      <div className="absolute top-2 left-2 z-10">
        <span className="bg-black/60 backdrop-blur-sm text-white/80 text-[10px] px-2 py-1 rounded-md flex items-center gap-1 animate-pulse">
          <MaterialSymbolsRefreshRounded className="text-[10px] animate-spin" />
          测速中...
        </span>
      </div>
    );
  }

  if (error || !result || !result.success) {
    // Optional: don't show anything on error to keep UI clean, or show a red dot
    return null;
  }

  // Format download speed
  let speedText = "";
  const speedBps = result.downloadSpeed || 0;

  if (speedBps >= 1048576) { // >= 1 MB/s
    speedText = `${(speedBps / 1048576).toFixed(1)} MB/s`;
  } else if (speedBps >= 1024) { // >= 1 KB/s
    speedText = `${(speedBps / 1024).toFixed(1)} KB/s`;
  } else {
    speedText = `${speedBps} B/s`;
  }

  // Color coding based on latency only
  let colorClass = "bg-red-500/70 text-white";
  const latency = result.responseTime || 9999;

  if (latency < 600) {
    colorClass = "bg-green-500/70 text-white";
  } else if (latency <= 1000) {
    colorClass = "bg-yellow-500/70 text-black";
  }

  return (
    <div className="absolute top-2 left-2 z-10">
      <div className={`${colorClass} shadow-sm backdrop-blur-md rounded-md px-2 py-1 flex flex-col items-start gap-0.5 min-w-[50px]`}>
        <span className="text-[10px] font-bold leading-none">{result.responseTime}ms</span>
        {speedText && (
          <span className="text-[9px] font-medium leading-none whitespace-nowrap opacity-90">
            {speedText}
          </span>
        )}
      </div>
    </div>
  );
}
