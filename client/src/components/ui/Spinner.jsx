import { Loader2 } from 'lucide-react';

/** Centered spinner used for page/section loading states. */
export function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-brand-500 ${className}`} />;
}

export function LoadingBlock({ label = 'Loading…', minHeight = 'min-h-40' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${minHeight}`}>
      <Spinner size={26} />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

export default Spinner;
