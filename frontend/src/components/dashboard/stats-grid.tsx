'use client'

import { Sun, TrendingUp, DollarSign, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatItem {
  label: string
  value: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  subLabel?: string
}

// Mock data - replace with contract reads / oracle data when ready
const STATS: StatItem[] = [
  {
    label: 'Energia Gerada Hoje',
    value: '23,4 kWh',
    icon: Sun,
    iconBg: 'bg-solar/10',
    iconColor: 'text-solar',
    subLabel: 'Produção solar',
  },
  {
    label: 'Energia Vendida',
    value: '15,2 kWh',
    icon: TrendingUp,
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-400',
    subLabel: 'Via contratos P2P',
  },
  {
    label: 'Economia do Mês',
    value: 'R$ 127,50',
    icon: DollarSign,
    iconBg: 'bg-electric/10',
    iconColor: 'text-electric',
    subLabel: 'vs. tarifa padrão',
  },
  {
    label: 'Dispositivos Ativos',
    value: '3/3',
    icon: Cpu,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-400',
    subLabel: 'Todos online',
  },
]

interface StatCardProps {
  stat: StatItem
}

function StatCard({ stat }: StatCardProps) {
  const Icon = stat.icon

  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-5 flex items-start gap-4">
      {/* Icon */}
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', stat.iconBg)}>
        <Icon className={cn('w-5 h-5', stat.iconColor)} />
      </div>

      {/* Content */}
      <div className="min-w-0">
        <p className="text-2xl font-bold text-white tracking-tight leading-tight">
          {stat.value}
        </p>
        <p className="text-sm font-medium text-gray-300 mt-0.5">{stat.label}</p>
        {stat.subLabel && (
          <p className="text-xs text-gray-500 mt-0.5">{stat.subLabel}</p>
        )}
      </div>
    </div>
  )
}

export function StatsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {STATS.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </div>
  )
}
