'use client'

import { Zap, TrendingUp, Wallet } from 'lucide-react'
import { useAccount } from 'wagmi'
import { cn } from '@/lib/utils'

// Mock data - replace with actual contract reads when ready
const MOCK_BALANCE = {
  kWh: 142.5,
  brlEquivalent: 14.25,
  changePercent: 4.2,
  changePositive: true,
}

function Sparkline() {
  // Simple SVG sparkline (mock upward trend)
  const points = [10, 14, 11, 16, 13, 18, 15, 20, 17, 22]
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const width = 80
  const height = 28

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width
    const y = height - ((p - min) / range) * height
    return `${x},${y}`
  })
  const polyline = coords.join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0066FF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0066FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${polyline} ${width},${height}`}
        fill="url(#sparkGrad)"
      />
      <polyline
        points={polyline}
        fill="none"
        stroke="#0066FF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BalanceCard() {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-6 flex flex-col items-center justify-center gap-3 min-h-[160px]">
        <div className="w-12 h-12 rounded-full bg-volt-dark-700 flex items-center justify-center">
          <Wallet className="w-6 h-6 text-gray-500" />
        </div>
        <p className="text-sm text-gray-400 text-center">
          Conecte sua carteira para ver seu saldo
        </p>
      </div>
    )
  }

  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-electric/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-electric" />
          </div>
          <span className="text-sm font-medium text-gray-400">Saldo LUZ Token</span>
        </div>
        <span className="text-xs text-gray-500 bg-volt-dark-700 px-2 py-0.5 rounded-full">
          Polygon
        </span>
      </div>

      {/* Balance */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-white tracking-tight">
            {MOCK_BALANCE.kWh.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
            <span className="text-lg font-medium text-gray-400 ml-1">kWh</span>
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            ≈ R$ {MOCK_BALANCE.brlEquivalent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <Sparkline />
      </div>

      {/* Change indicator */}
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
            MOCK_BALANCE.changePositive
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          )}
        >
          <TrendingUp className="w-3 h-3" />
          {MOCK_BALANCE.changePositive ? '+' : ''}
          {MOCK_BALANCE.changePercent.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%
        </div>
        <span className="text-xs text-gray-500">últimas 24h</span>
      </div>
    </div>
  )
}
