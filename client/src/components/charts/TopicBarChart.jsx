import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

/**
 * TopicBarChart — horizontal completion bars per topic.
 * `data`: [{ topic, total, solved, completionPercentage }]
 */
export default function TopicBarChart({ data = [], height = 320, limit = 10 }) {
  const rows = data
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((row) => ({
      ...row,
      pending: row.total - row.solved,
      label: row.topic.length > 16 ? `${row.topic.slice(0, 15)}…` : row.topic,
    }));

  if (rows.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-1.5 text-center">
        <p className="text-sm font-medium text-muted">No topic data yet</p>
        <p className="text-xs text-faint">Tag questions with topics to unlock this chart.</p>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={120}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-2)', opacity: 0.6 }}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '0.6rem',
              color: 'var(--ink)',
              fontSize: 12,
            }}
            formatter={(value, name) => [value, name === 'solved' ? 'Solved' : 'Remaining']}
          />
          <Bar dataKey="solved" stackId="a" fill="#14b8a6" radius={[0, 0, 0, 0]} maxBarSize={16} />
          <Bar dataKey="pending" stackId="a" fill="var(--border-strong)" radius={[0, 6, 6, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
