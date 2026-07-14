'use client'

import { useQuery } from '@tanstack/react-query'
import { Cpu, Zap, Wallet, Loader2, AlertCircle } from 'lucide-react'
import { apiUrl, API_CONFIGURED } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Metrics {
  local: { devices: number; preferencesSet: number }
  chain: { deviceCount: string; luzTotalSupply: string } | { error: string }
}

interface Row {
  label: string
  value: string
  icon: React.ElementType
  iconColor: string
}

function StatRow({ label, value, icon: Icon, iconColor }: Row) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-volt-dark-600 last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className={cn('w-4 h-4 flex-shrink-0', iconColor)} />
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <span className="text-sm font-semibold text-white tabular-nums">{value}</span>
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-6 flex flex-col gap-0">
      <h2 className="text-base font-semibold text-white mb-1">Rede VoltchainHub</h2>
      <p className="text-xs text-gray-500 mb-4">Dados on-chain da testnet Amoy, em tempo real</p>
      {children}
    </div>
  )
}

export function NetworkStats() {
  const { data, isLoading, isError } = useQuery<Metrics>({
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

  if (!API_CONFIGURED) {
    return (
      <Shell>
        <p className="text-xs text-gray-500 py-2">
          Métricas da rede ficam disponíveis quando a API estiver publicada
          (configure <code className="text-gray-400">NEXT_PUBLIC_API_URL</code>).
        </p>
      </Shell>
    )
  }

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-electric" /> Carregando métricas…
        </div>
      </Shell>
    )
  }

  if (isError || !data) {
    return (
      <Shell>
        <div className="flex items-center gap-2 text-sm text-red-400 py-4">
          <AlertCircle className="w-4 h-4" /> Não foi possível carregar as métricas.
        </div>
      </Shell>
    )
  }

  const chainOk = !('error' in data.chain)
  const deviceCount = chainOk ? (data.chain as { deviceCount: string }).deviceCount : '—'
  const luzSupply = chainOk ? (data.chain as { luzTotalSupply: string }).luzTotalSupply : '—'

  const rows: Row[] = [
    { label: 'Dispositivos registrados', value: deviceCount, icon: Cpu, iconColor: 'text-electric' },
    { label: 'LuzTokens emitidos (kWh)', value: luzSupply, icon: Zap, iconColor: 'text-solar' },
    { label: 'Preferências de pagamento', value: String(data.local.preferencesSet), icon: Wallet, iconColor: 'text-green-400' },
  ]

  return (
    <Shell>
      <div className="flex flex-col">
        {rows.map((r) => (
          <StatRow key={r.label} {...r} />
        ))}
      </div>
    </Shell>
  )
}
