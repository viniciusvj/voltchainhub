'use client';

import { Cpu, CheckCircle2, Zap, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StatItem {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  accent?: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const STATS: StatItem[] = [
  {
    label: 'Total Dispositivos',
    value: '3',
    icon: Cpu,
    iconColor: 'text-[#0066FF]',
    iconBg: 'bg-[#0066FF]/10',
    accent: 'border-[#0066FF]/20',
  },
  {
    label: 'Dispositivos Ativos',
    value: '3/3',
    sub: '100% online',
    icon: CheckCircle2,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-400/10',
    accent: 'border-green-400/20',
  },
  {
    label: 'Energia Total Hoje',
    value: '47,3 kWh',
    sub: '+12% vs. ontem',
    icon: BarChart3,
    iconColor: 'text-[#FFB800]',
    iconBg: 'bg-[#FFB800]/10',
    accent: 'border-[#FFB800]/20',
  },
  {
    label: 'Potência Atual',
    value: '4,8 kW',
    sub: 'geração líquida',
    icon: Zap,
    iconColor: 'text-[#0066FF]',
    iconBg: 'bg-[#0066FF]/10',
    accent: 'border-[#0066FF]/20',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function DeviceStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={cn(
              'bg-volt-dark-800 border rounded-xl p-4 flex items-start gap-4',
              'border-volt-dark-600',
              stat.accent && `hover:${stat.accent} transition-colors`
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                stat.iconBg
              )}
            >
              <Icon className={cn('w-5 h-5', stat.iconColor)} />
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{stat.label}</p>
              <p className="text-xl font-bold text-white leading-tight mt-0.5">
                {stat.value}
              </p>
              {stat.sub && (
                <p className="text-xs text-gray-500 mt-0.5">{stat.sub}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
