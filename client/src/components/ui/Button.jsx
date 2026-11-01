import { Loader2 } from 'lucide-react';

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-sm gap-2',
};

const VARIANTS = {
  primary:
    'bg-brand-500 text-[#04211e] hover:bg-brand-400 shadow-sm shadow-brand-500/20 font-semibold',
  secondary:
    'bg-surface-2 text-ink border border-border hover:border-border-strong hover:bg-surface',
  ghost: 'bg-transparent text-muted hover:text-ink hover:bg-surface-2',
  danger: 'bg-danger-soft text-danger hover:bg-danger hover:text-white',
  outline: 'bg-transparent border border-brand-500/50 text-brand-500 hover:bg-brand-soft',
};

/**
 * Button — the single button primitive used across the app.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon = null,
  className = '',
  type = 'button',
  ...rest
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        'disabled:cursor-not-allowed disabled:opacity-55',
        SIZES[size] || SIZES.md,
        VARIANTS[variant] || VARIANTS.primary,
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        Icon && <Icon size={size === 'sm' ? 14 : 16} />
      )}
      {children}
    </button>
  );
}
