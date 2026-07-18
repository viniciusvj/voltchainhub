'use client'

import { useQuery } from '@tanstack/react-query'
import { Vote, Loader2, AlertCircle } from 'lucide-react'
import { apiUrl, API_CONFIGURED } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

interface PreferenceStats {
  totalPreferencesSet: number
  byCategory: Record<string, number>
  topTokens: Array<{ symbol: string; count: number }>
  averageMaxSlippageBps: number
}

// Categorias fixas (a ordem/keys nao mudam); os rotulos traduziveis resolvem no
// render via t(). BRL/USD stable sao termos que ficam iguais nos 3 idiomas.
const CATEGORIES = ['BRL_STABLE', 'USD_STABLE', 'NATIVE_WRAPPED', 'OTHER'] as const

const CATEGORY_COLORS: Record<string, string> = {
  BRL_STABLE: 'bg-electric',
  USD_STABLE: 'bg-green-400',
  NATIVE_WRAPPED: 'bg-amber-400',
  OTHER: 'bg-gray-500',
}

function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-electric/10 flex items-center justify-center">
          <Vote className="w-5 h-5 text-electric" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-200">{t('db.gov.title')}</h3>
          <p className="text-xs text-gray-500">{t('db.gov.subtitle')}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export function GovernanceCard() {
  const { t } = useI18n()
  const catLabel = (cat: string) =>
    cat === 'BRL_STABLE' ? 'BRL stable'
    : cat === 'USD_STABLE' ? 'USD stable'
    : cat === 'NATIVE_WRAPPED' ? t('db.gov.catNative')
    : t('db.gov.catOther')
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
          {t('db.gov.noApiPre')}<code className="text-gray-400">NEXT_PUBLIC_API_URL</code>{t('db.net.noApiPost')}
        </p>
      </Shell>
    )
  }

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-electric" /> {t('db.gov.loading')}
        </div>
      </Shell>
    )
  }

  if (isError || !data) {
    return (
      <Shell>
        <div className="flex items-center gap-2 text-sm text-red-400 py-4">
          <AlertCircle className="w-4 h-4" /> {t('db.gov.error')}
        </div>
      </Shell>
    )
  }

  const total = data.totalPreferencesSet || 0
  const categories = CATEGORIES

  return (
    <Shell>
      <div>
        <p className="text-3xl font-bold text-white tracking-tight">
          {total.toLocaleString('pt-BR')}
          <span className="text-sm font-medium text-gray-400 ml-2">{t('db.gov.prefsSet')}</span>
        </p>
      </div>

      {/* Category breakdown */}
      <div className="flex flex-col gap-2">
        {categories.map((cat) => {
          const count = data.byCategory?.[cat] ?? 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={cat} className="flex items-center gap-2 text-xs">
              <span className="w-28 text-gray-400">{catLabel(cat)}</span>
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
        {t('db.gov.avgSlippage')} <span className="text-gray-300">{(data.averageMaxSlippageBps / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%</span>
      </p>
    </Shell>
  )
}
