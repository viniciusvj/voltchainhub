'use client'

import { TrendingUp, TrendingDown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock data - replace with PowerMatcher oracle feed when ready
const MOCK_MARKET = {
  currentPrice: 0.10,       // R$/kWh
  change24h: 2.3,           // percent
  changePositive: true,
  minDay: 0.087,
  maxDay: 0.114,
  source: 'PowerMatcher',
}

export function MarketPrice() {
  const TrendIcon = MOCK_MARKET.changePositive ? TrendingUp : TrendingDown

  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-solar/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-solar" />
          </div>
          <span className="text-sm font-medium text-gray-400">Preço P2P</span>
        </div>
        {/* PowerMatcher badge */}
        <span className="text-xs font-medium text-electric bg-electric/10 border border-electric/20 px-2 py-0.5 rounded-full">
          {MOCK_MARKET.source}
        </span>
      </div>

      {/* Price */}
      <div className="flex items-end gap-3">
        <div>
          <p className="text-3xl font-bold text-white tracking-tight">
            R${' '}
            {MOCK_MARKET.currentPrice.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 3,
            })}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">por kWh</p>
        </div>

        {/* 24h change */}
        <div
          className={cn(
            'flex items-center gap-1 text-sm font-semibold mb-1',
            MOCK_MARKET.changePositive ? 'text-green-400' : 'text-red-400'
          )}
        >
          <TrendIcon className="w-4 h-4" />
          {MOCK_MARKET.changePositive ? '+' : ''}
          {MOCK_MARKET.change24h.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%
        </div>
      </div>

      {/* Min / Max */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-volt-dark-600">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Mínima do dia</p>
          <p className="text-sm font-medium text-white">
            R${' '}
            {MOCK_MARKET.minDay.toLocaleString('pt-BR', {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            })}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Máxima do dia</p>
          <p className="text-sm font-medium text-white">
            R${' '}
            {MOCK_MARKET.maxDay.toLocaleString('pt-BR', {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
