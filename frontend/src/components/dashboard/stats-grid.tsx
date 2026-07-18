'use client'

import { useQuery } from '@tanstack/react-query'
import { Network, Percent, Cpu, ShieldCheck } from 'lucide-react'
import { apiUrl, API_CONFIGURED } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

interface Metrics {
  chain: { deviceCount: string } | { error: string }
}

interface StatItem {
  label: string
  value: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  subLabel?: string
}

function StatCard({ stat }: { stat: StatItem }) {
  const Icon = stat.icon
  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-5 flex items-start gap-4">
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', stat.iconBg)}>
        <Icon className={cn('w-5 h-5', stat.iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-white tracking-tight leading-tight">{stat.value}</p>
        <p className="text-sm font-medium text-gray-300 mt-0.5">{stat.label}</p>
        {stat.subLabel && <p className="text-xs text-gray-500 mt-0.5">{stat.subLabel}</p>}
      </div>
    </div>
  )
}

export function StatsGrid() {
  const { t } = useI18n()
  const { data } = useQuery<Metrics>({
    queryKey: ['metrics'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/metrics'))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
    enabled: API_CONFIGURED,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const deviceCount =
    data && !('error' in data.chain) ? (data.chain as { deviceCount: string }).deviceCount : '-'

  const stats: StatItem[] = [
    {
      label: t('db.stats.network'),
      value: 'Polygon Amoy',
      icon: Network,
      iconBg: 'bg-electric/10',
      iconColor: 'text-electric',
      subLabel: t('db.stats.testnet'),
    },
    {
      label: t('db.stats.fee'),
      value: t('db.stats.feeValue'),
      icon: Percent,
      iconBg: 'bg-solar/10',
      iconColor: 'text-solar',
      subLabel: t('db.stats.feeSub'),
    },
    {
      label: t('db.stats.devices'),
      value: deviceCount,
      icon: Cpu,
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      subLabel: t('db.stats.devicesSub'),
    },
    {
      label: t('db.stats.contracts'),
      value: '6',
      icon: ShieldCheck,
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-400',
      subLabel: 'PolygonScan Amoy',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </div>
  )
}
