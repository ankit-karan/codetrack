import { useState } from 'react';
import { Field, Input, Select, Textarea } from '../ui/Input';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import {
  TOPICS,
  DIFFICULTIES,
  STATUSES,
  PLATFORMS,
  PROGRAMMING_LANGUAGES,
} from '../../utils/constants';
import { getApiErrorMessage } from '../../utils/formatters';
import { createProblem, updateProblem } from '../../services/problemService';

const EMPTY = {
  title: '',
  platform: 'LeetCode',
  problemUrl: '',
  topic: 'Arrays',
  difficulty: 'Medium',
  status: 'Unsolved',
  timeComplexity: '',
  spaceComplexity: '',
  programmingLanguage: 'C++',
  notes: '',
};

function validate(values) {
  const errors = {};
  const title = values.title.trim();
  if (title.length < 2) errors.title = 'Title must be at least 2 characters.';
  else if (title.length > 200) errors.title = 'Title cannot exceed 200 characters.';

  if (values.problemUrl.trim() && !/^https?:\/\/\S+$/i.test(values.problemUrl.trim())) {
    errors.problemUrl = 'Enter a valid URL starting with http(s)://';
  }
  if (values.notes.length > 5000) errors.notes = 'Notes cannot exceed 5000 characters.';
  return errors;
}

/** Maps a problem document (or null for create) to the form's value shape. */
function buildValues(problem) {
  if (!problem) return { ...EMPTY };
  return {
    title: problem.title || '',
    platform: problem.platform || 'LeetCode',
    problemUrl: problem.problemUrl || '',
    topic: problem.topic || 'Arrays',
    difficulty: problem.difficulty || 'Medium',
    status: problem.status || 'Unsolved',
    timeComplexity: problem.timeComplexity || '',
    spaceComplexity: problem.spaceComplexity || '',
    programmingLanguage: problem.programmingLanguage || 'C++',
    notes: problem.notes || '',
  };
}

/**
 * ProblemFormModal — create/edit dialog for a DSA question.
 * `problem` = null for create, or the question object for edit.
 * Calls `onSaved(savedProblem)` after a successful API call.
 *
 * Form state is initialised from props on mount — parents must mount this
 * component fresh for each editing session (`{open && <ProblemFormModal …/>}`),
 * which keeps the reset logic out of effects entirely.
 */
export default function ProblemFormModal({ open = true, onClose, problem = null, onSaved = () => {} }) {
  const [values, setValues] = useState(() => buildValues(problem));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [saving, setSaving] = useState(false);

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

    const payload = {
      ...values,
      title: values.title.trim(),
      problemUrl: values.problemUrl.trim(),
      timeComplexity: values.timeComplexity.trim(),
      spaceComplexity: values.spaceComplexity.trim(),
      notes: values.notes.trim(),
    };

    setSaving(true);
    try {
      const saved = problem
        ? await updateProblem(problem._id, payload)
        : await createProblem(payload);
      onSaved(saved);
      onClose();
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Could not save the question.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={problem ? 'Edit question' : 'Add a new question'}
      subtitle={
        problem
          ? 'Update the details of this DSA question.'
          : 'Log a question from any platform into your tracker.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="problem-form" loading={saving}>
            {problem ? 'Save changes' : 'Add question'}
          </Button>
        </>
      }
    >
      <form id="problem-form" onSubmit={handleSubmit} className="space-y-4">
        {serverError && <Alert message={serverError} onDismiss={() => setServerError(null)} />}

        <Field label="Question title" required htmlFor="pf-title" error={errors.title}>
          <Input
            id="pf-title"
            value={values.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="e.g. Longest Substring Without Repeating Characters"
            error={Boolean(errors.title)}
            autoFocus
            maxLength={200}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Platform" htmlFor="pf-platform">
            <Select id="pf-platform" value={values.platform} onChange={(e) => setField('platform', e.target.value)}>
              {PLATFORMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Field>

          <Field label="Topic" required htmlFor="pf-topic" error={errors.topic}>
            <Select id="pf-topic" value={values.topic} onChange={(e) => setField('topic', e.target.value)}>
              {TOPICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>

          <Field label="Difficulty" htmlFor="pf-difficulty">
            <Select
              id="pf-difficulty"
              value={values.difficulty}
              onChange={(e) => setField('difficulty', e.target.value)}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          </Field>

          <Field label="Status" htmlFor="pf-status">
            <Select id="pf-status" value={values.status} onChange={(e) => setField('status', e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>

          <Field label="Language" htmlFor="pf-language">
            <Select
              id="pf-language"
              value={values.programmingLanguage}
              onChange={(e) => setField('programmingLanguage', e.target.value)}
            >
              {PROGRAMMING_LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </Select>
          </Field>

          <Field label="Problem URL" htmlFor="pf-url" error={errors.problemUrl} hint="Optional">
            <Input
              id="pf-url"
              value={values.problemUrl}
              onChange={(e) => setField('problemUrl', e.target.value)}
              placeholder="https://leetcode.com/problems/..."
              error={Boolean(errors.problemUrl)}
            />
          </Field>

          <Field label="Time complexity" htmlFor="pf-time" hint="Optional">
            <Input
              id="pf-time"
              value={values.timeComplexity}
              onChange={(e) => setField('timeComplexity', e.target.value)}
              placeholder="O(n log n)"
              maxLength={60}
            />
          </Field>

          <Field label="Space complexity" htmlFor="pf-space" hint="Optional">
            <Input
              id="pf-space"
              value={values.spaceComplexity}
              onChange={(e) => setField('spaceComplexity', e.target.value)}
              placeholder="O(1)"
              maxLength={60}
            />
          </Field>
        </div>

        <Field label="Solution notes" htmlFor="pf-notes" error={errors.notes} hint="Optional — approach, edge cases, mistakes to avoid.">
          <Textarea
            id="pf-notes"
            value={values.notes}
            onChange={(e) => setField('notes', e.target.value)}
            rows={4}
            placeholder="Approach: two pointers + hash map. Watch out for empty input…"
          />
        </Field>
      </form>
    </Modal>
  );
}
