import { useState } from 'react';
import { Target, Flame, Trophy, CalendarDays, Save, TrendingUp, Award } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useToast } from '../context/ToastContext';
import useAsync from '../hooks/useAsync';
import { fetchGoals, createGoal, updateGoal } from '../services/goalService';
import { fetchOverview, fetchActivity } from '../services/analyticsService';
import { getApiErrorMessage, formatDate } from '../utils/formatters';

import PageHeader from '../components/ui/PageHeader';
import Card, { CardHeader } from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import { Field, Input } from '../components/ui/Input';
import { LoadingBlock } from '../components/ui/Spinner';
import PracticeCalendar from '../components/goals/PracticeCalendar';

function toDateInputValue(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * GoalsScreen — daily/weekly goal configuration, streak stats,
 * progress indicators and the practice contribution calendar.
 */
export default function GoalsScreen() {
  useDocumentTitle('Goals & streaks');
  const toast = useToast();

  const goalsQuery = useAsync(fetchGoals, 'goals');
  const overviewQuery = useAsync(fetchOverview, 'overview');
  const activityQuery = useAsync(() => fetchActivity(112), 'activity-112'); // ~16 weeks

  // Only the user's *unsaved edits* live in state; the rest of the form is
  // derived from server data on every render (no init effect needed).
  const [edits, setEdits] = useState(null);
  // Default goal period (today → +6 days) computed once at mount.
  const [defaultDates] = useState(() => ({
    startDate: toDateInputValue(new Date()),
    endDate: toDateInputValue(new Date(Date.now() + 6 * 86400000)),
  }));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  if (goalsQuery.loading || overviewQuery.loading) {
    return (
      <>
        <PageHeader title="Goals & streaks" />
        <LoadingBlock label="Loading your goals…" minHeight="min-h-72" />
      </>
    );
  }

  if (goalsQuery.error) {
    return (
      <>
        <PageHeader title="Goals & streaks" />
        <Alert message={goalsQuery.error} />
        <div className="mt-4">
          <Button variant="secondary" onClick={goalsQuery.refresh}>
            Retry
          </Button>
        </div>
      </>
    );
  }

  const { goal, progress } = goalsQuery.data || {};
  const streak = overviewQuery.data?.streak;
  const activity = overviewQuery.data?.activity;

  // Derived form: server values unless the user has edited them this session.
  const form = {
    dailyTarget: edits?.dailyTarget ?? goal?.dailyTarget ?? progress?.daily?.target ?? 3,
    weeklyTarget: edits?.weeklyTarget ?? goal?.weeklyTarget ?? progress?.weekly?.target ?? 15,
    startDate: edits?.startDate ?? (goal ? toDateInputValue(goal.startDate) : defaultDates.startDate),
    endDate: edits?.endDate ?? (goal ? toDateInputValue(goal.endDate) : defaultDates.endDate),
  };

  // Build the calendar counts (local dates) from the activity series.
  const calendarCounts = {};
  (activityQuery.data?.series || []).forEach((point) => {
    if (point.count > 0) {
      const [year, month, day] = point.date.split('-').map(Number);
      const local = new Date(year, month - 1, day);
      const key = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
      calendarCounts[key] = point.count;
    }
  });

  function setField(field, value) {
    setEdits((prev) => ({ ...(prev || {}), [field]: value }));
    if (formError) setFormError(null);
  }

  async function handleSave(event) {
    event.preventDefault();
    setFormError(null);

    const dailyTarget = Number(form.dailyTarget);
    const weeklyTarget = Number(form.weeklyTarget);

    if (!Number.isInteger(dailyTarget) || dailyTarget < 1 || dailyTarget > 50) {
      setFormError('Daily target must be a whole number between 1 and 50.');
      return;
    }
    if (!Number.isInteger(weeklyTarget) || weeklyTarget < 1 || weeklyTarget > 350) {
      setFormError('Weekly target must be a whole number between 1 and 350.');
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setFormError('End date must be on or after the start date.');
      return;
    }

    const payload = {
      dailyTarget,
      weeklyTarget,
      startDate: new Date(`${form.startDate}T00:00:00`).toISOString(),
      endDate: new Date(`${form.endDate}T00:00:00`).toISOString(),
    };

    setSaving(true);
    try {
      if (goal?._id) {
        await updateGoal(goal._id, payload);
        toast.success('Goals updated');
      } else {
        await createGoal(payload);
        toast.success('Goals created');
      }
      // Drop local edits so the form re-derives from the persisted values.
      setEdits(null);
      goalsQuery.refresh();
      overviewQuery.refresh();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Could not save your goals.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals & streaks"
        subtitle="Set daily and weekly targets, protect your streak and watch your consistency compound."
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Current streak"
          value={`${streak?.current ?? 0}d`}
          sublabel={streak?.current > 0 ? 'Keep it alive' : 'Solve today to start'}
          icon={Flame}
          tone={streak?.current > 0 ? 'brand' : 'muted'}
        />
        <StatCard
          label="Longest streak"
          value={`${streak?.longest ?? 0}d`}
          sublabel="Personal best"
          icon={Trophy}
          tone="warning"
        />
        <StatCard
          label="Solved this week"
          value={progress?.weekly?.solved ?? 0}
          sublabel={`Target: ${progress?.weekly?.target ?? '—'}`}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Solved today"
          value={progress?.daily?.solved ?? 0}
          sublabel={`Target: ${progress?.daily?.target ?? '—'}`}
          icon={Target}
          tone="info"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Goal configuration */}
        <Card className="p-5">
          <CardHeader
            title={goal ? 'Active goal period' : 'Create your first goal'}
            subtitle={
              goal
                ? `${formatDate(goal.startDate)} → ${formatDate(goal.endDate)}`
                : 'Define daily + weekly targets for a goal period.'
            }
            icon={Target}
          />

          {!goal && (
            <Alert
              type="info"
              message="No active goal yet. Your daily progress below currently uses your profile daily target until you create one."
              className="mb-4"
            />
          )}

          {formError && <Alert message={formError} className="mb-4" />}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Daily target" htmlFor="goal-daily" hint="1–50 questions/day">
                <Input
                  id="goal-daily"
                  type="number"
                  min="1"
                  max="50"
                  value={form?.dailyTarget ?? ''}
                  onChange={(event) => setField('dailyTarget', event.target.value)}
                />
              </Field>
              <Field label="Weekly target" htmlFor="goal-weekly" hint="1–350 questions/week">
                <Input
                  id="goal-weekly"
                  type="number"
                  min="1"
                  max="350"
                  value={form?.weeklyTarget ?? ''}
                  onChange={(event) => setField('weeklyTarget', event.target.value)}
                />
              </Field>
              <Field label="Start date" htmlFor="goal-start">
                <Input
                  id="goal-start"
                  type="date"
                  value={form?.startDate ?? ''}
                  onChange={(event) => setField('startDate', event.target.value)}
                />
              </Field>
              <Field label="End date" htmlFor="goal-end">
                <Input
                  id="goal-end"
                  type="date"
                  value={form?.endDate ?? ''}
                  onChange={(event) => setField('endDate', event.target.value)}
                />
              </Field>
            </div>

            <Button type="submit" loading={saving} icon={Save} className="w-full">
              {goal?._id ? 'Update goals' : 'Activate goal'}
            </Button>
          </form>

          {/* Progress indicators */}
          <div className="mt-6 space-y-4 border-t border-border pt-5">
            <ProgressBar
              value={progress?.daily?.solved ?? 0}
              max={progress?.daily?.target || 1}
              tone={(progress?.daily?.completed) ? 'success' : 'brand'}
              showLabel
              label="Daily progress"
              size="lg"
            />
            <ProgressBar
              value={progress?.weekly?.solved ?? 0}
              max={progress?.weekly?.target || 1}
              tone={(progress?.weekly?.completed) ? 'success' : 'info'}
              showLabel
              label="Weekly progress"
              size="lg"
            />
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge
                className={
                  progress?.daily?.completed ? 'bg-success-soft text-success' : 'bg-surface-2 text-muted'
                }
                dot
              >
                Daily {progress?.daily?.completed ? 'met 🎉' : 'in progress'}
              </Badge>
              <Badge
                className={
                  progress?.weekly?.completed ? 'bg-success-soft text-success' : 'bg-surface-2 text-muted'
                }
                dot
              >
                Weekly {progress?.weekly?.completed ? 'met 🎉' : 'in progress'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Streak stats */}
        <Card className="p-5">
          <CardHeader title="Consistency report" subtitle="Computed from your real solve dates" icon={Award} />
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-2 p-4">
              <p className="text-3xl font-bold text-brand-500">{streak?.current ?? 0}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted">
                Current streak (days)
              </p>
            </div>
            <div className="rounded-xl bg-surface-2 p-4">
              <p className="text-3xl font-bold text-warning">{streak?.longest ?? 0}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted">
                Longest streak (days)
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5 rounded-xl border border-border p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Solved today</span>
              <span className="font-semibold text-ink">
                {activity?.solvedToday ?? progress?.daily?.solved ?? 0} / {activity?.dailyTarget ?? progress?.daily?.target ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Solved this week</span>
              <span className="font-semibold text-ink">{activity?.solvedThisWeek ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Daily goal status</span>
              <Badge
                className={
                  activity?.dailyTargetMet ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'
                }
                dot
              >
                {activity?.dailyTargetMet ? 'Met' : 'Not yet'}
              </Badge>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-faint">
            Streaks count consecutive UTC days with at least one question marked <em>Solved</em>.
            Yesterday&apos;s activity keeps today&apos;s streak alive until midnight.
          </p>
        </Card>
      </div>

      {/* Practice calendar */}
      <Card className="p-5">
        <CardHeader
          title="Practice calendar"
          subtitle="Last 16 weeks of your solving activity"
          icon={CalendarDays}
          action={
            activityQuery.loading ? (
              <span className="text-xs text-faint">Loading…</span>
            ) : null
          }
        />
        {activityQuery.error ? (
          <Alert message={activityQuery.error} />
        ) : totalSolvedInWindow(calendarCounts) === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            No activity in this window yet — solve and mark questions as <strong>Solved</strong> and
            your calendar will light up.
          </p>
        ) : (
          <PracticeCalendar counts={calendarCounts} weeks={16} />
        )}
      </Card>
    </div>
  );
}

function totalSolvedInWindow(counts) {
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}
