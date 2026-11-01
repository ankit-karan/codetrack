import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, LogOut, UserRound, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * Topbar — mobile menu trigger, quick "add question" action,
 * theme toggle and the user account dropdown.
 */
export default function Topbar({ onMenuClick = () => {}, pageTitle = '' }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the account dropdown on outside click / Escape.
  useEffect(() => {
    function handleClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    }
    function handleKey(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const initials = (user?.name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md sm:px-6">
      {/* Mobile menu */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-lg border border-border p-2 text-muted transition hover:text-ink lg:hidden"
      >
        <Menu size={18} />
      </button>

      {/* Page title (mobile only — desktop shows it in the page header) */}
      <p className="truncate text-sm font-semibold text-ink lg:hidden">{pageTitle}</p>

      <div className="hidden lg:block" />

      <div className="ml-auto flex items-center gap-2">
        {/* Quick add */}
        <button
          type="button"
          onClick={() => navigate('/questions?new=1')}
          className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition hover:border-brand-500/40 hover:text-brand-500 sm:inline-flex"
        >
          <Plus size={14} />
          New question
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="rounded-lg border border-border p-2 text-muted transition hover:border-border-strong hover:text-ink"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Account dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-lg border border-border py-1.5 pl-1.5 pr-2.5 transition hover:border-border-strong"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-400 to-brand-600 text-[11px] font-bold text-[#04211e]">
              {initials || '?'}
            </span>
            <span className="hidden max-w-32 truncate text-xs font-semibold text-ink sm:block">
              {user?.name}
            </span>
            <ChevronDown size={14} className={`text-faint transition ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="glass-card animate-fade-in-up absolute right-0 mt-2 w-56 overflow-hidden p-1.5"
            >
              <div className="border-b border-border px-3 py-2.5">
                <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
                <p className="truncate text-xs text-muted">{user?.email}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/profile');
                }}
                className="mt-1.5 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-ink"
              >
                <UserRound size={15} />
                Account settings
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-danger transition hover:bg-danger-soft"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
