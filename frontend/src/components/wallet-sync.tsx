'use client'

import { useEffect } from 'react'
import { useAccount } from 'wagmi'

// Espelha o estado de conexao da carteira num flag ESTAVEL no localStorage
// (`vch-wallet` = endereco, ou removido quando desconectado). A landing estatica
// (mesma origem voltchainhub.org) le esse flag pra refletir a conexao no CTA,
// sem depender do schema interno do wagmi. Escreve so no browser.
const KEY = 'vch-wallet'

export function WalletSync() {
  const { address, isConnected } = useAccount()

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (isConnected && address) window.localStorage.setItem(KEY, address)
      else window.localStorage.removeItem(KEY)
    } catch {
      // localStorage indisponivel (modo privado): ignora, o CTA so nao reflete
    }
  }, [address, isConnected])

  return null
}
