'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Mock data ─────────────────────────────────────────────────────────────────

const PORTFOLIO_DATA = [
  { name: 'Solar',   kWh: 98.3,  percentage: 68, color: '#0066FF' },
  { name: 'Bateria', kWh: 32.1,  percentage: 22, color: '#FFB800' },
  { name: 'Eólico',  kWh: 12.1,  percentage: 10, color: '#00CC66' },
];

const TOTAL_KWH   = PORTFOLIO_DATA.reduce((s, d) => s + d.kWh, 0);
const TOTAL_BRL   = 14.25;
const CHANGE_PCT  = 23.4;
const CHANGE_POS  = true;

// ── Custom tooltip ─────────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  name: string;
  value: number;
  payload: { percentage: number; color: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-volt-dark-700 border border-volt-dark-600 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-white mb-0.5">{item.name}</p>
      <p className="text-gray-300">
        {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kWh
      </p>
      <p style={{ color: item.payload.color }}>{item.payload.percentage}%</p>
    </div>
  );
}

// ── Legend dots ───────────────────────────────────────────────────────────────

function ChartLegend() {
  return (
    <div className="flex flex-col gap-2 w-full">
      {PORTFOLIO_DATA.map((item) => (
        <div key={item.name} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-300">{item.name}</span>
          </div>
          <div className="flex items-center gap-2 text-right">
            <span className="text-sm font-medium text-white">
              {item.kWh.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kWh
            </span>
            <span
              className="text-xs font-medium w-9 text-right"
              style={{ color: item.color }}
            >
              {item.percentage}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PortfolioSummary() {
  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-solar" />
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Portfólio de Tokens
        </h2>
      </div>

      {/* Total summary */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-white tracking-tight">
            {TOTAL_KWH.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
            <span className="text-lg font-medium text-gray-400 ml-1">kWh</span>
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            ≈ R${' '}
            {TOTAL_BRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* 30-day change */}
        <div
          className={cn(
            'flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full',
            CHANGE_POS
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          )}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          {CHANGE_POS ? '+' : ''}
          {CHANGE_PCT.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%
          <span className="text-xs font-normal text-gray-400 ml-0.5">30d</span>
        </div>
      </div>

      {/* Pie chart */}
      <div className="w-full h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={PORTFOLIO_DATA}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={78}
              paddingAngle={3}
              dataKey="kWh"
              stroke="none"
            >
              {PORTFOLIO_DATA.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Divider */}
      <div className="border-t border-volt-dark-600" />

      {/* Legend */}
      <ChartLegend />
    </div>
  );
}
