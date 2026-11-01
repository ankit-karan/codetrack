import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  Target,
  CalendarClock,
  Trophy,
  UserRound,
  X,
} from 'lucide-react';
import Logo from '../ui/Logo';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Practice',
    items: [
      { to: '/questions', label: 'Questions', icon: ListChecks },
      { to: '/topics', label: 'Topics', icon: Target },
    ],
  },
  {
    label: 'Planning',
    items: [
      { to: '/revisions', label: 'Revisions', icon: CalendarClock },
      { to: '/goals', label: 'Goals & Streaks', icon: Trophy },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/profile', label: 'Profile', icon: UserRound }],
  },
];

/**
 * Sidebar — responsive navigation (fixed on desktop, drawer on mobile).
 * `mobileOpen` / `onNavigate` control the mobile drawer.
 */
export default function Sidebar({ mobileOpen = false, onClose = () => {}, overdueCount = 0 }) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface',
          'transition-transform duration-300 ease-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Logo to="/dashboard" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-faint transition hover:bg-surface-2 hover:text-ink lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-5">
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        [
                          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                          isActive
                            ? 'bg-brand-soft text-brand-500'
                            : 'text-muted hover:bg-surface-2 hover:text-ink',
                        ].join(' ')
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={17}
                            className="transition-transform duration-150 group-hover:scale-110"
                          />
                          <span className="flex-1">{label}</span>
                          {to === '/revisions' && overdueCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
                              {overdueCount > 99 ? '99+' : overdueCount}
                            </span>
                          )}
                          {isActive && (
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer hint */}
        <div className="border-t border-border px-5 py-4">
          <p className="text-[11px] leading-relaxed text-faint">
            Track. Revise. Conquer.
            <br />
            <span className="text-muted">Your DSA intelligence layer.</span>
          </p>
        </div>
      </aside>
    </>
  );
}
