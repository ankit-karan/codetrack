import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

/**
 * AuthProvider — owns the current user + JWT session.
 * - Boot state is derived from the stored token (no setState-in-effect for
 *   initialization); the validation result lands in async callbacks only.
 * - login/register/logout expose the session to any component.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionStatus, setSessionStatus] = useState(() =>
    authService.getStoredToken() ? 'checking' : 'ready'
  );

  const logout = useCallback(() => {
    authService.clearSession();
    setUser(null);
    setSessionStatus('ready');
  }, []);

  // Validate any stored token when the app boots.
  useEffect(() => {
    if (!authService.getStoredToken()) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const currentUser = await authService.fetchCurrentUser();
        if (!cancelled) setUser(currentUser);
      } catch {
        // Invalid/expired token — drop it so protected routes redirect.
        if (!cancelled) authService.clearSession();
      } finally {
        if (!cancelled) setSessionStatus('ready');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const loggedIn = await authService.loginUser({ email, password });
    setUser(loggedIn);
    setSessionStatus('ready');
    return loggedIn;
  }, []);

  const register = useCallback(async (payload) => {
    const created = await authService.registerUser(payload);
    setUser(created);
    setSessionStatus('ready');
    return created;
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing: sessionStatus === 'checking',
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      updateUser: setUser,
    }),
    [user, sessionStatus, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
