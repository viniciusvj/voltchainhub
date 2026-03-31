'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type Period = '1H' | '6H' | '24H' | '7D';

interface DataPoint {
  time: string;
  price: number;
}

// ── Mock data generators ──────────────────────────────────────────────────────

function generatePoints(count: number, labelFn: (i: number) => string): DataPoint[] {
  const base = 0.095;
  let price = base + Math.random() * 0.02;
  return Array.from({ length: count }, (_, i) => {
    const drift = (Math.random() - 0.485) * 0.008;
    price = Math.min(0.15, Math.max(0.06, price + drift));
    return { time: labelFn(i), price: Math.round(price * 10000) / 10000 };
  });
}

const DATA: Record<Period, DataPoint[]> = {
  '1H':  generatePoints(13, (i) => `${i * 5}m`),
  '6H':  generatePoints(13, (i) => `${i * 30}m`),
  '24H': generatePoints(25, (i) => `${String(i).padStart(2, '0')}h`),
  '7D':  generatePoints(8,  (i) => ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb','Dom'][i]),
};

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-volt-dark-700 border border-volt-dark-600 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-[#0066FF] font-mono font-semibold">
        R$ {Number(payload[0].value).toFixed(4)}/kWh
      </p>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PriceChart() {
  const [period, setPeriod] = useState<Period>('24H');

  const data = DATA[period];

  const stats = useMemo(() => {
    const prices = data.map((d) => d.price);
    return {
      current: prices[prices.length - 1],
      high:    Math.max(...prices),
      low:     Math.min(...prices),
      avg:     prices.reduce((a, b) => a + b, 0) / prices.length,
    };
  }, [data]);

  const change = stats.current - data[0].price;
  const changePct = ((change / data[0].price) * 100).toFixed(2);
  const isUp = change >= 0;

  const periods: Period[] = ['1H', '6H', '24H', '7D'];

  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-1">Preço P2P de Energia</h2>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold font-mono text-white">
              R$ {stats.current.toFixed(4)}
            </span>
            <span className="text-xs font-medium text-gray-400">/kWh</span>
            <span
              className={cn(
                'text-sm font-semibold',
                isUp ? 'text-green-400' : 'text-red-400',
              )}
            >
              {isUp ? '+' : ''}{changePct}%
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-5 text-xs">
          <div>
            <p className="text-gray-500 mb-0.5">Máxima</p>
            <p className="font-mono text-green-400">R$ {stats.high.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-0.5">Mínima</p>
            <p className="font-mono text-red-400">R$ {stats.low.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-0.5">Média</p>
            <p className="font-mono text-gray-300">R$ {stats.avg.toFixed(4)}</p>
          </div>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 mb-4">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-semibold transition-colors',
              period === p
                ? 'bg-[#0066FF] text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-volt-dark-700',
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222230" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `R$${Number(v).toFixed(3)}`}
              width={72}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={stats.current}
              stroke="#0066FF"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#0066FF"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#0066FF', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
