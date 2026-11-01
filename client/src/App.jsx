import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import { LoadingBlock } from './components/ui/Spinner';

// Route-level code splitting keeps the initial bundle small:
// chart-heavy pages (Recharts) load only when visited.
const LoginScreen = lazy(() => import('./pages/LoginScreen'));
const RegisterScreen = lazy(() => import('./pages/RegisterScreen'));
const DashboardScreen = lazy(() => import('./pages/DashboardScreen'));
const QuestionsScreen = lazy(() => import('./pages/QuestionsScreen'));
const TopicsScreen = lazy(() => import('./pages/TopicsScreen'));
const RevisionsScreen = lazy(() => import('./pages/RevisionsScreen'));
const GoalsScreen = lazy(() => import('./pages/GoalsScreen'));
const ProfileScreen = lazy(() => import('./pages/ProfileScreen'));
const NotFoundScreen = lazy(() => import('./pages/NotFoundScreen'));

const PAGE_FALLBACK = (
  <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <LoadingBlock label="Loading page…" minHeight="min-h-72" />
  </div>
);

/** Redirects authenticated users away from the auth screens. */
function GuestRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  if (initializing) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

/**
 * App — application root: providers + route table.
 * Kept intentionally thin — screens live in src/pages, the shell in
 * components/layout, and all API calls in services/.
 */
export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={PAGE_FALLBACK}>
              <Routes>
                {/* Public auth screens */}
                <Route
                  path="/login"
                  element={
                    <GuestRoute>
                      <LoginScreen />
                    </GuestRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <GuestRoute>
                      <RegisterScreen />
                    </GuestRoute>
                  }
                />

                {/* Protected application shell */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardScreen />} />
                    <Route path="/questions" element={<QuestionsScreen />} />
                    <Route path="/topics" element={<TopicsScreen />} />
                    <Route path="/revisions" element={<RevisionsScreen />} />
                    <Route path="/goals" element={<GoalsScreen />} />
                    <Route path="/profile" element={<ProfileScreen />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFoundScreen />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
