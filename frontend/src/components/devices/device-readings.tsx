'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Activity, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Mock data helpers ─────────────────────────────────────────────────────────

/** Generate 60 mock power readings (one per minute) for the past hour. */
function generateReadings(baseKw: number, variance: number) {
  const now = Date.now();
  return Array.from({ length: 60 }, (_, i) => {
    const ts = new Date(now - (59 - i) * 60_000);
    const hour = ts.getHours();
    const minute = ts.getMinutes();
    // Simple sinusoidal shape to mimic solar production
    const solarFactor = Math.max(0, Math.sin(((hour * 60 + minute) / 720) * Math.PI));
    const noise = (Math.random() - 0.5) * variance;
    return {
      time:  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      power: Math.max(0, parseFloat((baseKw * solarFactor + noise).toFixed(2))),
    };
  });
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

interface TooltipPayload {
  value: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-volt-dark-700 border border-volt-dark-600 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-400 mb-0.5">{label}</p>
      <p className="text-[#0066FF] font-bold">{payload[0].value} kW</p>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex-1 bg-volt-dark-700 border border-volt-dark-600 rounded-lg p-3 flex items-center gap-3">
      <Icon className={cn('w-4 h-4 flex-shrink-0', color)} />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={cn('text-sm font-bold', color)}>{value}</p>
      </div>
    </div>
  );
}

// ── DeviceReadings ────────────────────────────────────────────────────────────

export function DeviceReadings({ deviceName = 'Nó Solar Principal' }: { deviceName?: string }) {
  const data = useMemo(() => generateReadings(4.5, 0.8), []);

  const values  = data.map((d) => d.power);
  const peak    = Math.max(...values).toFixed(2);
  const average = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
  const minimum = Math.min(...values).toFixed(2);

  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-200">Leituras em Tempo Real</h2>
          <p className="text-xs text-gray-500 mt-0.5">{deviceName} — última hora</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Ao vivo
        </span>
      </div>

      {/* Chart */}
      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#222230"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#222230' }}
              interval={9}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="power"
              stroke="#0066FF"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#0066FF', stroke: '#12121A', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <StatPill
          label="Pico"
          value={`${peak} kW`}
          icon={TrendingUp}
          color="text-green-400"
        />
        <StatPill
          label="Média"
          value={`${average} kW`}
          icon={Activity}
          color="text-[#0066FF]"
        />
        <StatPill
          label="Mínimo"
          value={`${minimum} kW`}
          icon={TrendingDown}
          color="text-[#FFB800]"
        />
      </div>
    </div>
  );
}
