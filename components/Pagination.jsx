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
    <nav aria-label="结果分页" className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 mt-8 mb-4 tabular-nums">
      <button
        type="button"
        className="ui-button ui-icon-button border-transparent bg-transparent btn-press"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="上一页"
      >
        <MaterialSymbolsChevronLeftRounded className="text-xl" aria-hidden="true" />
      </button>

      {pages[0] > 1 && (
        <>
          <button
            type="button"
            className="ui-button ui-icon-button border-transparent bg-transparent btn-press"
            aria-label="第 1 页"
            onClick={() => onPageChange(1)}
          >
            1
          </button>
          {pages[0] > 2 && (
            <span aria-hidden="true" className="min-w-6 h-11 flex items-center justify-center text-sm text-muted">
              ...
            </span>
          )}
        </>
      )}

      {pages.map((page) => (
        <button
          type="button"
          key={page}
          aria-label={`第 ${page} 页`}
          aria-current={page === currentPage ? "page" : undefined}
          className={`ui-button ui-icon-button btn-press ${
            page === currentPage
              ? "bg-primary-soft text-primary-dark border-primary/60 font-semibold"
              : "border-transparent bg-transparent text-muted"
          }`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      {pages[pages.length - 1] < pageCount && (
        <>
          {pages[pages.length - 1] < pageCount - 1 && (
            <span aria-hidden="true" className="min-w-6 h-11 flex items-center justify-center text-sm text-muted">
              ...
            </span>
          )}
          <button
            type="button"
            className="ui-button ui-icon-button border-transparent bg-transparent btn-press"
            aria-label={`第 ${pageCount} 页`}
            onClick={() => onPageChange(pageCount)}
          >
            {pageCount}
          </button>
        </>
      )}

      <button
        type="button"
        className="ui-button ui-icon-button border-transparent bg-transparent btn-press"
        disabled={currentPage === pageCount}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="下一页"
      >
        <MaterialSymbolsChevronRightRounded className="text-xl" aria-hidden="true" />
      </button>
    </nav>
  );
}
