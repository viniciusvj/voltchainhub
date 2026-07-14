'use client'

import { FlaskConical } from 'lucide-react'
import { useI18n, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const LOCALES: Locale[] = ['pt', 'en', 'es']

// Shared top bar that echoes the marketing site's header (same destinations)
// so the app and the landing read as one product. Plain anchors escape the
// app basePath and reach the site root / whitepaper. Includes a language switcher.
export function TopBar() {
  const { locale, setLocale, t } = useI18n()
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-11 px-4 md:px-6 bg-volt-dark-800/80 backdrop-blur border-b border-volt-dark-600">
      <a
        href="https://amoy.polygonscan.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full hover:bg-amber-400/20 transition-colors"
      >
        <FlaskConical className="w-3.5 h-3.5" />
        {t('top.testnet')}
      </a>

      <nav className="flex items-center gap-4 text-sm">
        <a href="/" className="text-gray-400 hover:text-white transition-colors">{t('top.home')}</a>
        <a href="/whitepaper.html" className="text-gray-400 hover:text-white transition-colors">{t('top.whitepaper')}</a>
        <a
          href="https://github.com/viniciusvj/voltchainhub"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors"
        >
          GitHub
        </a>
        <div className="flex items-center gap-1 border-l border-volt-dark-600 pl-3">
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={cn(
                'text-[11px] uppercase font-medium px-1.5 py-0.5 rounded transition-colors',
                locale === l ? 'text-electric bg-electric/10' : 'text-gray-500 hover:text-gray-300',
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </nav>
    </header>
  )
}
