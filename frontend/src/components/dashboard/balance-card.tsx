'use client'

import { Zap, TrendingUp, Wallet } from 'lucide-react'
import { useAccount, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { luzTokenAbi } from '@/contracts/abis/LuzToken'
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '@/contracts/addresses'

// LuzToken receipt id used by the MVP flows (1 = 1 kWh receipt).
const LUZ_TOKEN_ID = BigInt(1)
// Indicative BRL price per kWh for the estimate line (display only).
const BRL_PER_KWH = 0.1

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
  const { isConnected, address } = useAccount()
  const { t } = useI18n()

  const luzAddress = CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID].luzToken
  const { data: rawBalance } = useReadContract({
    address: luzAddress,
    abi: luzTokenAbi,
    functionName: 'balanceOf',
    args: address ? [address, LUZ_TOKEN_ID] : undefined,
    chainId: DEFAULT_CHAIN_ID,
    query: { enabled: Boolean(address) },
  })

  const kWh = rawBalance !== undefined ? Number(formatUnits(rawBalance as bigint, 18)) : 0
  const brlEquivalent = kWh * BRL_PER_KWH

  if (!isConnected) {
    return (
      <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-6 flex flex-col items-center justify-center gap-3 min-h-[160px]">
        <div className="w-12 h-12 rounded-full bg-volt-dark-700 flex items-center justify-center">
          <Wallet className="w-6 h-6 text-gray-500" />
        </div>
        <p className="text-sm text-gray-400 text-center">
          {t('db.balance.connect')}
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
          <span className="text-sm font-medium text-gray-400">{t('db.balance.title')}</span>
        </div>
        <span className="text-xs text-gray-500 bg-volt-dark-700 px-2 py-0.5 rounded-full">
          Polygon
        </span>
      </div>

      {/* Balance */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-white tracking-tight">
            {kWh.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
            <span className="text-lg font-medium text-gray-400 ml-1">kWh</span>
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            ≈ R$ {brlEquivalent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <Sparkline />
      </div>

      {/* Live source indicator */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-electric/10 text-electric">
          <TrendingUp className="w-3 h-3" />
          on-chain
        </div>
        <span className="text-xs text-gray-500">{t('db.balance.source')}</span>
      </div>
    </div>
  )
}
