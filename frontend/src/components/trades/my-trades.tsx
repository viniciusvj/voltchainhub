'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAccount, usePublicClient, useWriteContract } from 'wagmi'
import { Loader2, RefreshCw, ExternalLink } from 'lucide-react'
import { energyVaultAbi } from '@/contracts/abis/EnergyVault'
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '@/contracts/addresses'
import { cn } from '@/lib/utils'

const STATUS = ['Pendente', 'Travado', 'Entregue', 'Liquidado', 'Expirado', 'Disputado'] as const
const STATUS_STYLE: Record<number, string> = {
  1: 'bg-electric/10 text-electric',
  2: 'bg-amber-400/10 text-amber-400',
  3: 'bg-green-500/10 text-green-400',
  4: 'bg-gray-500/10 text-gray-400',
  5: 'bg-red-500/10 text-red-400',
}

interface Trade {
  tradeId: `0x${string}`
  seller: string
  buyer: string
  energyWh: bigint
  status: number
}

const TRADE_LOCKED = energyVaultAbi.find(
  (i) => i.type === 'event' && i.name === 'TradeLocked',
) as never

export function MyTrades() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient({ chainId: DEFAULT_CHAIN_ID })
  const { writeContractAsync } = useWriteContract()

  const vault = CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID].energyVault
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!address || !publicClient) return
    setLoading(true)
    setError(null)
    try {
      const current = await publicClient.getBlockNumber()
      const fromBlock = current > BigInt(50000) ? current - BigInt(50000) : BigInt(0)
      const logs = await publicClient.getLogs({
        address: vault,
        event: TRADE_LOCKED,
        fromBlock,
        toBlock: 'latest',
      })
      const mine = logs.filter((l) => {
        const a = (l as { args: { seller?: string; buyer?: string } }).args
        return a.seller?.toLowerCase() === address.toLowerCase() ||
               a.buyer?.toLowerCase() === address.toLowerCase()
      })
      const seen = new Set<string>()
      const out: Trade[] = []
      for (const l of mine) {
        const tradeId = (l as { args: { tradeId: `0x${string}` } }).args.tradeId
        if (seen.has(tradeId)) continue
        seen.add(tradeId)
        const t = (await publicClient.readContract({
          address: vault,
          abi: energyVaultAbi,
          functionName: 'getTrade',
          args: [tradeId],
        })) as { seller: string; buyer: string; energyAmount: bigint; status: number }
        out.push({ tradeId, seller: t.seller, buyer: t.buyer, energyWh: t.energyAmount, status: Number(t.status) })
      }
      setTrades(out)
    } catch (err) {
      setError(err instanceof Error ? err.message.split('\n')[0] : 'Falha ao ler os trades')
    } finally {
      setLoading(false)
    }
  }, [address, publicClient, vault])

  useEffect(() => { void load() }, [load])

  async function act(fn: 'confirmDelivery' | 'settleTrade', tradeId: `0x${string}`) {
    setBusy(tradeId + fn)
    setError(null)
    try {
      await writeContractAsync({
        address: vault,
        abi: energyVaultAbi,
        functionName: fn,
        args: [tradeId],
        chainId: DEFAULT_CHAIN_ID,
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message.split('\n')[0] : 'Falha na transação')
    } finally {
      setBusy(null)
    }
  }

  if (!isConnected) {
    return <p className="text-sm text-gray-400 py-6 text-center">Conecte a carteira para ver seus trades on-chain.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Trades do EnergyVault (últimos ~50k blocos) da sua carteira</span>
        <button onClick={() => void load()} className="text-gray-400 hover:text-white" aria-label="Recarregar">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 break-words">{error}</div>
      )}

      {loading && trades.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-electric" /> Lendo trades on-chain…
        </div>
      )}

      {!loading && trades.length === 0 && !error && (
        <p className="text-sm text-gray-500 py-4 text-center">Nenhum trade encontrado para esta carteira.</p>
      )}

      {trades.map((t) => {
        const isBuyer = t.buyer.toLowerCase() === address?.toLowerCase()
        return (
          <div key={t.tradeId} className="border border-volt-dark-600 rounded-lg p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <a
                href={`https://amoy.polygonscan.com/address/${vault}`}
                target="_blank" rel="noopener noreferrer"
                className="font-mono text-xs text-gray-400 hover:text-white flex items-center gap-1"
              >
                {t.tradeId.slice(0, 10)}…{t.tradeId.slice(-6)} <ExternalLink className="w-3 h-3" />
              </a>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_STYLE[t.status] || 'bg-gray-500/10 text-gray-400')}>
                {STATUS[t.status] ?? '?'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{isBuyer ? 'Você compra' : 'Você vende'} · {(Number(t.energyWh) / 1000).toLocaleString('pt-BR')} kWh</span>
              <div className="flex gap-2">
                {isBuyer && t.status === 1 && (
                  <button
                    onClick={() => act('confirmDelivery', t.tradeId)}
                    disabled={busy === t.tradeId + 'confirmDelivery'}
                    className="text-xs font-semibold px-2.5 py-1 rounded bg-electric text-white hover:bg-[#0055DD] disabled:opacity-50"
                  >
                    {busy === t.tradeId + 'confirmDelivery' ? 'Enviando…' : 'Confirmar entrega'}
                  </button>
                )}
                {t.status === 2 && (
                  <button
                    onClick={() => act('settleTrade', t.tradeId)}
                    disabled={busy === t.tradeId + 'settleTrade'}
                    className="text-xs font-semibold px-2.5 py-1 rounded bg-green-500 text-volt-dark-900 hover:bg-green-400 disabled:opacity-50"
                  >
                    {busy === t.tradeId + 'settleTrade' ? 'Enviando…' : 'Liquidar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
