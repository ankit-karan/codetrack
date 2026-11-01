import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const TOKEN_KEY = 'codetrack_token';

/**
 * Shared axios instance.
 * - Attaches the JWT from localStorage to every request.
 * - On 401 (expired/invalid session) clears the token so the router
 *   redirects to the login page on the next state check.
 */
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';

    // Auth endpoints report their own errors (bad password etc.);
    // only *other* endpoints' 401s mean the session is dead.
    if (status === 401 && !requestUrl.includes('/auth/login') && !requestUrl.includes('/auth/register')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        // Only force a redirect when the user believes they are logged in.
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
