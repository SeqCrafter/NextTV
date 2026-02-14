import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 py-8 mt-auto bg-white">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <p className="text-gray-500 text-sm font-medium">
            © ShineJ。
          </p>
        </div>
        <div className="flex gap-6">
          <a
            className="text-gray-500 hover:text-gray-900 text-sm transition-colors"
            href="####"
          >
            联系作者
          </a>
          <a
            className="text-gray-500 hover:text-gray-900 text-sm transition-colors"
            href="####"
            target="_blank"
            rel="noopener noreferrer"
          >
            提交问题
          </a>
          <Link
            className="text-gray-500 hover:text-gray-900 text-sm transition-colors"
            href="/help"
          >
            帮助中心
          </Link>
        </div>
      </div>
    </footer>
  );
};
