import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { fetchRevisions } from '../../services/revisionService';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/questions': 'Questions',
  '/topics': 'Topics',
  '/revisions': 'Revisions',
  '/goals': 'Goals & Streaks',
  '/profile': 'Profile',
};

/**
 * DashboardLayout — app shell (sidebar + topbar + routed content).
 * Also polls the overdue revision count for the sidebar badge.
 */
export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);
  const location = useLocation();

  // Note: the mobile drawer closes via the Sidebar's own link onClick
  // handlers — no effect needed on route change.

  // Badge count for overdue revisions (failure is non-critical).
  useEffect(() => {
    let cancelled = false;
    let timer;

    async function load() {
      try {
        const data = await fetchRevisions('overdue');
        if (!cancelled) setOverdueCount(data?.counts?.overdue || 0);
      } catch {
        /* ignore — badge is cosmetic */
      }
    }

    load();
    timer = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const pageTitle = PAGE_TITLES[location.pathname] || 'CodeTrack';

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        overdueCount={overdueCount}
      />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Topbar onMenuClick={() => setMobileOpen(true)} pageTitle={pageTitle} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet context={{ refreshOverdue: setOverdueCount }} />
          </div>
        </main>
      </div>
    </div>
  );
}
