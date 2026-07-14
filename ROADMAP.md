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
- ⬜ Header/identidade visual totalmente unificados (paleta: landing é âmbar `#F5A623`, app é azul `#0066FF`; convergir)
- ⬜ Estado de conexão de carteira visível/consistente ao navegar entre landing e app
- ⬜ Rodapé unificado (links whitepaper, GitHub, Discussions, status) nas duas telas
- ⬜ nginx: NÃO injetar os scripts v2w (analytics/i18n/contact-widget/cookie-bar) nas páginas `/app` (o sub_filter do vhost compartilhado injeta hoje; a cookie bar chega a interceptar o botão de conectar)
- ⬜ Considerar renderizar a landing dentro do próprio Next (rota `/`) para header/rodapé realmente compartilhados

## Backend & dados

- ✅ Backend publicado em `voltchainhub.org/api` (container no consolidado)
- ✅ /api/preferences/stats consumido pelo card de governança (dados reais)
- ✅ NetworkStats consumindo `/api/metrics` (deviceCount, LuzToken supply corrigido para raw int)
- ⬜ StatsGrid ainda com mocks (trocar por dados reais quando houver fonte)
- ⬜ Publicar preferences reais conforme prosumidores usam o app

## Contratos & on-chain

- ✅ Deploy + verify Amoy; smoke tests device/mint, marketplace (fee 0,5%), escrow (settle)
- ⬜ Redesenho do fluxo buyer-funded do escrow (backend signer age como buyer hoje)
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
- ⬜ Deploy do app: purge total do Cloudflare após cada deploy (senão 404 cacheado nos chunks _next)
