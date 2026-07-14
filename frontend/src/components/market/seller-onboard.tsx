'use client'

import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { Zap, CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { luzTokenAbi } from '@/contracts/abis/LuzToken'
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '@/contracts/addresses'

const LUZ_TOKEN_ID = BigInt(1)

// Seller onboarding: shows the seller's LuzToken balance and whether the vault
// is approved to escrow those tokens, with a one-click approve. A buyer can only
// lock a trade against a seller who has approved the vault and holds tokens.
export function SellerOnboard() {
  const { address, isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const luz = CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID].luzToken
  const vault = CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID].energyVault

  const { data: balance } = useReadContract({
    address: luz, abi: luzTokenAbi, functionName: 'balanceOf',
    args: address ? [address, LUZ_TOKEN_ID] : undefined,
    chainId: DEFAULT_CHAIN_ID, query: { enabled: Boolean(address) },
  })
  const { data: approved, refetch } = useReadContract({
    address: luz, abi: luzTokenAbi, functionName: 'isApprovedForAll',
    args: address ? [address, vault] : undefined,
    chainId: DEFAULT_CHAIN_ID, query: { enabled: Boolean(address) },
  })

  async function toggle(next: boolean) {
    setBusy(true); setErr(null)
    try {
      await writeContractAsync({
        address: luz, abi: luzTokenAbi, functionName: 'setApprovalForAll',
        args: [vault, next], chainId: DEFAULT_CHAIN_ID,
      })
      await refetch()
    } catch (e) {
      setErr(e instanceof Error ? e.message.split('\n')[0] : 'Falha na transação')
    } finally { setBusy(false) }
  }

  if (!isConnected) return null

  const kWh = balance !== undefined ? Number(balance as bigint) : 0
  const isApproved = Boolean(approved)

  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-solar/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-solar" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-200">Vender energia</h3>
          <p className="text-xs text-gray-500">Habilite seus LuzTokens para escrow no vault</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Seu saldo</span>
        <span className="font-semibold text-white tabular-nums">{kWh.toLocaleString('pt-BR')} LuzToken (kWh)</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Vault aprovado</span>
        {isApproved ? (
          <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4" /> Sim
          </span>
        ) : (
          <span className="text-xs text-gray-500">Não</span>
        )}
      </div>

      {err && (
        <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 break-words">{err}</div>
      )}

      {isApproved ? (
        <button
          onClick={() => toggle(false)}
          disabled={busy}
          className="w-full py-2.5 rounded-lg text-sm font-medium border border-volt-dark-600 text-gray-400 hover:text-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Revogar aprovação
        </button>
      ) : (
        <button
          onClick={() => toggle(true)}
          disabled={busy}
          className="w-full py-2.5 rounded-lg text-sm font-bold bg-[#FFB800] text-volt-dark-900 hover:bg-[#E5A600] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Habilitar venda (aprovar vault)
        </button>
      )}

      <p className="text-[11px] text-gray-600">
        Um comprador só consegue travar um trade com você depois desta aprovação.
      </p>
    </div>
  )
}
