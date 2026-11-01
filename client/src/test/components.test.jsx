import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProgressBar from '../components/ui/ProgressBar';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import { ListChecks } from 'lucide-react';

describe('ProgressBar', () => {
  it('renders the clamped percentage', () => {
    render(<ProgressBar value={3} max={5} showLabel label="Daily" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('never exceeds 100% when the value overshoots', () => {
    render(<ProgressBar value={12} max={5} showLabel />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows 0% with no data', () => {
    render(<ProgressBar value={0} max={0} showLabel />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});

describe('StatCard', () => {
  it('renders the label and value', () => {
    render(<StatCard label="Total" value={42} icon={ListChecks} />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders the sublabel when provided', () => {
    render(<StatCard label="Solved" value={10} sublabel="60% complete" />);
    expect(screen.getByText('60% complete')).toBeInTheDocument();
  });
});

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>Easy</Badge>);
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });
});

describe('interaction sanity (userEvent)', () => {
  it('fires click handlers', async () => {
    let clicked = false;
    render(
      <button type="button" onClick={() => (clicked = true)}>
        Press
      </button>
    );
    await userEvent.click(screen.getByText('Press'));
    expect(clicked).toBe(true);
  });
});
