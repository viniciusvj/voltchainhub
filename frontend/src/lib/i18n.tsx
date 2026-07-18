'use client'

import { createContext, useContext, useEffect, useState } from 'react'

// Lightweight client-side i18n for the app chrome (nav/topbar/footer).
// v1 covers the persistent navigation frame in PT/EN/ES; page bodies are still
// PT and are the next extension. Locale persists in localStorage.

export type Locale = 'pt' | 'en' | 'es'

type Entry = { pt: string; en: string; es: string }
type Dict = Record<string, Entry>

// `satisfies` (nao `: Dict`) preserva o tipo literal do objeto, entao
// `keyof typeof DICT` vira a uniao das chaves reais e o t() valida chave em
// tempo de compilacao (chave inexistente = erro de build).
const DICT = {
  'nav.dashboard': { pt: 'Dashboard', en: 'Dashboard', es: 'Panel' },
  'nav.market': { pt: 'Marketplace', en: 'Marketplace', es: 'Mercado' },
  'nav.devices': { pt: 'Dispositivos', en: 'Devices', es: 'Dispositivos' },
  'nav.trades': { pt: 'Trades', en: 'Trades', es: 'Operaciones' },
  'nav.profile': { pt: 'Perfil', en: 'Profile', es: 'Perfil' },
  'nav.backToSite': { pt: 'Voltar ao site', en: 'Back to site', es: 'Volver al sitio' },
  'top.home': { pt: 'Início', en: 'Home', es: 'Inicio' },
  'top.whitepaper': { pt: 'Whitepaper', en: 'Whitepaper', es: 'Whitepaper' },
  'top.testnet': { pt: 'Testnet Amoy', en: 'Amoy testnet', es: 'Testnet Amoy' },
  'connect': { pt: 'Conectar Carteira', en: 'Connect Wallet', es: 'Conectar Cartera' },

  // Cabecalhos das paginas (titulo + subtitulo)
  'page.dashboard.title': { pt: 'Dashboard', en: 'Dashboard', es: 'Panel' },
  'page.dashboard.sub': { pt: 'Visão geral da sua energia descentralizada', en: 'Overview of your decentralized energy', es: 'Vista general de tu energía descentralizada' },
  'page.market.title': { pt: 'Marketplace de Energia', en: 'Energy Marketplace', es: 'Mercado de Energía' },
  'page.market.sub': { pt: 'Compre e venda energia P2P no mercado descentralizado', en: 'Buy and sell P2P energy on the decentralized market', es: 'Compra y vende energía P2P en el mercado descentralizado' },
  'page.devices.title': { pt: 'Dispositivos', en: 'Devices', es: 'Dispositivos' },
  'page.devices.sub': { pt: 'Gerencie seus nós ESP32-S3 e monitore leituras em tempo real', en: 'Manage your ESP32-S3 nodes and monitor readings in real time', es: 'Gestiona tus nodos ESP32-S3 y monitorea lecturas en tiempo real' },
  'page.trades.title': { pt: 'Trades P2P', en: 'P2P Trades', es: 'Operaciones P2P' },
  'page.trades.sub': { pt: 'Gerencie suas transações de energia peer-to-peer', en: 'Manage your peer-to-peer energy transactions', es: 'Gestiona tus transacciones de energía peer-to-peer' },
  'page.profile.title': { pt: 'Perfil', en: 'Profile', es: 'Perfil' },
  'page.profile.sub': { pt: 'Sua carteira e estatísticas de prosumidor', en: 'Your wallet and prosumer stats', es: 'Tu cartera y estadísticas de prosumidor' },

  // Abas de trades
  'tabs.myTrades': { pt: 'Meus trades', en: 'My trades', es: 'Mis operaciones' },
  'tabs.history': { pt: 'Histórico', en: 'History', es: 'Historial' },

  // Formulario de trade (comprar/vender)
  'form.buy': { pt: 'Comprar', en: 'Buy', es: 'Comprar' },
  'form.sell': { pt: 'Vender', en: 'Sell', es: 'Vender' },
  'form.limit': { pt: 'Ordem Limitada', en: 'Limit Order', es: 'Orden Limitada' },
  'form.market': { pt: 'Ordem de Mercado', en: 'Market Order', es: 'Orden de Mercado' },
  'form.connectPrompt': { pt: 'Conecte sua carteira para negociar energia', en: 'Connect your wallet to trade energy', es: 'Conecta tu cartera para negociar energía' },
  'form.price': { pt: 'Preço', en: 'Price', es: 'Precio' },
  'form.amount': { pt: 'Quantidade', en: 'Amount', es: 'Cantidad' },
  'form.decrease': { pt: 'Diminuir preço', en: 'Decrease price', es: 'Disminuir precio' },
  'form.increase': { pt: 'Aumentar preço', en: 'Increase price', es: 'Aumentar precio' },
  'form.seller': { pt: 'Vendedor', en: 'Seller', es: 'Vendedor' },
  'form.sellerAddr': { pt: '(endereço 0x)', en: '(0x address)', es: '(dirección 0x)' },
  'form.sellerHint': { pt: 'O vendedor precisa ter aprovado o vault e ter LuzTokens; senão a transação reverte.', en: 'The seller must have approved the vault and hold LuzTokens; otherwise the transaction reverts.', es: 'El vendedor debe haber aprobado el vault y tener LuzTokens; de lo contrario la transacción se revierte.' },
  'form.subtotal': { pt: 'Subtotal', en: 'Subtotal', es: 'Subtotal' },
  'form.protocolFee': { pt: 'Taxa protocolo (0,5%)', en: 'Protocol fee (0.5%)', es: 'Comisión del protocolo (0,5%)' },
  'form.estTotal': { pt: 'Total estimado', en: 'Estimated total', es: 'Total estimado' },
  'form.lockEscrow': { pt: 'Travar escrow (comprar)', en: 'Lock escrow (buy)', es: 'Bloquear escrow (comprar)' },
  'form.approveVault': { pt: 'Aprovar vault (vender)', en: 'Approve vault (sell)', es: 'Aprobar vault (vender)' },
  'form.txSent': { pt: 'Transação enviada, ver no PolygonScan', en: 'Transaction sent, view on PolygonScan', es: 'Transacción enviada, ver en PolygonScan' },
  'form.footer': { pt: 'Taxa do protocolo: 0,5% • Liquidação via EnergyVault (testnet Amoy)', en: 'Protocol fee: 0.5% • Settlement via EnergyVault (Amoy testnet)', es: 'Comisión del protocolo: 0,5% • Liquidación vía EnergyVault (testnet Amoy)' },
  'form.errSeller': { pt: 'Informe o endereço do vendedor (0x...).', en: 'Enter the seller address (0x...).', es: 'Ingresa la dirección del vendedor (0x...).' },
  'form.errTx': { pt: 'Falha na transação', en: 'Transaction failed', es: 'Falla en la transacción' },

  // Card de onboarding do vendedor
  'sell.title': { pt: 'Vender energia', en: 'Sell energy', es: 'Vender energía' },
  'sell.subtitle': { pt: 'Habilite seus LuzTokens para escrow no vault', en: 'Enable your LuzTokens for escrow in the vault', es: 'Habilita tus LuzTokens para escrow en el vault' },
  'sell.balance': { pt: 'Seu saldo', en: 'Your balance', es: 'Tu saldo' },
  'sell.vaultApproved': { pt: 'Vault aprovado', en: 'Vault approved', es: 'Vault aprobado' },
  'sell.yes': { pt: 'Sim', en: 'Yes', es: 'Sí' },
  'sell.no': { pt: 'Não', en: 'No', es: 'No' },
  'sell.revoke': { pt: 'Revogar aprovação', en: 'Revoke approval', es: 'Revocar aprobación' },
  'sell.enable': { pt: 'Habilitar venda (aprovar vault)', en: 'Enable selling (approve vault)', es: 'Habilitar venta (aprobar vault)' },
  'sell.hint': { pt: 'Um comprador só consegue travar um trade com você depois desta aprovação.', en: 'A buyer can only lock a trade with you after this approval.', es: 'Un comprador solo puede bloquear una operación contigo tras esta aprobación.' },
} satisfies Dict

interface I18nCtx {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: keyof typeof DICT) => string
}

const Ctx = createContext<I18nCtx>({ locale: 'pt', setLocale: () => {}, t: (k) => DICT[k]?.pt ?? String(k) })

const isLocale = (v: string | null): v is Locale => v === 'pt' || v === 'en' || v === 'es'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt')

  // Precedencia na carga: ?lang= na URL (deep-link compartilhavel) > localStorage
  // > padrao 'pt'. O parametro da URL tambem persiste no localStorage.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const fromUrl = new URLSearchParams(window.location.search).get('lang')
    if (isLocale(fromUrl)) {
      setLocaleState(fromUrl)
      try { localStorage.setItem('vch-locale', fromUrl) } catch {}
      return
    }
    try {
      const stored = localStorage.getItem('vch-locale')
      if (isLocale(stored)) setLocaleState(stored)
    } catch {}
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('vch-locale', l)
      // Reflete o idioma na URL sem recarregar, pra o link ficar compartilhavel.
      const u = new URL(window.location.href)
      u.searchParams.set('lang', l)
      window.history.replaceState({}, '', u)
    } catch {}
  }

  const t = (key: keyof typeof DICT) => DICT[key]?.[locale] ?? DICT[key]?.pt ?? String(key)

  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>
}

export const useI18n = () => useContext(Ctx)
