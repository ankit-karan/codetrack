import { useNavigate } from 'react-router-dom';
import {
  ListChecks,
  CheckCircle2,
  CircleDot,
  CircleSlash,
  Flame,
  TrendingUp,
  Target,
  CalendarClock,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useAsync from '../hooks/useAsync';
import { fetchOverview, fetchTopicAnalytics, fetchActivity } from '../services/analyticsService';
import { fetchGoals } from '../services/goalService';
import { useToast } from '../context/ToastContext';

import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { LoadingBlock } from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import ProblemFormModal from '../components/problems/ProblemFormModal';

import DonutChart from '../components/charts/DonutChart';
import TopicBarChart from '../components/charts/TopicBarChart';
import ActivityChart from '../components/charts/ActivityChart';
import { formatDate } from '../utils/formatters';
import { useState } from 'react';

/**
 * DashboardScreen — the analytics home.
 * Every number comes from GET /api/analytics/* (real DB records only).
 */
export default function DashboardScreen() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const overview = useAsync(fetchOverview, 'overview');
  const topics = useAsync(fetchTopicAnalytics, 'topics');
  const weekly = useAsync(() => fetchActivity(7), 'activity-7');
  const monthly = useAsync(() => fetchActivity(30), 'activity-30');
  const goals = useAsync(fetchGoals, 'goals');

  const loading = overview.loading || topics.loading;
  const data = overview.data;
  const goalData = goals.data;

  if (loading) {
    return (
      <>
        <PageHeader title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'} 👋`} />
        <LoadingBlock label="Crunching your analytics…" minHeight="min-h-72" />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <Alert message={overview.error || 'Could not load your dashboard data.'} />
        <div className="mt-4">
          <Button variant="secondary" onClick={overview.refresh}>
            Retry
          </Button>
        </div>
      </>
    );
  }

  const { totals, completionPercentage, streak, activity, revisions } = data;
  const isEmpty = totals.total === 0;

  const difficultyData = [
    { name: 'Easy', value: totals.easy },
    { name: 'Medium', value: totals.medium },
    { name: 'Hard', value: totals.hard },
  ];

  const statusData = [
    { name: 'Solved', value: totals.solved },
    { name: 'Attempted', value: totals.attempted },
    { name: 'Unsolved', value: totals.unsolved },
  ];

  const weeklyProgress = goalData?.progress?.weekly;

  // ProblemFormModal persists through the API itself; here we only refresh
  // every dependent widget and confirm with a toast.
  function handleQuickAdd(saved) {
    toast.success(`“${saved.title}” added to your tracker`);
    overview.refresh();
    topics.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'} 👋`}
        subtitle={formatDate(new Date()) + ' · Keep the streak alive.'}
        actions={
          <>
            <Button variant="secondary" icon={CalendarClock} onClick={() => navigate('/revisions')}>
              Revisions{revisions.overdue > 0 ? ` (${revisions.overdue} overdue)` : ''}
            </Button>
            <Button icon={Plus} onClick={() => setQuickAddOpen(true)}>
              Add question
            </Button>
          </>
        }
      />

      {/* Empty onboarding state */}
      {isEmpty && (
        <Card className="p-2">
          <EmptyState
            title="Your dashboard is ready for data"
            message="Add your first DSA question (or run the demo seed) and every chart, streak and topic analysis on this page will come alive."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button icon={Plus} onClick={() => setQuickAddOpen(true)}>
                  Add your first question
                </Button>
                <Button variant="secondary" onClick={() => navigate('/questions')}>
                  Open question manager
                </Button>
              </div>
            }
          />
        </Card>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Total" value={totals.total} icon={ListChecks} tone="brand" />
        <StatCard
          label="Solved"
          value={totals.solved}
          icon={CheckCircle2}
          tone="success"
          sublabel={`${completionPercentage}% complete`}
        />
        <StatCard label="Attempted" value={totals.attempted} icon={CircleDot} tone="warning" />
        <StatCard label="Unsolved" value={totals.unsolved} icon={CircleSlash} tone="danger" />
        <StatCard label="Easy" value={totals.easy} icon={TrendingUp} tone="success" />
        <StatCard label="Medium" value={totals.medium} icon={Target} tone="warning" />
        <StatCard label="Hard" value={totals.hard} icon={Flame} tone="danger" />
      </div>

      {/* Streak + goals row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Streak */}
        <Card className="p-5">
          <CardHeader title="Coding streak" subtitle="Based on your actual solve dates" icon={Flame} />
          <div className="flex items-end gap-6">
            <div>
              <p className="text-4xl font-bold tracking-tight text-brand-500">
                {streak.current}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted">
                Day streak
              </p>
            </div>
            <div className="border-l border-border pl-6">
              <p className="text-2xl font-bold text-ink">{streak.longest}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted">
                Personal best
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-surface-2 px-3.5 py-2.5 text-xs text-muted">
            {activity.solvedToday > 0 ? (
              <span>
                <span className="font-semibold text-success">{activity.solvedToday}</span> solved
                today · {activity.solvedThisWeek} this week
              </span>
            ) : (
              <span>
                Solve one question today to keep your{' '}
                <span className="font-semibold text-ink">{streak.current}</span>-day streak going.
              </span>
            )}
          </div>
        </Card>

        {/* Daily goal */}
        <Card className="p-5">
          <CardHeader
            title="Daily goal"
            subtitle={`Target: ${activity.dailyTarget} questions`}
            icon={Target}
          />
          <ProgressBar
            value={activity.solvedToday}
            max={activity.dailyTarget}
            tone={activity.dailyTargetMet ? 'success' : 'brand'}
            showLabel
            label="Today's progress"
            size="lg"
          />
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-muted">
              <span className="font-semibold text-ink">{activity.solvedToday}</span> /{' '}
              {activity.dailyTarget} solved
            </span>
            <Badge
              className={
                activity.dailyTargetMet ? 'bg-success-soft text-success' : 'bg-surface-2 text-muted'
              }
              dot
            >
              {activity.dailyTargetMet ? 'Goal met 🎉' : 'In progress'}
            </Badge>
          </div>
        </Card>

        {/* Weekly goal */}
        <Card className="p-5">
          <CardHeader title="Weekly goal" subtitle="Monday → Sunday" icon={TrendingUp} />
          <ProgressBar
            value={weeklyProgress?.solved ?? activity.solvedThisWeek}
            max={weeklyProgress?.target ?? activity.weeklyTarget ?? 1}
            tone={
              weeklyProgress?.completed ? 'success' : 'brand'
            }
            showLabel
            label="This week"
            size="lg"
          />
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-muted">
              <span className="font-semibold text-ink">
                {weeklyProgress?.solved ?? activity.solvedThisWeek}
              </span>{' '}
              / {weeklyProgress?.target ?? activity.weeklyTarget ?? '—'} solved
            </span>
            <button
              type="button"
              onClick={() => navigate('/goals')}
              className="inline-flex items-center gap-1 font-semibold text-brand-500 hover:underline"
            >
              Manage <ArrowRight size={12} />
            </button>
          </div>
        </Card>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <CardHeader title="Difficulty distribution" subtitle="All logged questions" />
          <DonutChart data={difficultyData} centerValue={totals.total} centerLabel="Questions" />
        </Card>

        <Card className="p-5">
          <CardHeader title="Status breakdown" subtitle="Solved vs attempted vs unsolved" />
          <DonutChart data={statusData} centerValue={completionPercentage} centerLabel="% Solved" />
        </Card>

        <Card className="p-5">
          <CardHeader
            title="Weekly activity"
            subtitle="Questions solved in the last 7 days"
            action={
              <button
                type="button"
                onClick={() => navigate('/goals')}
                className="text-xs font-semibold text-brand-500 hover:underline"
              >
                Calendar
              </button>
            }
          />
          <ActivityChart series={weekly.data?.series || []} variant="bar" height={240} />
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <CardHeader
            title="Topic-wise progress"
            subtitle="Top topics by question volume"
            action={
              <button
                type="button"
                onClick={() => navigate('/topics')}
                className="text-xs font-semibold text-brand-500 hover:underline"
              >
                All topics
              </button>
            }
          />
          <TopicBarChart data={topics.data?.topics || []} height={300} />
        </Card>

        <Card className="p-5">
          <CardHeader
            title="Monthly activity"
            subtitle="Questions solved over the last 30 days"
          />
          <ActivityChart series={monthly.data?.series || []} variant="area" height={300} />
        </Card>
      </div>

      {/* Weak topics + revisions CTA */}
      {(topics.data?.weakTopics?.length > 0 || revisions.overdue > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {topics.data?.weakTopics?.length > 0 && (
            <Card className="p-5">
              <CardHeader
                title="Weak topics"
                subtitle="3+ questions but less than 50% solved"
                icon={Target}
              />
              <div className="space-y-2.5">
                {topics.data.weakTopics.slice(0, 5).map((weak) => (
                  <div
                    key={weak.topic}
                    className="flex items-center gap-3 rounded-lg bg-surface-2 px-3.5 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{weak.topic}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {weak.solved} of {weak.total} solved
                      </p>
                    </div>
                    <span className="text-sm font-bold text-danger">{weak.completionPercentage}%</span>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => navigate('/topics')}
              >
                Open topic analytics
              </Button>
            </Card>
          )}

          {revisions.overdue > 0 && (
            <Card className="p-5">
              <CardHeader
                title="Overdue revisions"
                subtitle="Spaced repetition only works on time"
                icon={CalendarClock}
              />
              <div className="rounded-lg bg-warning-soft px-4 py-3.5 text-sm text-warning">
                <span className="text-xl font-bold">{revisions.overdue}</span> revision
                {revisions.overdue === 1 ? '' : 's'} past due ·{' '}
                {revisions.pending} upcoming
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Revisiting solved questions at intervals is the fastest way to convert knowledge
                into long-term retention.
              </p>
              <Button
                variant="primary"
                className="mt-4 w-full"
                onClick={() => navigate('/revisions')}
              >
                Open revision planner
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Quick add — mounted fresh per session so the form initialises from props */}
      {quickAddOpen && (
        <ProblemFormModal onClose={() => setQuickAddOpen(false)} onSaved={handleQuickAdd} />
      )}
    </div>
  );
}
