import { useNavigate } from 'react-router-dom';
import { Target, TrendingUp, Award, AlertTriangle } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useAsync from '../hooks/useAsync';
import { fetchTopicAnalytics, fetchDifficultyAnalytics } from '../services/analyticsService';

import PageHeader from '../components/ui/PageHeader';
import Card, { CardHeader } from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { LoadingBlock } from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import DonutChart from '../components/charts/DonutChart';
import { DIFFICULTY_STYLES } from '../utils/constants';

/**
 * TopicsScreen — per-topic mastery analytics + weak-topic detection.
 */
export default function TopicsScreen() {
  useDocumentTitle('Topic analytics');
  const navigate = useNavigate();

  const topicsQuery = useAsync(fetchTopicAnalytics, []);
  const difficultyQuery = useAsync(fetchDifficultyAnalytics, []);

  if (topicsQuery.loading || difficultyQuery.loading) {
    return (
      <>
        <PageHeader title="Topic analytics" />
        <LoadingBlock label="Analysing your topics…" minHeight="min-h-72" />
      </>
    );
  }

  if (topicsQuery.error) {
    return (
      <>
        <PageHeader title="Topic analytics" />
        <Alert message={topicsQuery.error} />
        <div className="mt-4">
          <Button variant="secondary" onClick={topicsQuery.refresh}>
            Retry
          </Button>
        </div>
      </>
    );
  }

  const { topics = [], weakTopics = [], aggregate = {} } = topicsQuery.data || {};
  const started = topics.filter((topic) => topic.total > 0);
  const untouched = topics.filter((topic) => topic.total === 0);

  const difficultySummary = difficultyQuery.data?.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Topic analytics"
        subtitle="Mastery, difficulty mix and weak areas across all 18 DSA topics."
        actions={
          <Button variant="secondary" icon={Target} onClick={() => navigate('/questions')}>
            Manage questions
          </Button>
        }
      />

      {started.length === 0 ? (
        <Card>
          <EmptyState
            icon={Target}
            title="No topic data yet"
            message="Once you add questions with topics, this page will show per-topic completion rates, difficulty breakdowns and weak-topic detection."
            action={
              <Button icon={Target} onClick={() => navigate('/questions?new=1')}>
                Add your first question
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              label="Topics started"
              value={`${aggregate.topicsStarted ?? 0}/18`}
              icon={Target}
              tone="brand"
            />
            <StatCard
              label="Topics mastered"
              value={aggregate.topicsCompleted ?? 0}
              sublabel="100% solved"
              icon={Award}
              tone="success"
            />
            <StatCard
              label="Total solved"
              value={aggregate.totalSolved ?? 0}
              sublabel={`of ${aggregate.totalQuestions ?? 0} questions`}
              icon={TrendingUp}
              tone="info"
            />
            <StatCard
              label="Weak topics"
              value={weakTopics.length}
              sublabel="below 50% solved"
              icon={AlertTriangle}
              tone={weakTopics.length > 0 ? 'danger' : 'success'}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Difficulty completion */}
            <Card className="p-5">
              <CardHeader title="Completion by difficulty" subtitle="Solved ratio per level" />
              <div className="space-y-4">
                {['Easy', 'Medium', 'Hard'].map((level) => {
                  const stats = difficultyQuery.data?.data?.[level];
                  return (
                    <div key={level}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-ink">{level}</span>
                        <span className="text-muted">
                          {stats ? `${stats.solved}/${stats.total} solved` : '—'}
                        </span>
                      </div>
                      <ProgressBar
                        value={stats?.solved ?? 0}
                        max={stats?.total ?? 1}
                        tone={level === 'Easy' ? 'success' : level === 'Medium' ? 'warning' : 'danger'}
                        size="md"
                      />
                      <p className="mt-1 text-right text-[11px] font-semibold text-faint">
                        {stats ? `${stats.completionPercentage}%` : '0%'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Difficulty donut */}
            <Card className="p-5">
              <CardHeader title="Overall difficulty mix" subtitle="Distribution of your questions" />
              <DonutChart
                data={['Easy', 'Medium', 'Hard'].map((level) => ({
                  name: level,
                  value: difficultyQuery.data?.data?.[level]?.total ?? 0,
                }))}
                centerValue={difficultySummary?.total ?? 0}
                centerLabel="Questions"
                height={260}
              />
            </Card>

            {/* Weak topics */}
            <Card className="p-5">
              <CardHeader
                title="Weak topics"
                subtitle="3+ questions with < 50% solved"
                icon={AlertTriangle}
              />
              {weakTopics.length === 0 ? (
                <div className="rounded-lg bg-success-soft px-4 py-5 text-center">
                  <p className="text-sm font-semibold text-success">No weak topics detected 🎉</p>
                  <p className="mt-1 text-xs text-muted">
                    Topics with at least 3 questions are all above the 50% threshold — keep going.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {weakTopics.map((weak) => (
                    <div key={weak.topic} className="rounded-lg bg-surface-2 px-3.5 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-ink">{weak.topic}</p>
                        <Badge className="bg-danger-soft text-danger" dot>
                          {weak.completionPercentage}%
                        </Badge>
                      </div>
                      <ProgressBar
                        className="mt-2"
                        value={weak.solved}
                        max={weak.total}
                        tone="danger"
                        size="sm"
                      />
                      <p className="mt-1.5 text-[11px] text-muted">
                        {weak.solved} solved · {weak.total - weak.solved} remaining
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Topic grid */}
          <Card className="p-5">
            <CardHeader
              title="All topics"
              subtitle="Every supported DSA topic — click to filter your questions"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {topics.map((topic) => (
                <button
                  key={topic.topic}
                  type="button"
                  disabled={topic.total === 0}
                  onClick={() =>
                    navigate(`/questions?topic=${encodeURIComponent(topic.topic)}`)
                  }
                  className={[
                    'rounded-xl border p-4 text-left transition-all duration-200',
                    topic.total === 0
                      ? 'cursor-default border-border bg-surface-2/50 opacity-60'
                      : 'border-border bg-surface hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-md',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{topic.topic}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {topic.solved}/{topic.total} solved
                      </p>
                    </div>
                    <span
                      className={[
                        'shrink-0 rounded-lg px-2 py-1 text-xs font-bold',
                        topic.completionPercentage === 100
                          ? 'bg-success-soft text-success'
                          : topic.completionPercentage >= 50
                            ? 'bg-warning-soft text-warning'
                            : 'bg-danger-soft text-danger',
                      ].join(' ')}
                    >
                      {topic.completionPercentage}%
                    </span>
                  </div>

                  <ProgressBar
                    className="mt-3"
                    value={topic.solved}
                    max={topic.total}
                    tone={
                      topic.completionPercentage === 100
                        ? 'success'
                        : topic.completionPercentage >= 50
                          ? 'warning'
                          : 'danger'
                    }
                    size="sm"
                  />

                  {topic.total > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5">
                      {['Easy', 'Medium', 'Hard'].map(
                        (level) =>
                          topic.difficulty[level] > 0 && (
                            <span
                              key={level}
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${DIFFICULTY_STYLES[level]?.soft}`}
                            >
                              {level} {topic.difficulty[level]}
                            </span>
                          )
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {untouched.length > 0 && (
              <p className="mt-4 text-center text-xs text-faint">
                {untouched.length} topic{untouched.length === 1 ? '' : 's'} not started yet —
                questions you add with those tags will appear here.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
