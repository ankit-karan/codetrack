import { useEffect, useState } from 'react';
import { UserRound, Save, KeyRound, ExternalLink, ShieldCheck, CalendarDays, ListChecks, CheckCircle2, Target } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchProfile, updateProfile } from '../services/profileService';
import { getApiErrorMessage, formatDate } from '../utils/formatters';

import PageHeader from '../components/ui/PageHeader';
import Card, { CardHeader } from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import Logo from '../components/ui/Logo';
import { Field, Input } from '../components/ui/Input';
import { LoadingBlock } from '../components/ui/Spinner';

/**
 * ProfileScreen — account details, coding profile links, daily target,
 * password change and account settings.
 * NOTE: profile URLs are stored manually — no automatic platform sync.
 */
export default function ProfileScreen() {
  useDocumentTitle('Profile');
  const { updateUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchProfile();
        if (cancelled) return;
        setProfile(data.user);
        setStats(data.stats);
        setForm({
          name: data.user.name || '',
          dailyGoal: data.user.dailyGoal ?? 3,
          leetcode: data.user.codingProfiles?.leetcode || '',
          geeksforgeeks: data.user.codingProfiles?.geeksforgeeks || '',
        });
      } catch (err) {
        if (!cancelled) setLoadError(getApiErrorMessage(err, 'Could not load your profile.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (saveError) setSaveError(null);
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaveError(null);

    const dailyGoal = Number(form.dailyGoal);
    if (!Number.isInteger(dailyGoal) || dailyGoal < 1 || dailyGoal > 50) {
      setSaveError('Daily target must be a whole number between 1 and 50.');
      return;
    }
    for (const [key, label] of [
      ['leetcode', 'LeetCode'],
      ['geeksforgeeks', 'GeeksforGeeks'],
    ]) {
      const value = form[key].trim();
      if (value && !/^https?:\/\/\S+$/i.test(value)) {
        setSaveError(`${label} profile must be a valid URL starting with http(s)://`);
        return;
      }
    }

    setSaving(true);
    try {
      const data = await updateProfile({
        name: form.name.trim(),
        dailyGoal,
        codingProfiles: {
          leetcode: form.leetcode.trim(),
          geeksforgeeks: form.geeksforgeeks.trim(),
        },
      });
      setProfile(data.user);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      setSaveError(getApiErrorMessage(err, 'Could not save your profile.'));
    } finally {
      setSaving(false);
    }
  }

  function validatePassword() {
    if (!pw.currentPassword || !pw.newPassword) {
      setPwError('Enter both your current and new password.');
      return false;
    }
    if (pw.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return false;
    }
    if (pw.newPassword !== pw.confirm) {
      setPwError('New passwords do not match.');
      return false;
    }
    return true;
  }

  async function handlePasswordChange(event) {
    event.preventDefault();
    setPwError(null);
    if (!validatePassword()) return;

    setPwSaving(true);
    try {
      await updateProfile({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed successfully');
    } catch (err) {
      setPwError(getApiErrorMessage(err, 'Could not change the password.'));
    } finally {
      setPwSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Profile" />
        <LoadingBlock label="Loading your profile…" minHeight="min-h-60" />
      </>
    );
  }

  if (loadError || !form) {
    return (
      <>
        <PageHeader title="Profile" />
        <Alert message={loadError || 'Could not load your profile.'} />
        <div className="mt-4">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Manage your account, targets and coding profile links." />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Questions logged" value={stats?.totalQuestions ?? 0} icon={ListChecks} tone="brand" />
        <StatCard label="Questions solved" value={stats?.solvedQuestions ?? 0} icon={CheckCircle2} tone="success" />
        <StatCard label="Daily target" value={profile?.dailyGoal ?? 3} icon={Target} tone="info" />
        <StatCard
          label="Member since"
          value={profile?.createdAt ? formatDate(profile.createdAt).split(',')[0] : '—'}
          sublabel={profile?.createdAt ? formatDate(profile.createdAt) : ''}
          icon={CalendarDays}
          tone="muted"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Account details */}
        <Card className="p-5">
          <CardHeader title="Account details" icon={UserRound} />

          {saveError && <Alert message={saveError} className="mb-4" />}

          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Full name" htmlFor="pf-name" required>
              <Input
                id="pf-name"
                value={form.name}
                onChange={(event) => setField('name', event.target.value)}
                maxLength={60}
                required
              />
            </Field>

            <Field label="Email address" htmlFor="pf-email" hint="Email is used to sign in and cannot be changed here.">
              <Input id="pf-email" value={profile?.email || ''} disabled readOnly />
            </Field>

            <Field label="Daily question target" htmlFor="pf-goal" hint="1–50 questions per day">
              <Input
                id="pf-goal"
                type="number"
                min="1"
                max="50"
                value={form.dailyGoal}
                onChange={(event) => setField('dailyGoal', event.target.value)}
              />
            </Field>

            <Field
              label="LeetCode profile URL"
              htmlFor="pf-leetcode"
              hint="Paste your public profile link — stored for reference only."
            >
              <div className="relative">
                <Input
                  id="pf-leetcode"
                  type="url"
                  placeholder="https://leetcode.com/u/your-username/"
                  value={form.leetcode}
                  onChange={(event) => setField('leetcode', event.target.value)}
                  className="pr-9"
                />
                {form.leetcode && (
                  <a
                    href={form.leetcode}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="Open LeetCode profile"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-faint transition hover:text-brand-500"
                  >
                    <ExternalLink size={15} />
                  </a>
                )}
              </div>
            </Field>

            <Field
              label="GeeksforGeeks profile URL"
              htmlFor="pf-gfg"
              hint="Stored for reference only."
            >
              <div className="relative">
                <Input
                  id="pf-gfg"
                  type="url"
                  placeholder="https://www.geeksforgeeks.org/user/your-username/"
                  value={form.geeksforgeeks}
                  onChange={(event) => setField('geeksforgeeks', event.target.value)}
                  className="pr-9"
                />
                {form.geeksforgeeks && (
                  <a
                    href={form.geeksforgeeks}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="Open GeeksforGeeks profile"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-faint transition hover:text-brand-500"
                  >
                    <ExternalLink size={15} />
                  </a>
                )}
              </div>
            </Field>

            <Button type="submit" loading={saving} icon={Save} className="w-full">
              Save changes
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          {/* Password change */}
          <Card className="p-5">
            <CardHeader title="Change password" subtitle="Requires your current password" icon={KeyRound} />

            {pwError && <Alert message={pwError} className="mb-4" />}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <Field label="Current password" htmlFor="pw-current" required>
                <Input
                  id="pw-current"
                  type="password"
                  autoComplete="current-password"
                  value={pw.currentPassword}
                  onChange={(event) => setPw((prev) => ({ ...prev, currentPassword: event.target.value }))}
                  required
                />
              </Field>
              <Field label="New password" htmlFor="pw-new" hint="At least 8 characters." required>
                <Input
                  id="pw-new"
                  type="password"
                  autoComplete="new-password"
                  value={pw.newPassword}
                  onChange={(event) => setPw((prev) => ({ ...prev, newPassword: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Confirm new password" htmlFor="pw-confirm" required>
                <Input
                  id="pw-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={pw.confirm}
                  onChange={(event) => setPw((prev) => ({ ...prev, confirm: event.target.value }))}
                  required
                />
              </Field>
              <Button type="submit" variant="secondary" loading={pwSaving} icon={ShieldCheck} className="w-full">
                Update password
              </Button>
            </form>
          </Card>

          {/* About / settings */}
          <Card className="p-5">
            <CardHeader title="About this account" icon={ShieldCheck} />
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Plan</span>
                <Badge className="bg-brand-soft text-brand-500">Personal</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Authentication</span>
                <span className="font-medium text-ink">JWT · bcrypt hashed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Data isolation</span>
                <span className="font-medium text-success">Per-user scoped</span>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-info-soft px-3.5 py-3 text-xs leading-relaxed text-info">
              <span>ℹ</span>
              <p>
                Coding profile URLs are <strong>reference links you paste yourself</strong> —
                CodeTrack does not automatically sync with LeetCode or GeeksforGeeks. All
                analytics are computed solely from the questions you log here.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <Logo size="sm" />
              <p className="text-[11px] text-faint">v1.0.0</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
