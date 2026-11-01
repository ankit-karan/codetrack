import { ExternalLink, Pencil, Trash2, Eye, RotateCcw } from 'lucide-react';
import Badge from '../ui/Badge';
import {
  DIFFICULTY_STYLES,
  STATUS_STYLES,
  PLATFORM_STYLES,
} from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

/**
 * ProblemTable — desktop table + mobile card layout for questions.
 * Emits: onView, onEdit, onDelete, onStatusChange, onRevise
 */
export default function ProblemTable({
  items = [],
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onRevise,
}) {
  if (items.length === 0) return null;

  return (
    <>
      {/* ---------------------------- Desktop table ---------------------------- */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-faint">
              <th className="px-5 py-3 font-semibold">Question</th>
              <th className="px-3 py-3 font-semibold">Topic</th>
              <th className="px-3 py-3 font-semibold">Difficulty</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Language</th>
              <th className="px-3 py-3 font-semibold">Added</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((problem) => (
              <tr key={problem._id} className="group transition-colors hover:bg-surface-2/60">
                <td className="max-w-72 px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-ink" title={problem.title}>
                      {problem.title}
                    </p>
                    {problem.problemUrl && (
                      <a
                        href={problem.problemUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        title="Open original problem"
                        className="text-faint transition hover:text-brand-500"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                  <Badge className={`mt-1 ${PLATFORM_STYLES[problem.platform] || PLATFORM_STYLES.Other}`}>
                    {problem.platform}
                  </Badge>
                </td>
                <td className="px-3 py-3.5 text-muted">{problem.topic}</td>
                <td className="px-3 py-3.5">
                  <Badge className={DIFFICULTY_STYLES[problem.difficulty]?.soft} dot>
                    {problem.difficulty}
                  </Badge>
                </td>
                <td className="px-3 py-3.5">
                  <StatusSelect value={problem.status} onChange={(s) => onStatusChange(problem, s)} />
                </td>
                <td className="px-3 py-3.5 text-muted">{problem.programmingLanguage}</td>
                <td className="whitespace-nowrap px-3 py-3.5 text-xs text-faint">
                  {formatDate(problem.createdAt)}
                  {problem.solvedAt && (
                    <span className="mt-0.5 block text-[10px] text-success">
                      solved {formatDate(problem.solvedAt)}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1 opacity-70 transition group-hover:opacity-100">
                    <IconButton title="View details" icon={Eye} onClick={() => onView(problem)} />
                    <IconButton title="Schedule revision" icon={RotateCcw} onClick={() => onRevise(problem)} />
                    <IconButton title="Edit" icon={Pencil} onClick={() => onEdit(problem)} />
                    <IconButton title="Delete" icon={Trash2} tone="danger" onClick={() => onDelete(problem)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ----------------------------- Mobile cards ---------------------------- */}
      <div className="divide-y divide-border lg:hidden">
        {items.map((problem) => (
          <article key={problem._id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-medium text-ink">{problem.title}</p>
                  {problem.problemUrl && (
                    <a
                      href={problem.problemUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="shrink-0 text-faint"
                      aria-label="Open problem"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge className={DIFFICULTY_STYLES[problem.difficulty]?.soft} dot>
                    {problem.difficulty}
                  </Badge>
                  <Badge className={PLATFORM_STYLES[problem.platform] || PLATFORM_STYLES.Other}>
                    {problem.platform}
                  </Badge>
                  <span className="text-xs text-muted">{problem.topic}</span>
                </div>
              </div>
              <span className="shrink-0 text-[11px] text-faint">{formatDate(problem.createdAt)}</span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <StatusSelect value={problem.status} onChange={(s) => onStatusChange(problem, s)} />
              <div className="flex items-center gap-1">
                <IconButton title="View" icon={Eye} onClick={() => onView(problem)} />
                <IconButton title="Revise" icon={RotateCcw} onClick={() => onRevise(problem)} />
                <IconButton title="Edit" icon={Pencil} onClick={() => onEdit(problem)} />
                <IconButton title="Delete" icon={Trash2} tone="danger" onClick={() => onDelete(problem)} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

/** Compact status dropdown that triggers an immediate status update. */
function StatusSelect({ value, onChange }) {
  const style = STATUS_STYLES[value] || STATUS_STYLES.Unsolved;
  return (
    <label className="inline-flex cursor-pointer items-center">
      <span className="sr-only">Change status</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`cursor-pointer appearance-none rounded-full border border-transparent px-3 py-1 text-[11px] font-semibold outline-none transition hover:border-current ${style.soft}`}
      >
        <option value="Solved">✓ Solved</option>
        <option value="Attempted">◐ Attempted</option>
        <option value="Unsolved">○ Unsolved</option>
      </select>
    </label>
  );
}

function IconButton({ title, icon: Icon, onClick, tone = 'default' }) {
  const tones = {
    default: 'text-faint hover:text-brand-500 hover:bg-brand-soft',
    danger: 'text-faint hover:text-danger hover:bg-danger-soft',
  };
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`rounded-lg p-2 transition ${tones[tone]}`}
    >
      <Icon size={15} />
    </button>
  );
}
