import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { Field, Input } from '../components/ui/Input';
import { getApiErrorMessage } from '../utils/formatters';
import heroImage from '../assets/hero.png';

/**
 * LoginScreen — split layout: brand panel + login form.
 */
export default function LoginScreen() {
  useDocumentTitle('Sign in');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      const destination = location.state?.from || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Sign in failed. Please check your credentials.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Brand panel (hidden on small screens) */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-bg via-bg/90 to-brand-600/20" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo size="lg" />
          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-ink">
              Master DSA with <span className="text-gradient">clarity and consistency</span>.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Track every question, measure topic-wise mastery, schedule revisions and keep your
              coding streak alive — all in one focused workspace.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                ['18', 'DSA topics'],
                ['4', 'Platforms'],
                ['∞', 'Revisions'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl border border-border bg-surface/70 p-4 backdrop-blur">
                  <p className="text-2xl font-bold text-brand-500">{value}</p>
                  <p className="mt-1 text-xs text-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-faint">
            Built for the Full Stack Web Developer Virtual Internship · CodeTrack
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center px-4 py-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo size="lg" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-ink">Welcome back</h2>
          <p className="mt-1.5 text-sm text-muted">Sign in to continue your preparation.</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            {error && <Alert message={error} onDismiss={() => setError(null)} />}

            <Field label="Email address" htmlFor="login-email">
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </Field>

            <Field label="Password" htmlFor="login-password">
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-10 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-faint transition hover:text-ink"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Button type="submit" loading={submitting} size="lg" className="w-full" icon={ArrowRight}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-500 hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
