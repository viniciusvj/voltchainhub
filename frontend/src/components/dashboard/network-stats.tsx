'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts'
import { Users, Zap, Lock, TrendingUp, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NetworkStat {
  label: string
  value: string
  icon: React.ElementType
  iconColor: string
}

// Mock data - replace with subgraph / oracle reads when ready
const NETWORK_STATS: NetworkStat[] = [
  {
    label: 'Total Prosumidores',
    value: '1.247',
    icon: Users,
    iconColor: 'text-electric',
  },
  {
    label: 'Energia Transacionada',
    value: '45,2 MWh',
    icon: Zap,
    iconColor: 'text-solar',
  },
  {
    label: 'Escrows Ativos',
    value: '23',
    icon: Lock,
    iconColor: 'text-purple-400',
  },
  {
    label: 'Preço Médio',
    value: 'R$ 0,09/kWh',
    icon: TrendingUp,
    iconColor: 'text-green-400',
  },
  {
    label: 'Uptime Oracle',
    value: '99,7%',
    icon: Radio,
    iconColor: 'text-green-400',
  },
]

// Mock weekly volume data (MWh per day)
const WEEKLY_VOLUME = [
  { day: 'Seg', volume: 6.2 },
  { day: 'Ter', volume: 7.8 },
  { day: 'Qua', volume: 5.9 },
  { day: 'Qui', volume: 8.4 },
  { day: 'Sex', volume: 9.1 },
  { day: 'Sáb', volume: 4.3 },
  { day: 'Dom', volume: 3.5 },
]

function BarTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-volt-dark-700 border border-volt-dark-600 rounded-lg px-3 py-1.5 shadow-xl text-xs">
      <p className="text-gray-400 mb-0.5">{label}</p>
      <p className="text-white font-semibold">
        {Number(payload[0].value).toLocaleString('pt-BR', {
          minimumFractionDigits: 1,
        })}{' '}
        MWh
      </p>
    </div>
  )
}

interface StatRowProps {
  stat: NetworkStat
}

function StatRow({ stat }: StatRowProps) {
  const Icon = stat.icon
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-volt-dark-600 last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className={cn('w-4 h-4 flex-shrink-0', stat.iconColor)} />
        <span className="text-sm text-gray-400">{stat.label}</span>
      </div>
      <span className="text-sm font-semibold text-white">{stat.value}</span>
    </div>
  )
}

export function NetworkStats() {
  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-6 flex flex-col gap-0">
      {/* Header */}
      <h2 className="text-base font-semibold text-white mb-1">Rede VoltchainHub</h2>
      <p className="text-xs text-gray-500 mb-4">Estatísticas em tempo real da rede P2P</p>

      {/* Stats rows */}
      <div className="flex flex-col">
        {NETWORK_STATS.map((stat) => (
          <StatRow key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Weekly volume mini chart */}
      <div className="mt-5">
        <p className="text-xs text-gray-500 mb-3">Volume Semanal (MWh)</p>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart
            data={WEEKLY_VOLUME}
            margin={{ top: 0, right: 0, left: -30, bottom: 0 }}
            barSize={12}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#222230"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<BarTooltip />} cursor={{ fill: '#222230' }} />
            <Bar
              dataKey="volume"
              fill="#0066FF"
              radius={[3, 3, 0, 0]}
              opacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
