import { forwardRef } from 'react';

const BASE_INPUT =
  'w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-faint ' +
  'transition-colors focus:border-brand-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

/**
 * Field — label + control + error wrapper used by all forms.
 */
function Field({ label, error, hint, required = false, children, htmlFor, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted"
        >
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

const Input = forwardRef(function Input({ className = '', error = false, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={`${BASE_INPUT} ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''} ${className}`}
      {...rest}
    />
  );
});

const Textarea = forwardRef(function Textarea({ className = '', error = false, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={`${BASE_INPUT} min-h-24 resize-y ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''} ${className}`}
      {...rest}
    />
  );
});

const Select = forwardRef(function Select({ className = '', error = false, children, ...rest }, ref) {
  return (
    <select
      ref={ref}
      className={`${BASE_INPUT} appearance-none bg-no-repeat pr-9 ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''} ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2394a0b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='2'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
        backgroundPosition: 'right 0.65rem center',
      }}
      {...rest}
    >
      {children}
    </select>
  );
});

export { Field, Input, Textarea, Select };
export default Input;
