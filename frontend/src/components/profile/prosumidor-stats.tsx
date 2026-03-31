'use client';

import { Star, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Mock data ─────────────────────────────────────────────────────────────────

const STATS = {
  memberSince:         'Mar 2026',
  totalGenerated:      1247.3,   // kWh
  totalSold:           892.1,    // kWh
  totalBought:         234.5,    // kWh
  totalRevenue:        89.21,    // BRL
  totalSavings:        211.05,   // BRL
  completedTrades:     127,
  reputation:          4.8,      // out of 5
  registeredDevices:   3,
  averageUptime:       99.2,     // %
};

// ── Star rating ───────────────────────────────────────────────────────────────

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} de ${max} estrelas`}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(value);
        const partial = !filled && i < value;
        return (
          <Star
            key={i}
            className={cn(
              'w-4 h-4',
              filled
                ? 'text-solar fill-solar'
                : partial
                ? 'text-solar fill-solar/40'
                : 'text-gray-600'
            )}
          />
        );
      })}
      <span className="text-sm font-semibold text-white ml-1">
        {value.toFixed(1)}/5.0
      </span>
    </div>
  );
}

// ── Stat item ─────────────────────────────────────────────────────────────────

interface StatItemProps {
  label: string;
  children: React.ReactNode;
  accent?: string; // tailwind text color class for the value
}

function StatItem({ label, children, accent = 'text-white' }: StatItemProps) {
  return (
    <div className="flex flex-col gap-1 p-4 bg-volt-dark-700 rounded-xl">
      <span className="text-xs text-gray-400 font-medium leading-tight">{label}</span>
      <div className={cn('text-base font-bold leading-tight', accent)}>{children}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ProsumidorStats() {
  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-electric" />
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Estatísticas de Prosumidor
        </h2>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Membro desde */}
        <StatItem label="Membro desde">
          {STATS.memberSince}
        </StatItem>

        {/* Total Gerado */}
        <StatItem label="Total Gerado" accent="text-green-400">
          {STATS.totalGenerated.toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}{' '}
          <span className="text-xs font-normal text-gray-400">kWh</span>
        </StatItem>

        {/* Total Vendido */}
        <StatItem label="Total Vendido" accent="text-electric">
          {STATS.totalSold.toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}{' '}
          <span className="text-xs font-normal text-gray-400">kWh</span>
        </StatItem>

        {/* Total Comprado */}
        <StatItem label="Total Comprado" accent="text-solar">
          {STATS.totalBought.toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}{' '}
          <span className="text-xs font-normal text-gray-400">kWh</span>
        </StatItem>

        {/* Receita Total */}
        <StatItem label="Receita Total" accent="text-green-400">
          R${' '}
          {STATS.totalRevenue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </StatItem>

        {/* Economia Total */}
        <StatItem label="Economia Total" accent="text-[#00CC66]">
          R${' '}
          {STATS.totalSavings.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </StatItem>

        {/* Trades Concluídas */}
        <StatItem label="Trades Concluídas" accent="text-electric">
          {STATS.completedTrades.toLocaleString('pt-BR')}
        </StatItem>

        {/* Dispositivos Registrados */}
        <StatItem label="Dispositivos Registrados">
          {STATS.registeredDevices}
        </StatItem>

        {/* Uptime Médio */}
        <StatItem label="Uptime Médio" accent="text-green-400">
          {STATS.averageUptime.toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
          %
        </StatItem>

        {/* Reputação — spans full width */}
        <div className="col-span-2 flex flex-col gap-1 p-4 bg-volt-dark-700 rounded-xl">
          <span className="text-xs text-gray-400 font-medium">Reputação</span>
          <StarRating value={STATS.reputation} />
        </div>
      </div>
    </div>
  );
}
