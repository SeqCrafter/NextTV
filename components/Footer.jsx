import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-line">
      <div className="max-w-[1504px] mx-auto px-4 sm:px-6 xl:px-8 py-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="" width={20} height={24} className="h-6 w-auto object-contain opacity-70" />
          <div>
            <p className="text-sm font-semibold text-ink">NextTV <span className="ml-2 font-normal text-muted">让观影回归简单</span></p>
            <p className="mt-1 text-xs text-muted">© 2026 NextTV · 开源多源影视播放工具</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 md:justify-end">
          <Link
            className="flex min-h-11 items-center text-sm text-muted hover:text-primary-dark transition-colors"
            href="/source-browse"
          >
            视频源浏览
          </Link>
          <a
            className="flex min-h-11 items-center text-sm text-muted hover:text-primary-dark transition-colors"
            href="mailto:sdupan2015@gmail.com"
          >
            联系作者
          </a>
          <a
            className="flex min-h-11 items-center text-sm text-muted hover:text-primary-dark transition-colors"
            href="https://github.com/SeqCrafter/NextTV/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            提交问题
          </a>
          <Link
            className="flex min-h-11 items-center text-sm text-muted hover:text-primary-dark transition-colors"
            href="/help"
          >
            帮助中心
          </Link>
        </div>
      </div>
    </footer>
  );
};
