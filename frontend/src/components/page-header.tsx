'use client'

import { useI18n } from '@/lib/i18n'

// Cabecalho de pagina traduzido. As paginas sao Server Components (exportam
// `metadata` pra SEO), entao nao podem usar o hook direto; delegam o titulo/
// subtitulo pra este componente client, passando as chaves do dicionario.
type Keys = Parameters<ReturnType<typeof useI18n>['t']>[0]

export function PageHeader({ titleKey, subKey }: { titleKey: Keys; subKey: Keys }) {
  const { t } = useI18n()
  return (
    <div>
      <h1 className="text-2xl font-bold text-white tracking-tight">{t(titleKey)}</h1>
      <p className="text-sm text-gray-400 mt-1">{t(subKey)}</p>
    </div>
  )
}
