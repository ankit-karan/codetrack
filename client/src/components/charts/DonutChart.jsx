import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = {
  Easy: '#22c55e',
  Medium: '#f59e0b',
  Hard: '#ef4444',
  Solved: '#14b8a6',
  Attempted: '#f59e0b',
  Unsolved: '#64748b',
};

/**
 * DonutChart — difficulty/status distribution with a centre total.
 * Renders an empty placeholder when there is no data yet.
 */
export default function DonutChart({ data = [], centerLabel = 'Total', centerValue = 0, height = 240 }) {
  const total = data.reduce((sum, entry) => sum + (entry.value || 0), 0);

  if (total === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-1.5 text-center"
        style={{ height }}
      >
        <div className="h-24 w-24 rounded-full border-[10px] border-surface-2" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-muted">No data yet</p>
        <p className="text-xs text-faint">Add questions to see your distribution.</p>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="68%"
            outerRadius="92%"
            paddingAngle={3}
            cornerRadius={6}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] || entry.color || '#14b8a6'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '0.6rem',
              color: 'var(--ink)',
              fontSize: 12,
            }}
            formatter={(value, name) => [`${value} question${value === 1 ? '' : 's'}`, name]}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 500 }}>{value}</span>
            )}
          />
          <text
            x="50%"
            y="46%"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fill: 'var(--ink)', fontSize: 26, fontWeight: 700 }}
          >
            {centerValue}
          </text>
          <text
            x="50%"
            y="58%"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fill: 'var(--muted)', fontSize: 11, fontWeight: 500 }}
          >
            {centerLabel}
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
