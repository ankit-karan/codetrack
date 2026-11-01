import { AlertCircle, CheckCircle2, X } from 'lucide-react';

/**
 * Alert — inline error/success/info banner used in forms and pages.
 */
export default function Alert({ type = 'error', message, onDismiss = null, className = '' }) {
  const tones = {
    error: 'bg-danger-soft text-danger border-danger/25',
    success: 'bg-success-soft text-success border-success/25',
    warning: 'bg-warning-soft text-warning border-warning/25',
    info: 'bg-info-soft text-info border-info/25',
  };

  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${tones[type] || tones.error} ${className}`}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <p className="flex-1 leading-snug">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="opacity-60 transition hover:opacity-100"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
