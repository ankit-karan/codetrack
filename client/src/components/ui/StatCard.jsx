import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * StatCard — KPI tile for the dashboard header grid.
 */
export default function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = 'brand',
  trend = null,
  className = '',
}) {
  const tones = {
    brand: 'bg-brand-soft text-brand-500',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    info: 'bg-info-soft text-info',
    muted: 'bg-surface-2 text-muted',
  };

  return (
    <div
      className={`glass-card group p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md sm:p-5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-faint">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{value}</p>
        </div>
        {Icon && (
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${tones[tone] || tones.brand}`}
          >
            <Icon size={19} />
          </span>
        )}
      </div>
      {(sublabel || trend !== null) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
          {trend !== null && trend >= 0 ? (
            <TrendingUp size={13} className="text-success" />
          ) : trend !== null ? (
            <TrendingDown size={13} className="text-danger" />
          ) : null}
          {sublabel && <span className="truncate">{sublabel}</span>}
        </div>
      )}
    </div>
  );
}
