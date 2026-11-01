import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { shortDateFromKey } from '../../utils/formatters';

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '0.6rem',
  color: 'var(--ink)',
  fontSize: 12,
};

/**
 * ActivityChart — daily solved counts.
 * `variant`: 'area' (monthly trend) | 'bar' (weekly bars)
 * `series`: [{ date: 'YYYY-MM-DD', count }]
 */
export default function ActivityChart({ series = [], variant = 'area', height = 240, accent = '#14b8a6' }) {
  const data = series.map((point) => ({
    ...point,
    label: shortDateFromKey(point.date),
  }));

  if (data.length === 0 || data.every((point) => point.count === 0)) {
    const empty = data.length === 0;
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-1.5 text-center">
        <p className="text-sm font-medium text-muted">
          {empty ? 'No activity data yet' : 'No solves in this period'}
        </p>
        <p className="text-xs text-faint">
          {empty ? 'Solve a question to start your chart.' : 'Mark questions as solved to build momentum.'}
        </p>
      </div>
    );
  }

  const common = {
    data,
    margin: { top: 8, right: 8, bottom: 4, left: -18 },
  };

  const axisProps = {
    tick: { fill: 'var(--muted)', fontSize: 10 },
    axisLine: false,
    tickLine: false,
  };

  const showEvery = Math.ceil(data.length / 7);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {variant === 'bar' ? (
          <BarChart {...common}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="label" {...axisProps} interval={showEvery - 1} />
            <YAxis {...axisProps} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'var(--surface-2)', opacity: 0.6 }}
              contentStyle={tooltipStyle}
              labelStyle={{ color: 'var(--muted)' }}
              formatter={(value) => [value, 'Solved']}
            />
            <Bar dataKey="count" fill={accent} radius={[4, 4, 0, 0]} maxBarSize={26} />
          </BarChart>
        ) : (
          <AreaChart {...common}>
            <defs>
              <linearGradient id={`activityFill-${accent.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="label" {...axisProps} interval={showEvery - 1} />
            <YAxis {...axisProps} allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: 'var(--muted)' }}
              formatter={(value) => [value, 'Solved']}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={accent}
              strokeWidth={2.2}
              fill={`url(#activityFill-${accent.replace('#', '')})`}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
