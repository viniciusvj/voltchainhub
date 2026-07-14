# ⚡ VoltChainHub Frontend

Dashboard Web para o protocolo de energia descentralizada P2P.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **TailwindCSS** — Dark mode default
- **Wagmi v2 + Viem** — Web3 integration
- **RainbowKit** — Wallet connection
- **Polygon Amoy** testnet (chainId 80002)

## Deploy (GitHub Pages, mesma página do site)

O app é publicado como static export dentro de `../docs/app`, então vive no mesmo
GitHub Pages do site/whitepaper: https://viniciusvj.github.io/voltchainhub/app/

`next.config.js` usa `output:'export'` + `basePath /voltchainhub/app`. Para atualizar
(Node 22 via fnm, a partir de `frontend/`):

```bash
rm -rf out && npm run build          # gera out/ com basePath /voltchainhub/app
rm -rf ../docs/app && mkdir -p ../docs/app && cp -r out/* ../docs/app/
git add ../docs/app && git commit -m "..." && git push   # Pages redeploya sozinho
```

`docs/.nojekyll` já existe (necessário para o Pages servir a pasta `_next`).
Dev local no root: `NEXT_PUBLIC_BASE_PATH='' npm run dev`.

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
