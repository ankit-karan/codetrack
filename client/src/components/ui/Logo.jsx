import { Zap } from 'lucide-react';

/**
 * Logo — brand lockup used in the sidebar and auth screens.
 */
export default function Logo({ size = 'md', showText = true, to = null }) {
  const wrapper = to ? 'a' : 'div';
  const Wrapper = wrapper;

  const sizes = {
    sm: { box: 'h-8 w-8', icon: 16, text: 'text-sm' },
    md: { box: 'h-9 w-9', icon: 18, text: 'text-base' },
    lg: { box: 'h-12 w-12', icon: 24, text: 'text-xl' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <Wrapper
      {...(to ? { href: to } : {})}
      className="flex items-center gap-2.5 select-none"
    >
      <span
        className={`flex ${s.box} items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-[#04211e] shadow-lg shadow-brand-500/25`}
      >
        <Zap size={s.icon} fill="currentColor" />
      </span>
      {showText && (
        <span className={`font-bold tracking-tight text-ink ${s.text}`}>
          Code<span className="text-brand-500">Track</span>
        </span>
      )}
    </Wrapper>
  );
}
