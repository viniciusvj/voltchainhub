'use client'

import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { shortenAddress } from '@/lib/utils'

type TxStatus = 'settled' | 'pending' | 'escrow'
type TxType = 'sold' | 'bought'

interface Transaction {
  id: string
  type: TxType
  counterparty: string
  amountKwh: number
  priceBRL: number
  timeAgo: string
  status: TxStatus
}

// Mock data - replace with subgraph / contract events when ready
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '0x1a2b',
    type: 'sold',
    counterparty: '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12',
    amountKwh: 5.2,
    priceBRL: 0.52,
    timeAgo: 'há 12 min',
    status: 'settled',
  },
  {
    id: '0x3c4d',
    type: 'bought',
    counterparty: '0x1234567890AbCdEf1234567890AbCdEf12345678',
    amountKwh: 3.8,
    priceBRL: 0.38,
    timeAgo: 'há 45 min',
    status: 'escrow',
  },
  {
    id: '0x5e6f',
    type: 'sold',
    counterparty: '0xDeAdBeEf1234567890DeAdBeEf1234567890DeAd',
    amountKwh: 8.1,
    priceBRL: 0.81,
    timeAgo: 'há 2h',
    status: 'settled',
  },
  {
    id: '0x7a8b',
    type: 'sold',
    counterparty: '0xCaFeBaBe1234567890CaFeBaBe1234567890CaFe',
    amountKwh: 2.5,
    priceBRL: 0.25,
    timeAgo: 'há 3h',
    status: 'pending',
  },
  {
    id: '0x9c0d',
    type: 'bought',
    counterparty: '0xFeedFace1234567890FeedFace1234567890Feed',
    amountKwh: 10.0,
    priceBRL: 1.0,
    timeAgo: 'há 5h',
    status: 'settled',
  },
]

const STATUS_CONFIG: Record<TxStatus, { label: string; className: string }> = {
  settled: {
    label: 'Liquidada',
    className: 'bg-green-500/10 text-green-400 border border-green-500/20',
  },
  pending: {
    label: 'Pendente',
    className: 'bg-solar/10 text-solar border border-solar/20',
  },
  escrow: {
    label: 'Em Escrow',
    className: 'bg-electric/10 text-electric border border-electric/20',
  },
}

interface TransactionRowProps {
  tx: Transaction
}

function TransactionRow({ tx }: TransactionRowProps) {
  const isSold = tx.type === 'sold'
  const status = STATUS_CONFIG[tx.status]

  return (
    <div className="flex items-center gap-3 py-3 border-b border-volt-dark-600 last:border-0">
      {/* Type icon */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isSold ? 'bg-green-500/10' : 'bg-electric/10'
        )}
      >
        {isSold ? (
          <ArrowUpRight className="w-4 h-4 text-green-400" />
        ) : (
          <ArrowDownLeft className="w-4 h-4 text-electric" />
        )}
      </div>

      {/* Counterparty + time */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {isSold ? 'Venda para' : 'Compra de'}{' '}
          <span className="font-mono text-gray-300">
            {shortenAddress(tx.counterparty)}
          </span>
        </p>
        <p className="text-xs text-gray-500">{tx.timeAgo}</p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p
          className={cn(
            'text-sm font-semibold',
            isSold ? 'text-green-400' : 'text-electric'
          )}
        >
          {isSold ? '+' : '-'}
          {tx.amountKwh.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}{' '}
          kWh
        </p>
        <p className="text-xs text-gray-500">
          R${' '}
          {tx.priceBRL.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      {/* Status badge */}
      <div className="flex-shrink-0 hidden sm:block">
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            status.className
          )}
        >
          {status.label}
        </span>
      </div>
    </div>
  )
}

export function RecentTransactions() {
  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-white">Transações Recentes</h2>
        <Link
          href="/trades"
          className="text-xs text-electric hover:text-electric/80 transition-colors font-medium"
        >
          Ver todas &rarr;
        </Link>
      </div>

      {/* Transaction list */}
      <div className="flex flex-col mt-1">
        {MOCK_TRANSACTIONS.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </div>
    </div>
  )
}
