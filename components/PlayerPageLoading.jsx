export function LoadingSpinner() {
  return (
    <div className="w-full max-w-[1440px] mx-auto pt-4 sm:pt-6 space-y-5">
      <p role="status" className="flex min-h-8 items-center gap-2 text-sm text-muted">
        <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
        正在获取影片信息，播放器将自动准备就绪
      </p>
      <div aria-hidden="true" className="watch-layout">
        <div className="surface-panel overflow-hidden">
          <div className="watch-screen skeleton" />
          <div className="p-5 space-y-3">
            <div className="h-5 w-2/5 rounded-md skeleton" />
            <div className="h-3 w-1/3 rounded-md skeleton" />
            <div className="flex gap-2 pt-1">
              <div className="h-11 w-20 rounded-lg skeleton" />
              <div className="h-11 w-20 rounded-lg skeleton" />
            </div>
          </div>
        </div>
        <div className="watch-sidebar hidden lg:block">
          <div className="episode-panel surface-panel p-4">
            <div className="h-5 w-16 rounded-md skeleton" />
            <div className="h-3 w-24 mt-3 rounded-md skeleton" />
            <div className="mt-6 grid grid-cols-5 gap-2">
              {Array.from({ length: 25 }).map((_, index) => <div key={index} className="h-11 rounded-lg skeleton" />)}
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="surface-panel p-5 flex gap-5">
        <div className="w-24 aspect-2/3 shrink-0 rounded-xl skeleton" />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-5 w-24 rounded-md skeleton" />
          <div className="h-3 w-full rounded-md skeleton" />
          <div className="h-3 w-4/5 rounded-md skeleton" />
          <div className="h-3 w-3/5 rounded-md skeleton" />
        </div>
      </div>
    </div>
  );
}
