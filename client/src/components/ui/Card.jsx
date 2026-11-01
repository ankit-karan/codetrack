/**
 * Card — surface container used by every panel on the dashboard.
 */
export default function Card({ children, className = '', hover = false, ...rest }) {
  return (
    <div
      className={[
        'glass-card',
        hover && 'transition-all duration-200 hover:border-border-strong hover:shadow-md',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon = null }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-500">
            <Icon size={16} />
          </span>
        )}
        <div>
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
