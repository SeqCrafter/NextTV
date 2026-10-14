import { MaterialSymbolsChevronLeftRounded, MaterialSymbolsChevronRightRounded } from "@/components/icons";

export function Pagination({ currentPage, pageCount, onPageChange }) {
  // 计算要显示的页码范围，最多显示 5 个页码按钮
  function getPageNumbers() {
    const maxVisible = 5;
    if (pageCount <= maxVisible) {
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }

    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;

    if (end > pageCount) {
      end = pageCount;
      start = end - maxVisible + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  const pages = getPageNumbers();

  return (
    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 mt-8 mb-4">
      <button
        className="p-2.5 sm:p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="上一页"
      >
        <MaterialSymbolsChevronLeftRounded className="text-xl" />
      </button>

      {pages[0] > 1 && (
        <>
          <button
            className="min-w-10 h-10 sm:min-w-[36px] sm:h-9 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => onPageChange(1)}
          >
            1
          </button>
          {pages[0] > 2 && (
            <span className="min-w-10 h-10 sm:min-w-[36px] sm:h-9 flex items-center justify-center text-sm text-gray-400">
              ...
            </span>
          )}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          className={`min-w-10 h-10 sm:min-w-[36px] sm:h-9 rounded-lg text-sm font-medium transition-colors ${
            page === currentPage
              ? "bg-primary text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      {pages[pages.length - 1] < pageCount && (
        <>
          {pages[pages.length - 1] < pageCount - 1 && (
            <span className="min-w-10 h-10 sm:min-w-[36px] sm:h-9 flex items-center justify-center text-sm text-gray-400">
              ...
            </span>
          )}
          <button
            className="min-w-10 h-10 sm:min-w-[36px] sm:h-9 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => onPageChange(pageCount)}
          >
            {pageCount}
          </button>
        </>
      )}

      <button
        className="p-2.5 sm:p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        disabled={currentPage === pageCount}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="下一页"
      >
        <MaterialSymbolsChevronRightRounded className="text-xl" />
      </button>
    </div>
  );
}
