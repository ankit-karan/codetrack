import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRound, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { Field, Input } from '../components/ui/Input';
import { getApiErrorMessage } from '../utils/formatters';
import heroImage from '../assets/hero.png';

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Name is required.';
  else if (values.name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';

  if (!values.email.trim()) errors.email = 'Email is required.';
  else if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.';

  if (!values.password) errors.password = 'Password is required.';
  else if (values.password.length < 8) errors.password = 'Password must be at least 8 characters.';

  if (values.confirm !== values.password) errors.confirm = 'Passwords do not match.';

  return errors;
}

/**
 * RegisterScreen — account creation with client-side validation
 * mirroring the backend rules.
 */
export default function RegisterScreen() {
  useDocumentTitle('Create account');
  const { register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function setField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError(null);

    const clientErrors = validate(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Form panel */}
      <div className="flex w-full items-center justify-center px-4 py-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Logo size="lg" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-ink">Create your account</h2>
          <p className="mt-1.5 text-sm text-muted">
            Start tracking your DSA journey in under a minute.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            {serverError && <Alert message={serverError} onDismiss={() => setServerError(null)} />}

            <Field label="Full name" htmlFor="reg-name" error={errors.name}>
              <div className="relative">
                <UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                <Input
                  id="reg-name"
                  autoComplete="name"
                  placeholder="Ankit Kumar"
                  value={values.name}
                  onChange={(event) => setField('name', event.target.value)}
                  className="pl-10"
                  error={Boolean(errors.name)}
                  required
                />
              </div>
            </Field>

            <Field label="Email address" htmlFor="reg-email" error={errors.email}>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                <Input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={values.email}
                  onChange={(event) => setField('email', event.target.value)}
                  className="pl-10"
                  error={Boolean(errors.email)}
                  required
                />
              </div>
            </Field>

            <Field
              label="Password"
              htmlFor="reg-password"
              error={errors.password}
              hint="At least 8 characters."
            >
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={(event) => setField('password', event.target.value)}
                  className="pl-10 pr-11"
                  error={Boolean(errors.password)}
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

            <Field label="Confirm password" htmlFor="reg-confirm" error={errors.confirm}>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                <Input
                  id="reg-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={values.confirm}
                  onChange={(event) => setField('confirm', event.target.value)}
                  className="pl-10"
                  error={Boolean(errors.confirm)}
                  required
                />
              </div>
            </Field>

            <Button type="submit" loading={submitting} size="lg" className="w-full" icon={ArrowRight}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-500 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Brand panel */}
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
              Your progress deserves a <span className="text-gradient">real dashboard</span>.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Stop juggling spreadsheets and bookmarks. CodeTrack turns your practice data into
              topic mastery, streaks and revision intelligence.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-muted">
              {[
                'Question database with filters, search and pagination',
                'Real analytics computed from your own records',
                'Spaced revision planner with overdue tracking',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-faint">
            Built for the Full Stack Web Developer Virtual Internship · CodeTrack
          </p>
        </div>
      </div>
    </div>
  );
}
