/**
 * ProgressBar — labelled completion bar with configurable tone.
 * Percentage is clamped 0-100 for safe rendering.
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  tone = 'brand',
  showLabel = false,
  label,
  size = 'md',
  className = '',
}) {
  const safeMax = max > 0 ? max : 100;
  const percent = Math.max(0, Math.min(100, Math.round((value / safeMax) * 100)));

  const tones = {
    brand: 'bg-brand-500',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
  };

  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };

  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-muted">{label}</span>
          <span className="font-semibold text-ink">{percent}%</span>
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-surface-2 ${heights[size] || heights.md}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={safeMax}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${tones[tone] || tones.brand}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
