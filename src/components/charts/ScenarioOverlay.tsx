'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { YearlyProjection } from '@/types/finance';
import { formatCurrency } from '@/lib/formatters';

interface ScenarioOverlayProps {
  baseline: YearlyProjection[];
  scenario: YearlyProjection[];
  scenarioName: string;
}

export default function ScenarioOverlay({ baseline, scenario, scenarioName }: ScenarioOverlayProps) {
  const data = baseline.map((b, i) => ({
    year: b.year,
    age: b.age,
    baseline: b.netWealth,
    scenario: scenario[i]?.netWealth ?? 0,
    diff: (scenario[i]?.netWealth ?? 0) - b.netWealth,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `£${(v / 1000000).toFixed(1)}M`}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: number, name: string) => [formatCurrency(value), name]) as any}
          labelFormatter={(label) => {
            const item = data.find((d) => d.year === label);
            return item ? `${item.year} (Age ${item.age})` : String(label);
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="baseline"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={false}
          name="Base Case"
        />
        <Line
          type="monotone"
          dataKey="scenario"
          stroke="#f97316"
          strokeWidth={2}
          dot={false}
          name={scenarioName}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
