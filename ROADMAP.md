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
- 🔵 Link app → home (logo e "Voltar ao site" no sidebar do app)
- ⬜ Header/identidade visual compartilhados (mesma paleta azul elétrico/amarelo solar, logo, tipografia) entre landing e app
- ⬜ CTA contextual: botões da landing ("Registrar dispositivo", "Ver mercado") entrando direto na rota certa do app (`/app/devices`, `/app/market`)
- ⬜ Estado de conexão de carteira visível/consistente ao navegar entre landing e app
- ⬜ Barra/aviso "testnet Amoy" comum às duas
- ⬜ Rodapé unificado (links whitepaper, GitHub, Discussions, status) nas duas telas
- ⬜ Considerar renderizar a landing dentro do próprio Next (rota `/`) para header/rodapé realmente compartilhados, ou um componente de header comum embutido via include no `index.html`

## Backend & dados

- ✅ /api/preferences/stats consumido pelo card de governança
- ⬜ Trocar mocks de NetworkStats/StatsGrid por `/api/metrics` (corrigir supply do LuzToken formatado com 18 decimais; ERC-1155 é raw int)
- ⬜ Publicar preferences reais conforme prosumidores usam o app

## Contratos & on-chain

- ✅ Deploy + verify Amoy; smoke tests device/mint, marketplace (fee 0,5%), escrow (settle)
- ⬜ Redesenho do fluxo buyer-funded do escrow (backend signer age como buyer hoje)
- ⬜ Deploy mainnet (exige autorização dupla do Vinicius)

## Firmware & hardware

- ✅ Design doc `docs/design/firmware-esp32s3.md` (issue #4)
- ⬜ Bring-up ESP-IDF (sampling + CBOR + assinatura ATECC608B)

## Regulatório & comunidade

- ✅ Parecer ANEEL draft (`docs/regulatory/parecer-ANEEL-REN-1000.md`, issue #5)
- ✅ Discussion #6 chamando revisores embedded e regulatório
- ⬜ Whitepaper §5.4 revisado por profissional de direito regulatório
- ⬜ Growth: thread técnica no X com a testnet ao vivo

## Infra & DevOps

- ✅ CI (contracts + backend) + amoy-health semanal
- ⬜ Automatizar/documentar o rebuild do container `voltchainhub-api`
- ⬜ Domain allowlist do WalletConnect (verificar voltchainhub.org no Reown)
