import { ExternalLink, Clock, MemoryStick, CalendarDays, Languages, Globe } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { DIFFICULTY_STYLES, STATUS_STYLES, PLATFORM_STYLES } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/formatters';

/**
 * ProblemDetailsModal — read-only full view of one question
 * (notes, complexities, dates, link).
 */
export default function ProblemDetailsModal({ open, onClose, problem, onEdit = () => {} }) {
  if (!problem) return null;

  const rows = [
    { icon: Globe, label: 'Platform', value: problem.platform },
    { icon: Languages, label: 'Language', value: problem.programmingLanguage },
    { icon: Clock, label: 'Time complexity', value: problem.timeComplexity || '—' },
    { icon: MemoryStick, label: 'Space complexity', value: problem.spaceComplexity || '—' },
    { icon: CalendarDays, label: 'Added', value: formatDateTime(problem.createdAt) },
    { icon: CalendarDays, label: 'Solved', value: problem.solvedAt ? formatDateTime(problem.solvedAt) : 'Not solved yet' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={problem.title}
      subtitle={`Added ${formatDate(problem.createdAt)}`}
      size="md"
      footer={
        <>
          {problem.problemUrl && (
            <a href={problem.problemUrl} target="_blank" rel="noreferrer noopener">
              <Button variant="secondary" icon={ExternalLink}>
                Open problem
              </Button>
            </a>
          )}
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              onEdit(problem);
            }}
          >
            Edit question
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={DIFFICULTY_STYLES[problem.difficulty]?.soft} dot>
            {problem.difficulty}
          </Badge>
          <Badge className={STATUS_STYLES[problem.status]?.soft} dot>
            {problem.status}
          </Badge>
          <Badge className={PLATFORM_STYLES[problem.platform] || PLATFORM_STYLES.Other}>
            {problem.platform}
          </Badge>
          <Badge className="bg-surface-2 text-muted">{problem.topic}</Badge>
        </div>

        {/* Fact grid */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2.5 rounded-lg bg-surface-2 px-3.5 py-2.5">
              <Icon size={15} className="shrink-0 text-faint" />
              <span className="text-xs text-muted">{label}</span>
              <span className="ml-auto truncate text-xs font-semibold text-ink" title={String(value)}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Solution notes</h4>
          {problem.notes ? (
            <div className="whitespace-pre-wrap rounded-lg border border-border bg-surface-2 p-4 text-sm leading-relaxed text-ink">
              {problem.notes}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-faint">
              No notes yet — add your approach, edge cases and mistakes while they are fresh.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
