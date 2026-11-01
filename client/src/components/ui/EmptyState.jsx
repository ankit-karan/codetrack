import { Inbox } from 'lucide-react';

/**
 * EmptyState — friendly zero-data message with an optional action.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  message,
  action = null,
  compact = false,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-14'}`}
    >
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-2 text-faint">
        <Icon size={26} />
      </span>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {message && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
