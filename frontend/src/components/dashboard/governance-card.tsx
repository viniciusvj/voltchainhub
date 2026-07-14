'use client'

import { useQuery } from '@tanstack/react-query'
import { Vote, Loader2, AlertCircle } from 'lucide-react'
import { apiUrl, API_CONFIGURED } from '@/lib/api'
import { cn } from '@/lib/utils'

interface PreferenceStats {
  totalPreferencesSet: number
  byCategory: Record<string, number>
  topTokens: Array<{ symbol: string; count: number }>
  averageMaxSlippageBps: number
}

const CATEGORY_LABELS: Record<string, string> = {
  BRL_STABLE: 'BRL stable',
  USD_STABLE: 'USD stable',
  NATIVE_WRAPPED: 'Nativo/wrapped',
  OTHER: 'Outros',
}

const CATEGORY_COLORS: Record<string, string> = {
  BRL_STABLE: 'bg-electric',
  USD_STABLE: 'bg-green-400',
  NATIVE_WRAPPED: 'bg-amber-400',
  OTHER: 'bg-gray-500',
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-electric/10 flex items-center justify-center">
          <Vote className="w-5 h-5 text-electric" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-200">Governança de pagamento</h3>
          <p className="text-xs text-gray-500">Moeda de recebimento escolhida pelos prosumidores</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export function GovernanceCard() {
  const { data, isLoading, isError } = useQuery<PreferenceStats>({
    queryKey: ['preferences-stats'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/preferences/stats'))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
    enabled: API_CONFIGURED,
    staleTime: 60_000,
  })

  if (!API_CONFIGURED) {
    return (
      <Shell>
        <p className="text-xs text-gray-500">
          Dados de governança ficam disponíveis quando a API do backend estiver publicada
          (configure <code className="text-gray-400">NEXT_PUBLIC_API_URL</code>).
        </p>
      </Shell>
    )
  }

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-electric" /> Carregando estatísticas…
        </div>
      </Shell>
    )
  }

  if (isError || !data) {
    return (
      <Shell>
        <div className="flex items-center gap-2 text-sm text-red-400 py-4">
          <AlertCircle className="w-4 h-4" /> Não foi possível carregar as estatísticas.
        </div>
      </Shell>
    )
  }

  const total = data.totalPreferencesSet || 0
  const categories = Object.keys(CATEGORY_LABELS)

  return (
    <Shell>
      <div>
        <p className="text-3xl font-bold text-white tracking-tight">
          {total.toLocaleString('pt-BR')}
          <span className="text-sm font-medium text-gray-400 ml-2">preferências definidas</span>
        </p>
      </div>

      {/* Category breakdown */}
      <div className="flex flex-col gap-2">
        {categories.map((cat) => {
          const count = data.byCategory?.[cat] ?? 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={cat} className="flex items-center gap-2 text-xs">
              <span className="w-28 text-gray-400">{CATEGORY_LABELS[cat]}</span>
              <div className="flex-1 h-2 rounded-full bg-volt-dark-700 overflow-hidden">
                <div className={cn('h-full rounded-full', CATEGORY_COLORS[cat])} style={{ width: `${pct}%` }} />
              </div>
              <span className="w-10 text-right text-gray-300 tabular-nums">{count}</span>
            </div>
          )
        })}
      </div>

      {/* Top tokens */}
      {data.topTokens?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.topTokens.slice(0, 6).map((t) => (
            <span key={t.symbol} className="text-xs bg-volt-dark-700 text-gray-300 px-2 py-0.5 rounded-full">
              {t.symbol} <span className="text-gray-500">{t.count}</span>
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Slippage máximo médio: <span className="text-gray-300">{(data.averageMaxSlippageBps / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%</span>
      </p>
    </Shell>
  )
}
