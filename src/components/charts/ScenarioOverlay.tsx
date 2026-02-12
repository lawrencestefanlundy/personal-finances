'use client';

import { YearlyProjection } from '@/types/finance';
import { formatCurrency } from '@/lib/formatters';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface ScenarioOverlayProps {
  baseline: YearlyProjection[];
  scenario: YearlyProjection[];
  scenarioName: string;
}

export default function ScenarioOverlay({
  baseline,
  scenario,
  scenarioName,
}: ScenarioOverlayProps) {
  const data = baseline.map((b, i) => ({
    year: b.year,
    age: b.age,
    baseline: b.netWealth,
    scenario: scenario[i]?.netWealth ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 12 }} width={90} />
        <Tooltip
          formatter={(value, name) => [
            formatCurrency(Number(value)),
            String(name) === 'baseline' ? 'Base Case' : scenarioName,
          ]}
          labelFormatter={(label) => {
            const row = data.find((d) => d.year === label);
            return row ? `${label} (age ${row.age})` : label;
          }}
        />
        <Legend
          formatter={(value: string) => (value === 'baseline' ? 'Base Case' : scenarioName)}
        />
        <Area
          type="monotone"
          dataKey="baseline"
          stroke="#8b5cf6"
          fill="#8b5cf6"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="scenario"
          stroke="#f59e0b"
          fill="#f59e0b"
          fillOpacity={0.15}
          strokeWidth={2}
          strokeDasharray="5 5"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
