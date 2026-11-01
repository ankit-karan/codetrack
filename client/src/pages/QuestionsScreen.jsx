import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, ClipboardList, SearchX } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useAsync from '../hooks/useAsync';
import useDebounce from '../hooks/useDebounce';
import { useToast } from '../context/ToastContext';
import {
  fetchProblems,
  updateProblemStatus,
  deleteProblem,
} from '../services/problemService';
import { createRevision } from '../services/revisionService';
import { getApiErrorMessage } from '../utils/formatters';

import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import { LoadingBlock } from '../components/ui/Spinner';
import Pagination from '../components/ui/Pagination';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ProblemFilters from '../components/problems/ProblemFilters';
import ProblemTable from '../components/problems/ProblemTable';
import ProblemFormModal from '../components/problems/ProblemFormModal';
import ProblemDetailsModal from '../components/problems/ProblemDetailsModal';

const PAGE_SIZE = 10;

const EMPTY_FILTERS = {
  topic: '',
  difficulty: '',
  status: '',
  platform: '',
  sort: 'newest',
};

/**
 * QuestionsScreen — CRUD manager for DSA questions.
 *
 * Deep links supported on mount: `/questions?topic=Graphs` pre-filters by
 * topic (used by the topic analytics cards) and `/questions?new=1` opens the
 * add dialog. Both are read once through useState initialisers, so no
 * state-in-effect sync is needed — the screen mounts fresh per navigation.
 *
 * All filter/page/search changes reset to page 1 inside their event
 * handlers; fetching is delegated to useAsync via its key.
 */
export default function QuestionsScreen() {
  useDocumentTitle('Questions');
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    topic: searchParams.get('topic') || '',
  }));
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(() => searchParams.get('new') === '1');
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, refresh } = useAsync(
    () => fetchProblems({ page, limit: PAGE_SIZE, search: debouncedSearch, ...filters }),
    [
      page,
      debouncedSearch,
      filters.topic,
      filters.difficulty,
      filters.status,
      filters.platform,
      filters.sort,
    ].join('|')
  );

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  const activeCount =
    [filters.topic, filters.difficulty, filters.status, filters.platform].filter(Boolean).length +
    (filters.sort !== 'newest' ? 1 : 0);

  /* ----------------------------- event handlers ---------------------------- */

  function handleFilterChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  }

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS);
    setSearch('');
    setPage(1);
  }

  function handleAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function handleEdit(problem) {
    setEditing(problem);
    setFormOpen(true);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditing(null);
  }

  function handleSaved(saved) {
    toast.success(editing ? `“${saved.title}” updated` : `“${saved.title}” added to your tracker`);
    refresh();
  }

  async function handleStatusChange(problem, status) {
    try {
      await updateProblemStatus(problem._id, status);
      toast.success(`Marked ${status.toLowerCase()}`);
      refresh();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update the status.'));
    }
  }

  async function handleRevise(problem) {
    try {
      const revisionDate = new Date(Date.now() + 86400000).toISOString(); // tomorrow
      await createRevision({ problemId: problem._id, revisionDate });
      toast.success('Revision scheduled for tomorrow');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not schedule the revision.'));
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteProblem(deleting._id);
      toast.success('Question deleted');
      setDeleting(null);
      setViewing((current) => (current?._id === deleting._id ? null : current));
      refresh();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not delete the question.'));
    } finally {
      setBusy(false);
    }
  }

  /* -------------------------------- rendering ------------------------------ */

  return (
    <div className="space-y-6">
      <PageHeader
        title="Questions"
        subtitle={
          pagination
            ? `${pagination.total} question${pagination.total === 1 ? '' : 's'} in your tracker`
            : 'Add, review and organise your DSA practice.'
        }
        actions={
          <Button icon={Plus} onClick={handleAdd}>
            Add question
          </Button>
        }
      />

      <Card>
        <ProblemFilters
          search={search}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          activeCount={activeCount}
        />

        {error ? (
          <div className="p-5">
            <Alert message={error} />
            <div className="mt-4">
              <Button variant="secondary" onClick={refresh}>
                Retry
              </Button>
            </div>
          </div>
        ) : loading ? (
          <LoadingBlock label="Loading your questions…" minHeight="min-h-60" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={activeCount > 0 || search ? SearchX : ClipboardList}
            title={activeCount > 0 || search ? 'No matching questions' : 'No questions yet'}
            message={
              activeCount > 0 || search
                ? 'Try adjusting the filters or clearing your search.'
                : 'Log your first DSA question to start tracking progress, topics and streaks.'
            }
            action={
              activeCount > 0 || search ? (
                <Button variant="secondary" onClick={handleReset}>
                  Clear filters
                </Button>
              ) : (
                <Button icon={Plus} onClick={handleAdd}>
                  Add your first question
                </Button>
              )
            }
          />
        ) : (
          <>
            <ProblemTable
              items={items}
              onView={setViewing}
              onEdit={handleEdit}
              onDelete={setDeleting}
              onStatusChange={handleStatusChange}
              onRevise={handleRevise}
            />
            <Pagination pagination={pagination} onPageChange={setPage} disabled={loading} />
          </>
        )}
      </Card>

      {formOpen && (
        <ProblemFormModal
          open
          problem={editing}
          onClose={handleFormClose}
          onSaved={handleSaved}
        />
      )}

      {viewing && (
        <ProblemDetailsModal
          open
          problem={viewing}
          onClose={() => setViewing(null)}
          onEdit={handleEdit}
        />
      )}

      {deleting && (
        <ConfirmDialog
          open
          title="Delete this question?"
          message={`“${deleting.title}” and its scheduled revisions will be permanently removed.`}
          confirmLabel="Delete"
          loading={busy}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
