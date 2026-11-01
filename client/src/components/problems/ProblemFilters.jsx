import { Search, X, Filter } from 'lucide-react';
import { Select } from '../ui/Input';
import { TOPICS, DIFFICULTIES, PLATFORMS } from '../../utils/constants';

/**
 * ProblemFilters — search box + topic/difficulty/status/platform selects
 * + an All/Active/Completed style status chip row (original assignment parity).
 */
export default function ProblemFilters({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onReset,
  activeCount = 0,
}) {
  return (
    <div className="space-y-3 border-b border-border p-4 sm:p-5">
      {/* Row 1: search + quick status chips */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search questions by title…"
            aria-label="Search questions"
            className="w-full rounded-lg border border-border bg-surface-2 py-2.5 pl-10 pr-9 text-sm text-ink placeholder:text-faint transition focus:border-brand-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {['All', 'Solved', 'Attempted', 'Unsolved'].map((status) => {
            const value = status === 'All' ? '' : status;
            const active = (filters.status || '') === value;
            return (
              <button
                key={status}
                type="button"
                onClick={() => onFilterChange('status', value)}
                className={[
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                  active
                    ? 'bg-brand-500 text-[#04211e]'
                    : 'border border-border text-muted hover:border-border-strong hover:text-ink',
                ].join(' ')}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: dropdown filters */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Select
          value={filters.topic || ''}
          onChange={(event) => onFilterChange('topic', event.target.value)}
          aria-label="Filter by topic"
          className="py-2 text-xs"
        >
          <option value="">All topics</option>
          {TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </Select>

        <Select
          value={filters.difficulty || ''}
          onChange={(event) => onFilterChange('difficulty', event.target.value)}
          aria-label="Filter by difficulty"
          className="py-2 text-xs"
        >
          <option value="">All difficulties</option>
          {DIFFICULTIES.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty}
            </option>
          ))}
        </Select>

        <Select
          value={filters.platform || ''}
          onChange={(event) => onFilterChange('platform', event.target.value)}
          aria-label="Filter by platform"
          className="py-2 text-xs"
        >
          <option value="">All platforms</option>
          {PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </Select>

        <Select
          value={filters.sort || 'newest'}
          onChange={(event) => onFilterChange('sort', event.target.value)}
          aria-label="Sort questions"
          className="py-2 text-xs"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
        </Select>
      </div>

      {/* Active filter indicator */}
      {activeCount > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-brand-soft px-3 py-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-brand-500">
            <Filter size={13} />
            {activeCount} filter{activeCount === 1 ? '' : 's'} applied
          </p>
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-brand-500 underline-offset-2 hover:underline"
          >
            Reset all
          </button>
        </div>
      )}
    </div>
  );
}
