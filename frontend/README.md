# ⚡ VoltChainHub Frontend

Dashboard Web para o protocolo de energia descentralizada P2P.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **TailwindCSS**: Dark mode default
- **Wagmi v2 + Viem**: Web3 integration
- **RainbowKit**: Wallet connection
- **Polygon Amoy** testnet (chainId 80002)

## Deploy

Produção: **https://voltchainhub.org/app/** (servido pelo consolidado, docroot
`/opt/consolidado/frontend-voltchainhub`, mount `:/var/www/voltchainhub`). O app é
static export (`output:'export'` + `basePath /app`).

Atualizar (Node 22 via fnm, a partir de `frontend/`; `MSYS_NO_PATHCONV=1` evita o
Git Bash mangler o `/app`):

```bash
rm -rf out && MSYS_NO_PATHCONV=1 npm run build     # out/ com basePath /app
# deploy consolidado (não apaga index.html/llms/robots/sitemap de prod):
KEY=E:/Users/Vinicius/Desktop/awscustos/acesso-ssh/arrendamento.pem
ssh -i "$KEY" ec2-user@98.94.144.237 "rm -rf /opt/consolidado/frontend-voltchainhub/app && mkdir -p /opt/consolidado/frontend-voltchainhub/app"
scp -i "$KEY" -r out/* ec2-user@98.94.144.237:/opt/consolidado/frontend-voltchainhub/app/
python C:/Users/Vinicius/.claude/skills/cloudflare-api/cf.py purge voltchainhub.org --url https://voltchainhub.org/app/
# espelhar no repo (docs/app é a cópia versionada):
rm -rf ../docs/app && mkdir -p ../docs/app && cp -r out/* ../docs/app/ && git add ../docs/app && git commit && git push
```

O link "App" no nav/hero da home de prod já existe (editado in-place; NÃO clobbear
o index.html de prod, que tem SEO/schema.org próprio). Dev local: `NEXT_PUBLIC_BASE_PATH='' npm run dev`.
O github.io/voltchainhub é só mirror; pra ele use `NEXT_PUBLIC_BASE_PATH=/voltchainhub/app`.

## Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Dashboard: saldo LuzToken, preço de mercado, gráficos de energia |
| `/market` | Marketplace: order book, compra/venda, gráfico de preços |
| `/devices` | Dispositivos: listar/registrar ESP32-S3, saúde, leituras |
| `/trades` | Trades: escrows ativos, histórico, wizard de nova trade |
| `/profile` | Perfil: wallet, portfólio, stats do prosumidor |

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

ABIs placeholder em `src/contracts/abis/`: substituir pelos ABIs reais após deploy dos contracts.
