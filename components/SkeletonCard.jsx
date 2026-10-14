export function SkeletonCard() {
  return (
    <div className="flex flex-col gap-2 sm:gap-3" aria-hidden="true">
      {/* Poster skeleton */}
      <div className="relative w-full aspect-2/3 overflow-hidden rounded-xl skeleton ring-1 ring-gray-200/60" />

      {/* Title skeleton */}
      <div className="h-4 rounded skeleton w-3/4" />
    </div>
  );
}
