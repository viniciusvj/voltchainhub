# Contribuindo com o VoltchainHub

Obrigado pelo interesse! VoltchainHub é um projeto aberto e toda contribuição — código, documentação, pesquisa, feedback regulatório — é bem-vinda.

## Onde contribuir

| Área | O que precisa | Skills úteis |
|------|---------------|--------------|
| **Firmware ESP32-S3** | Driver CT sensor, comunicação PLC HomePlug, TrustZone/ECDSA | C/C++, ESP-IDF, embedded security |
| **OpenEMS drivers** | Suporte a inversores brasileiros (WEG, Fronius, Growatt, Deye) | Java 17, OpenEMS bundle structure |
| **Smart contracts** | LuzToken (ERC-1155), mercado P2P, oracle de energia | Solidity 0.8+, Hardhat, testes |
| **S2 Protocol** | Adaptadores BR (tarifa branca, REN 1000, distribuidoras) | Python/Rust, S2 IEC 62746-10-3 |
| **Frontend** | Dashboard prosumidor, marketplace, onboarding | Next.js 14, Wagmi v2, TypeScript |
| **Research/Policy** | Análise ANEEL REN 1000, modelagem tarifária, compliance | Direito regulatório, economia energética |
| **Pilotos** | Prosumidores em Minas Gerais dispostos a testar | Solar instalado, ~R$ 500 em hardware |

## Como começar

1. Leia o [Whitepaper v0.1](./VoltchainHub-Whitepaper-v0.1.md) até o fim
2. Abra uma **Discussion** (não Issue) se for proposta de design
3. Abra uma **Issue** para bug concreto ou feature específica com escopo claro
4. Forke, crie branch `feat/<descrição-curta>`, abra PR

## Fluxo de PR

- Um PR = um tema. Se estiver misturando firmware + contratos, divida.
- Descreva o porquê, não só o quê. Problema → solução → trade-offs.
- Testes obrigatórios para: smart contracts (Hardhat test), OpenEMS bundles (JUnit), firmware crítico (unity).
- CI deve passar. Se quebrar, arrume antes de pedir review.
- Commits descritivos, em inglês ou português — escolha um e mantenha.

## Estilo

- **Código:** segue o padrão da linguagem (Prettier JS/TS, `gofmt`, `cargo fmt`, `clang-format`).
- **Contratos:** Solidity 0.8.x, NatSpec obrigatório em funções públicas.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org) — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.

## Código de conduta

Leia e siga o [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). Tolerância zero com abuso, spam ou comportamento extrativo.

## Licença das suas contribuições

Ao submeter um PR, você concorda que suas contribuições serão licenciadas sob **Apache 2.0** (a mesma do projeto). Você mantém os direitos autorais; só está licenciando o uso.

## Segurança

Vulnerabilidades **não** vão em Issue público. Veja [SECURITY.md](./SECURITY.md) para o processo de disclosure responsável.

## Contato

- **Discussions:** https://github.com/viniciusvj/voltchainhub/discussions
- **Issues:** https://github.com/viniciusvj/voltchainhub/issues

Energia livre começa com código livre. Bem-vindo.
