import { useState } from 'react';
import { CalendarClock, CheckCircle2, ListTodo, Trash2, RotateCcw } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useAsync from '../hooks/useAsync';
import { useToast } from '../context/ToastContext';
import { fetchRevisions, updateRevision, deleteRevision } from '../services/revisionService';
import { getApiErrorMessage, formatDate, daysFromToday } from '../utils/formatters';

import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import { LoadingBlock } from '../components/ui/Spinner';
import { DIFFICULTY_STYLES } from '../utils/constants';

const TABS = [
  { id: 'pending', label: 'Due', icon: ListTodo },
  { id: 'overdue', label: 'Overdue', icon: CalendarClock },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
];

/** Human label for a scheduled date: 'today', 'tomorrow', 'in 3d', '2d overdue'.
 *  `daysFromToday` is positive for past dates. */
function relativeLabel(dateInput) {
  const days = daysFromToday(dateInput);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days === -1) return 'tomorrow';
  if (days > 0) return `${days}d overdue`;
  return `in ${Math.abs(days)}d`;
}

/**
 * RevisionsScreen — spaced-repetition planner.
 * Tabs map to the API's `status` filter; counts come from the same response.
 */
export default function RevisionsScreen() {
  useDocumentTitle('Revision planner');
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const [busyId, setBusyId] = useState(null);

  const { data, loading, error, refresh } = useAsync(
    () => fetchRevisions(tab),
    `revisions|${tab}`
  );

  const items = data?.items ?? [];
  const counts = data?.counts ?? { pending: 0, overdue: 0, completed: 0 };

  async function handleComplete(item) {
    setBusyId(item._id);
    try {
      await updateRevision(item._id, { completed: true });
      toast.success('Revision completed — nice recall!');
      refresh();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not complete the revision.'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleSnooze(item) {
    setBusyId(item._id);
    try {
      const revisionDate = new Date(Date.now() + 3 * 86400000).toISOString(); // +3 days
      await updateRevision(item._id, { revisionDate });
      toast.info('Snoozed by 3 days');
      refresh();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not snooze the revision.'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(item) {
    setBusyId(item._id);
    try {
      await deleteRevision(item._id);
      toast.success('Revision removed');
      refresh();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not remove the revision.'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revision planner"
        subtitle="Revisit solved questions at spaced intervals so knowledge sticks."
      />

      {/* Tab switcher */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={active}
              className={[
                'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition',
                active
                  ? 'bg-brand-500 text-[#04211e] shadow-sm shadow-brand-500/20'
                  : 'border border-border text-muted hover:border-border-strong hover:text-ink',
              ].join(' ')}
            >
              <Icon size={15} />
              {label}
              <span
                className={[
                  'rounded-full px-1.5 py-0.5 text-[11px] font-bold',
                  active ? 'bg-black/10' : 'bg-surface-2 text-faint',
                ].join(' ')}
              >
                {counts[id] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <Card>
          <Alert message={error} />
          <div className="mt-4">
            <Button variant="secondary" onClick={refresh}>
              Retry
            </Button>
          </div>
        </Card>
      ) : loading ? (
        <LoadingBlock label="Loading your revisions…" minHeight="min-h-60" />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={tab === 'completed' ? CheckCircle2 : CalendarClock}
            title={tab === 'completed' ? 'No completed revisions yet' : 'Nothing scheduled here'}
            message={
              tab === 'completed'
                ? 'Revisions you mark as done will build your review history.'
                : 'Use the ↻ button on any question in the Questions tab to schedule a revision for tomorrow.'
            }
          />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const problem = item.problemId || {};
              const isCompleted = item.completed;
              const overdue = !isCompleted && daysFromToday(item.revisionDate) > 0;
              const busy = busyId === item._id;

              return (
                <li key={item._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={[
                          'truncate text-sm font-medium',
                          isCompleted ? 'text-muted line-through' : 'text-ink',
                        ].join(' ')}
                      >
                        {problem.title || 'Archived question'}
                      </p>
                      {problem.difficulty && (
                        <Badge className={`${DIFFICULTY_STYLES[problem.difficulty]?.soft || ''} hidden sm:inline-flex`} dot>
                          {problem.difficulty}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span>
                        {isCompleted ? 'Completed' : 'Scheduled'} {formatDate(item.completedAt || item.revisionDate)}
                      </span>
                      {!isCompleted && (
                        <Badge
                          className={
                            overdue ? 'bg-danger-soft text-danger' : 'bg-info-soft text-info'
                          }
                          dot
                        >
                          {relativeLabel(item.revisionDate)}
                        </Badge>
                      )}
                      {item.note && <span className="text-faint">· {item.note}</span>}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {!isCompleted && (
                      <>
                        <Button
                          size="sm"
                          icon={CheckCircle2}
                          loading={busy}
                          onClick={() => handleComplete(item)}
                        >
                          Mark done
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={RotateCcw}
                          disabled={busy}
                          title="Snooze 3 days"
                          onClick={() => handleSnooze(item)}
                        >
                          +3d
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Trash2}
                      disabled={busy}
                      title="Remove revision"
                      onClick={() => handleDelete(item)}
                    >
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <p className="text-xs leading-relaxed text-faint">
        Revisions are personal to your account and only cover questions you have logged. Completing
        one updates your history immediately.
      </p>
    </div>
  );
}
