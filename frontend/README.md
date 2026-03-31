# ⚡ VoltChainHub Frontend

Dashboard Web para o protocolo de energia descentralizada P2P.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **TailwindCSS** — Dark mode default
- **Wagmi v2 + Viem** — Web3 integration
- **RainbowKit** — Wallet connection
- **Polygon Mumbai** testnet (mainnet ready)

## Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Dashboard — saldo LuzToken, preço de mercado, gráficos de energia |
| `/market` | Marketplace — order book, compra/venda, gráfico de preços |
| `/devices` | Dispositivos — listar/registrar ESP32-S3, saúde, leituras |
| `/trades` | Trades — escrows ativos, histórico, wizard de nova trade |
| `/profile` | Perfil — wallet, portfólio, stats do prosumidor |

## Setup

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:3000`

## Design

- **Azul elétrico** `#0066FF` + **Amarelo solar** `#FFB800`
- Dark mode como padrão
- Mobile-first, pt-BR
- Loading states + Error boundaries

## Contratos

ABIs placeholder em `src/contracts/abis/` — substituir pelos ABIs reais após deploy dos contracts.
