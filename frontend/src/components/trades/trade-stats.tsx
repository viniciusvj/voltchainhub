'use client';

import { Lock, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Mock data ─────────────────────────────────────────────────────────────────
const STATS = [
  {
    label: 'Escrows Ativos',
    value: '2',
    unit: '',
    icon: Lock,
    iconBg: 'bg-[#0066FF]/10',
    iconColor: 'text-[#0066FF]',
    borderAccent: 'border-[#0066FF]/20',
  },
  {
    label: 'Volume 24h',
    value: '45,2',
    unit: 'kWh',
    icon: Activity,
    iconBg: 'bg-[#FFB800]/10',
    iconColor: 'text-[#FFB800]',
    borderAccent: 'border-[#FFB800]/20',
  },
  {
    label: 'Trades Concluídas',
    value: '127',
    unit: '',
    icon: CheckCircle,
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-400',
    borderAccent: 'border-green-500/20',
  },
  {
    label: 'Disputas Abertas',
    value: '0',
    unit: '',
    icon: AlertTriangle,
    iconBg: 'bg-gray-500/10',
    iconColor: 'text-gray-400',
    borderAccent: 'border-gray-500/20',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function TradeStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map(({ label, value, unit, icon: Icon, iconBg, iconColor, borderAccent }) => (
        <div
          key={label}
          className={cn(
            'bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-5 flex flex-col gap-3',
            'hover:border-opacity-80 transition-colors',
            borderAccent
          )}
        >
          {/* Icon */}
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>

          {/* Value */}
          <div>
            <p className="text-2xl font-bold text-white tracking-tight">
              {value}
              {unit && (
                <span className="text-sm font-medium text-gray-400 ml-1">{unit}</span>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
