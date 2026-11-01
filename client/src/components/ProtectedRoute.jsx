import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui/Spinner';
import Logo from './ui/Logo';

/**
 * ProtectedRoute — guards every authenticated page.
 * While the stored JWT is being validated we show a branded splash instead
 * of flashing the login page at existing users.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg">
        <Logo size="lg" />
        <div className="flex items-center gap-2.5 text-sm text-muted">
          <Spinner size={18} />
          Restoring your session…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
