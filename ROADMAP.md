# VoltchainHub Roadmap

Roteiro de trabalho por frentes (complementa as fases do [README](./README.md#roadmap)).
Status: ✅ feito · 🔵 em andamento · ⬜ planejado.

## Produto ao vivo (voltchainhub.org)

- ✅ Landing + whitepaper (PT/EN) servidos pelo consolidado
- ✅ dApp Next.js em `/app` (wagmi na Amoy, WalletConnect, card de governança)
- ✅ Backend API em `/api` (preferences/stats, metrics lendo a chain)
- ✅ 6 contratos deployados e verificados na Amoy + smoke tests on-chain

## Integração app ↔ página inicial (épica)

Hoje a landing (`voltchainhub.org/`) e o dApp (`voltchainhub.org/app/`) são dois
mundos: a landing tem um link "App", mas o app não tinha volta e as duas telas não
compartilham identidade visual. Objetivo: que pareçam **um só produto**.

- ✅ Link home → app (nav + CTA "Abrir App" no hero da landing)
- ✅ Link app → home (logo e "Voltar ao site" no sidebar do app)
- ✅ Top bar compartilhada no app (badge "Testnet Amoy" + nav Início/Whitepaper/GitHub, paridade com a landing)
- ✅ CTA contextual: seção "Experimente na testnet" na landing com deep-links (`/app/devices`, `/app/market`)
- ✅ Paleta unificada: landing adota os tokens do app (fundo #0A0A0F, âmbar #FFB800, azul #0066FF); CSS versionado (?v)
- ✅ Estado de conexão de carteira consistente landing↔app: `WalletSync` grava flag `vch-wallet` no localStorage; CTAs da landing viram "Continuar no app" + chip com endereço quando conectada
- ✅ Rodapé unificado: app tem footer (VoltchainHub/Apache 2.0/testnet + Início/Whitepaper/GitHub/Discussions); landing ganhou link Discussions
- ✅ i18n PT/EN/ES no chrome do app (topbar, sidebar, footer + badge testnet) com switcher; persiste em localStorage
- ✅ i18n dos cabeçalhos das páginas (título+subtítulo das 5 telas via `PageHeader` client, mantendo o `export metadata` dos Server Components) + abas de trades; DICT com `satisfies` pra checagem estática de chave
- ✅ i18n dos cards de trade (trade-form + seller-onboard: abas, campos, resumo, botões, erros, hints) PT/EN/ES
- ✅ i18n do wizard register-device (3 steps, campos, validações, resumo, sucesso/erro, navegação) PT/EN/ES. Faltam os cards de dashboard/* e profile/*
- ✅ Locale na URL (`?lang=en|es`): precedência URL > localStorage > pt; o switcher reflete o idioma na querystring (link compartilhável)
- ✅ Página pública de status (`/status.html`): saúde da API + estado on-chain ao vivo (no-store, refresh 30s) + 6 contratos verificados; link Status na nav e footer da landing
- ✅ nginx: `/app/` servido sem o sub_filter v2w (location próprio); cookie bar/analytics não aparecem mais no dApp
- ✅ Repo docs/ sincronizado com a produção (index/whitepaper/style + llms/robots/sitemap); fonte única, edições agora podem ser repo-first
- ⬜ Considerar renderizar a landing dentro do próprio Next (rota `/`) para header/rodapé realmente compartilhados

## Backend & dados

- ✅ Backend publicado em `voltchainhub.org/api` (container no consolidado)
- ✅ /api/preferences/stats consumido pelo card de governança (dados reais)
- ✅ NetworkStats consumindo `/api/metrics` (deviceCount, LuzToken supply corrigido para raw int)
- ✅ StatsGrid reformulado com fatos reais (rede, fee 0,5%, contratos verificados, dispositivos on-chain ao vivo); removidos os KPIs de energia falsos
- ⬜ Publicar preferences reais conforme prosumidores usam o app

## Contratos & on-chain

- ✅ Deploy + verify Amoy; smoke tests device/mint, marketplace (fee 0,5%), escrow (settle)
- ✅ Escrow buyer-funded no frontend: trade-form faz lockTrade real (buy, value do buyer) e setApprovalForAll (sell), sem simulação; taxa corrigida pra 0,5%
- ✅ Fluxo completo do trade na UI: tela "Meus trades" lê eventos TradeLocked on-chain, filtra por buyer/seller e oferece confirmDelivery (comprador) e settleTrade conforme o status
- ✅ Onboarding do vendedor no marketplace (card SellerOnboard: balanceOf LUZ + setApprovalForAll do vault)
- ⬜ Deploy mainnet (exige autorização dupla do Vinicius)

## Firmware & hardware

- ✅ Design doc `docs/design/firmware-esp32s3.md` (issue #4)
- 🔵 Bring-up ESP-IDF: skeleton em `firmware/esp32s3/` (pipeline sampling->energy->signer->net, camadas stubadas)
- ⬜ ADC real (SCT-013), ECDSA no ATECC608B (esp-cryptoauthlib), CBOR + MQTT/TLS

## Regulatório & comunidade

- ✅ Parecer ANEEL draft (`docs/regulatory/parecer-ANEEL-REN-1000.md`, issue #5)
- ✅ Discussion #6 chamando revisores embedded e regulatório
- ⬜ Whitepaper §5.4 revisado por profissional de direito regulatório
- ⬜ Growth: thread técnica no X com a testnet ao vivo

## Infra & DevOps

- ✅ CI (contracts + backend) + amoy-health semanal
- ✅ Script de deploy do backend (`scripts/deploy-backend.sh`)
- ✅ Domain allowlist do WalletConnect (voltchainhub.org allowlistado no Reown)
- ✅ Deploy do app: purge total do Cloudflare após cada deploy (senão 404 cacheado nos chunks _next)
- ✅ Observabilidade pública: página `/status.html` lê `/api/health` + `/api/metrics` (chain-read) e sinaliza operacional/degradado/indisponível
- ✅ Alertas ativos: `scripts/status-watchdog.mjs` consulta `/api/metrics`, deriva UP/DEGRADED/DOWN e avisa no WhatsApp so em transicao de estado. Task Scheduler `VoltchainHub-Status-Watchdog` a cada 15 min
