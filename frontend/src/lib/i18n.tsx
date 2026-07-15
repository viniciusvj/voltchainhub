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
} satisfies Dict

interface I18nCtx {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: keyof typeof DICT) => string
}

const Ctx = createContext<I18nCtx>({ locale: 'pt', setLocale: () => {}, t: (k) => DICT[k]?.pt ?? String(k) })

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt')

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? (localStorage.getItem('vch-locale') as Locale | null) : null
    if (stored === 'pt' || stored === 'en' || stored === 'es') setLocaleState(stored)
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    if (typeof window !== 'undefined') localStorage.setItem('vch-locale', l)
  }

  const t = (key: keyof typeof DICT) => DICT[key]?.[locale] ?? DICT[key]?.pt ?? String(key)

  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>
}

export const useI18n = () => useContext(Ctx)
