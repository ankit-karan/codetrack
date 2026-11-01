/**
 * PracticeCalendar — GitHub-style contribution grid (last `weeks` weeks).
 * `counts`: { 'YYYY-MM-DD': solvedCount } in local time.
 */
const LEVEL_CLASSES = [
  'bg-surface-2',
  'bg-brand-500/25',
  'bg-brand-500/45',
  'bg-brand-500/70',
  'bg-brand-500',
];

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function PracticeCalendar({ counts = {}, weeks = 16 }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // End the grid on today's week (Sunday-aligned columns).
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay()));

  const totalDays = weeks * 7;
  const start = new Date(end);
  start.setDate(start.getDate() - totalDays + 1);

  const days = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const columns = [];
  for (let i = 0; i < days.length; i += 7) columns.push(days.slice(i, i + 7));

  const totalSolved = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const activeDays = Object.values(counts).filter((n) => n > 0).length;

  function levelFor(count) {
    if (!count) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count <= 4) return 3;
    return 4;
  }

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-1.5">
          {columns.map((week, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-1.5">
              {week.map((day) => {
                const key = toDateKey(day);
                const count = counts[key] || 0;
                const isFuture = day > today;
                const level = isFuture ? -1 : levelFor(count);
                return (
                  <div
                    key={key}
                    title={
                      isFuture
                        ? ''
                        : `${key} · ${count} question${count === 1 ? '' : 's'} solved`
                    }
                    className={[
                      'h-3.5 w-3.5 rounded-[3px]',
                      level === -1
                        ? 'bg-transparent border border-border'
                        : LEVEL_CLASSES[level],
                      count > 0 ? 'transition hover:opacity-75' : '',
                    ].join(' ')}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Month labels */}
      <div className="mt-1.5 flex min-w-max gap-1.5 overflow-hidden">
        {columns.map((week, index) => {
          const first = week[0];
          const showMonth = index === 0 || first.getDate() <= 7;
          return (
            <div key={index} className="w-3.5 text-[9px] text-faint">
              {showMonth
                ? first.toLocaleDateString(undefined, { month: 'short' }).slice(0, 3)
                : ''}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span>
          <span className="font-semibold text-ink">{totalSolved}</span> solved across{' '}
          <span className="font-semibold text-ink">{activeDays}</span> active days
        </span>
        <span className="flex items-center gap-1.5">
          Less
          {LEVEL_CLASSES.map((cls, index) => (
            <span key={index} className={`h-3 w-3 rounded-[3px] ${cls}`} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}
