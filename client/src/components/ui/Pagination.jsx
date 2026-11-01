import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination — page navigation bound to the API's pagination object.
 */
export default function Pagination({ pagination, onPageChange, disabled = false }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total, hasNext, hasPrev } = pagination;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
      <p className="text-xs text-muted">
        Page <span className="font-semibold text-ink">{page}</span> of{' '}
        <span className="font-semibold text-ink">{totalPages}</span>
        {' · '}
        <span className="font-semibold text-ink">{total}</span> total
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || !hasPrev}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium text-muted transition hover:border-border-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={14} />
          Prev
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers(page, totalPages).map((p, index) =>
            p === '…' ? (
              <span key={`gap-${index}`} className="px-1 text-xs text-faint">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                disabled={disabled}
                className={[
                  'h-8 w-8 rounded-lg text-xs font-semibold transition',
                  p === page
                    ? 'bg-brand-500 text-[#04211e]'
                    : 'border border-border text-muted hover:border-border-strong hover:text-ink',
                ].join(' ')}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || !hasNext}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium text-muted transition hover:border-border-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/** Generates a windowed page list: 1 … 4 5 [6] 7 8 … 20 */
function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p));

  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result = [];
  let previous = 0;
  sorted.forEach((p) => {
    if (previous && p - previous > 1) result.push('…');
    result.push(p);
    previous = p;
  });
  return result;
}
