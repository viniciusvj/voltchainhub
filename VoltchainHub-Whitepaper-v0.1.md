# VoltchainHub — Whitepaper v0.1
## Protocolo Aberto de Energia Descentralizada para o Brasil

**Versão:** 0.1-draft | **Data:** Março 2026 | **Licença:** Apache 2.0  
**Status:** Draft público para contribuição

---

## Abstract

O Brasil caminha para 20 milhões de prosumidores solares até 2030, mas carece de infraestrutura aberta para que esses produtores troquem energia entre si. VoltchainHub é um protocolo open-source que une IoT de borda (ESP32-S3), padrões europeus de gestão energética (OpenEMS, S2 Protocol, PowerMatcher) e blockchain Polygon PoS para criar um mercado P2P de energia com custo de transação inferior a $0,001. O LuzToken (ERC-1155) tokeniza kWh como unidade de valor transferível, rastreável e auditável. O protocolo opera dentro do marco legal da ANEEL REN 1000/2021 e é o primeiro protocolo nacional de energia descentralizada totalmente open-source. A visão é simples: energia como bem comum, não commodity de monopólio.

---

## 1. O Problema

### 1.1 Energia Centralizada: Ineficiência e Custo

O modelo elétrico brasileiro é estruturalmente centralizador. Geração em usinas distantes, transmissão em linhas de alta tensão com perdas médias de 14,9% (ANEEL, 2024), distribuição por concessionárias regionais com poder de monopólio legal — e o consumidor final pagando a conta de toda essa cadeia.

A tarifa residencial média nacional ultrapassou **R$ 0,90/kWh** em 2025. Nesse valor estão embutidos: encargos setoriais (CDE, PROINFA, EER), perdas técnicas, perdas comerciais (furtos, inadimplência), custos de manutenção de infraestrutura do século XX e margem das distribuidoras. O brasileiro paga uma das tarifas mais caras do mundo em proporção à renda per capita.

O modelo funciona como um funil: energia entra no topo (grandes geradoras), percorre milhares de quilômetros, e chega ao consumidor final tributada, perdida e cara. Não há mecanismo de mercado local. Vizinhos com painéis solares não podem vender energia diretamente uns aos outros.

### 1.2 O Prosumidor Brasileiro Sem Infraestrutura

A ANEEL REN 1000/2021 criou o marco legal da geração distribuída no Brasil. Em 2025, o país já ultrapassava **5 milhões de unidades** de micro e minigeração distribuída, majoritariamente solar fotovoltaica. A projeção é alcançar 20 milhões de prosumidores até 2030.

O prosumidor brasileiro investe R$ 15.000–50.000 em um sistema solar, gera excedente de energia durante o dia e recebe em troca **créditos de energia** na distribuidora local — créditos que se expiram em 60 meses e são compensados em tarifas cheias de distribuição. Não há mercado real. Não há precificação dinâmica. Não há peer-to-peer.

O resultado: prosumidores que poderiam vender energia a **R$ 0,05–0,15/kWh** para vizinhos são obrigados a "ceder" essa energia para a distribuidora a custo zero, que a revende com toda a sua estrutura de custos.

### 1.3 Gap Tecnológico: Standards Europeus Inexplorados no Brasil

A Europa resolveu boa parte desse problema. O protocolo **S2** (IEC 62746-10-3) padroniza a comunicação entre dispositivos de energia e sistemas de controle. O **OpenEMS** conecta mais de 50 fabricantes de inversores, baterias e medidores. O **PowerMatcher** implementa mercados multi-agente de energia em tempo real.

Nenhum desses padrões foi adaptado ao contexto brasileiro. Não existe implementação nacional. Não existe protocolo open-source que una a infraestrutura de IoT com blockchain e com o marco regulatório da ANEEL.

**Esse é o gap que VoltchainHub preenche.**

---

## 2. A Visão: Luz Livre

### 2.1 Inspiração Tesla: Energia como Bem Comum

Nikola Tesla dedicou sua vida a uma ideia radical: energia deveria ser tão acessível quanto o ar. Seu projeto Wardenclyffe Tower foi destruído não por falha técnica, mas por resistência econômica — porque energia livre não tem dono, não tem monopólio, não tem tarifa.

VoltchainHub herda esse espírito. Não porque acreditamos em física impossível, mas porque acreditamos que a tecnologia de 2026 — blockchain, IoT, protocolos abertos — nos dá as ferramentas para criar o que Tesla imaginou: uma infraestrutura de energia que serve ao povo, não ao monopólio.

### 2.2 O Que "Energia Livre" Realmente Significa

"Energia livre" no contexto VoltchainHub não é violação da termodinâmica. É **liberdade de mercado**:

- **Livre para gerar** — qualquer pessoa pode instalar geração e participar do protocolo
- **Livre para vender** — sem intermediário obrigatório entre produtor e consumidor
- **Livre para auditar** — todo código, todo contrato, toda transação é pública e verificável
- **Livre de rent-seeking** — o protocolo não extrai valor, apenas facilita a troca

O preço de equilíbrio no mercado P2P VoltchainHub converge para o custo marginal real de produção — próximo de zero para solar durante o dia. Esse é o "livre" que importa.

### 2.3 Princípios do Protocolo

1. **Abertura total** — Apache 2.0, nenhum componente proprietário obrigatório
2. **Soberania do dado** — medições ficam no dispositivo do prosumidor; blockchain registra apenas hashes e saldos
3. **Composabilidade** — cada camada pode ser substituída; o protocolo não impõe lock-in
4. **Neutralidade de rede** — o protocolo não favorece nenhum prosumidor, região ou tamanho de instalação
5. **Conformidade regulatória** — opera dentro da ANEEL REN 1000, não contra ela
6. **Progressividade** — começa simples (créditos tokenizados), evolui para mercado totalmente autônomo

---

## 3. Arquitetura Técnica

### 3.1 Visão Geral das Camadas

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND  │  Dashboard Web (React) + App Mobile           │
├─────────────────────────────────────────────────────────────┤
│  BLOCKCHAIN│  Polygon PoS — LuzToken, DeviceRegistry,      │
│            │  EnergyOracle, EnergyVault                    │
├─────────────────────────────────────────────────────────────┤
│  PROTOCOLO │  S2 Protocol (CEM↔RM) + SHIP (TLS over Wi-Fi) │
├─────────────────────────────────────────────────────────────┤
│  EDGE      │  OpenEMS (Java) + PowerMatcher (market agent) │
├─────────────────────────────────────────────────────────────┤
│  HARDWARE  │  ESP32-S3 + PLC HomePlug AV + WPT local       │
└─────────────────────────────────────────────────────────────┘
```

Cada camada é independente e substituível. Um prosumidor pode participar do protocolo com apenas um medidor ESP32-S3 conectado ao inversor solar via Modbus. A evolução para WPT e PLC é opcional e incremental.

### 3.2 Camada Hardware: ESP32-S3 + PLC + WPT

**ESP32-S3 — O Nó de Medição**

O ESP32-S3 é o coração do dispositivo VoltchainHub. Com núcleo Xtensa LX7 dual-core a 240 MHz, 8MB PSRAM e suporte a ARM TrustZone via extensões de segurança, é o microcontrolador mais capaz da família Espressif no segmento de custo (< $5 USD).

Funções no protocolo:
- Leitura de medidores via **Modbus RTU/TCP** (compatível com 90%+ dos inversores brasileiros)
- Assinatura criptográfica de leituras com **ECDSA P-256** usando chave privada armazenada em memória protegida (eFuse + TrustZone)
- Publicação de telemetria via **MQTT over TLS** para o edge node local
- Capacidade de operação offline com buffer de 72h (SPIFFS)

**PLC HomePlug AV — Transmissão pela Rede Elétrica**

O HomePlug AV utiliza a própria fiação elétrica como meio de transmissão. Eficiência de até **88%** na transmissão de dados/comandos pelo cabo. Permite comunicação entre medidores sem infraestrutura adicional de rede — especialmente relevante para condomínios e microrredes industriais.

No contexto VoltchainHub, o PLC serve como backbone de comunicação local entre nós da microrrede, complementando (não substituindo) Wi-Fi/Ethernet onde disponível.

**WPT — Transferência de Energia por Indução Ressonante**

Para ambientes de curta distância (< 5m), o protocolo suporta transferência de energia por acoplamento ressonante magnético, com eficiência de **72%**. Aplicação primária: carregamento de dispositivos IoT da microrrede sem fio físico, reduzindo pontos de falha e manutenção.

### 3.3 Camada Edge: OpenEMS + PowerMatcher

**OpenEMS — Sistema de Gestão Energética**

OpenEMS (Open Energy Management System) é um framework Java open-source desenvolvido originalmente pela FENECON GmbH, hoje mantido por uma comunidade global. Compatível com **50+ fabricantes** de inversores, baterias, medidores e controladores (Fronius, SMA, Huawei, BYD, Victron, entre outros presentes no mercado brasileiro).

No VoltchainHub, o OpenEMS roda no edge node (Raspberry Pi 4 ou equivalente ARM) e executa:
- Coleta de telemetria de todos os dispositivos da microrrede local
- Execução de estratégias de controle (carga/descarga de bateria, despacho de excedente)
- Exposição de dados via REST API e WebSocket para o agente PowerMatcher
- Interface com o contrato EnergyOracle via serviço de oracle

**PowerMatcher — Mercado Multi-Agente**

PowerMatcher implementa um algoritmo de market clearing descentralizado. Cada dispositivo de energia (gerador, bateria, carga flexível) age como um **agente autônomo** que publica curvas de oferta/demanda. O concentrador (auctioneer) calcula o preço de equilíbrio local a cada **5 minutos**.

```
Ciclo de clearing:
  1. Cada agente publica bid (curva preço × quantidade)
  2. Auctioneer agrega bids de todos os agentes
  3. Preço de equilíbrio = interseção oferta/demanda
  4. Agentes recebem sinal de despacho
  5. Resultado é commitado no contrato EnergyVault
```

Resultado: precificação dinâmica local que reflete disponibilidade real de energia, sem intermediário.

### 3.4 Camada Protocolo: S2 / SHIP

**S2 Protocol (IEC 62746-10-3)**

S2 define a interface entre o **Customer Energy Manager (CEM)** — o sistema que decide como usar a energia — e o **Resource Manager (RM)** — o dispositivo que executa. Implementado em Python (referência) e Rust (produção) no VoltchainHub.

Modelos de controle suportados:
- **FRBC** (Fill Rate Based Control) — baterias e armazenamento
- **DDBC** (Demand Driven Based Control) — cargas flexíveis
- **PEBC** (Power Envelope Based Control) — geração solar
- **OMBC** (Operation Mode Based Control) — EVs e carregadores

**SHIP (Smart Home IP)**

SHIP provê a camada de transporte segura (TLS 1.3) para comunicação local entre dispositivos. Resolve o problema de discovery e autenticação em redes residenciais sem dependência de servidor central.

### 3.5 Camada Blockchain: Contratos Inteligentes

**Rede:** Polygon PoS  
**Custo de transação:** < $0,001 por operação  
**Finalidade:** ~2 segundos  
**Framework:** Hardhat + OpenZeppelin v5

**Contratos principais:**

| Contrato | Função |
|---|---|
| `LuzToken` | ERC-1155 multitoken — cada token ID representa 1 kWh de uma fonte/período específico |
| `DeviceRegistry` | Registro e attestation de dispositivos ESP32-S3 |
| `EnergyOracle` | Recebe leituras assinadas dos edge nodes e as valida on-chain |
| `EnergyVault` | Escrow de transações P2P — bloqueia tokens até confirmação de entrega |

### 3.6 Diagrama de Fluxo Completo

```
[Painel Solar] → [Inversor] → [ESP32-S3]
                                    │
                              Modbus RTU
                                    │
                              [OpenEMS Edge]
                                    │
                         S2 Protocol / SHIP
                                    │
                          [PowerMatcher Agent]
                                    │
                           5-min market clearing
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
              [Comprador]                     [Vendedor]
                    │                               │
              EnergyVault.lock()           LuzToken.mint()
                    │                               │
              [Entrega de energia]          [Confirma entrega]
                    │                               │
              EnergyVault.release()        LuzToken.transfer()
                    │
              [Saldo atualizado on-chain]
```

---

## 4. LuzToken — Modelo Econômico

### 4.1 Tokenomics (ERC-1155)

**Padrão:** ERC-1155 (multitoken)  
**Razão do ERC-1155:** Permite que cada kWh carregue metadados de fonte (solar/eólico/bateria), timestamp e localização do gerador — essencial para certificados de energia renovável e rastreabilidade.

**Supply:** LuzToken não tem supply fixo. Tokens são **mintados** na medida em que energia é medida e verificada, e **queimados** quando energia é consumida. O supply total reflete o estoque verificado de energia disponível no protocolo.

**Distribuição de tokens por transação:**
```
100 kWh gerados e verificados
  └─ 98 kWh → LuzToken para o prosumidor vendedor
  └─  1 kWh → Treasury do protocolo (fee de 1%)
  └─  1 kWh → Pool de liquidez para equalização de rede
```

**Token IDs** são determinísticos:
```
tokenId = keccak256(deviceAddress, timestamp_slot, sourceType)
```
Isso permite queries eficientes por fonte, período e origem geográfica.

### 4.2 Ciclo de Vida de uma Transação Energética

```
1. GERAÇÃO
   Prosumidor A gera 10 kWh excedentes às 13h
   → ESP32-S3 mede, assina com ECDSA
   → OpenEMS envia leitura assinada ao EnergyOracle

2. VERIFICAÇÃO
   EnergyOracle valida assinatura + consistência histórica
   → Se válido: emite evento ReadingVerified
   → LuzToken.mint(prosumidorA, 9.9 kWh) // 1% fee retido

3. OFERTA
   PowerMatcher agent de A publica bid:
   "10 kWh disponíveis @ R$0,08/kWh"

4. MATCHING
   PowerMatcher clearing encontra comprador B:
   "5 kWh demandados @ até R$0,12/kWh"
   Preço de equilíbrio: R$0,10/kWh

5. ESCROW
   EnergyVault.lock(comprador=B, vendedor=A, amount=5, price=0.10)
   Tokens de A bloqueados; MATIC de B bloqueados

6. ENTREGA
   Energia flui fisicamente (rede distribuidora como carrier)
   Após 5 min, OpenEMS de B confirma recebimento

7. LIQUIDAÇÃO
   EnergyVault.release()
   → 5 LuzToken transferidos A→B (e queimados pelo B)
   → MATIC transferido B→A
   → Evento TransactionSettled emitido
```

Tempo total do ciclo: ~7 minutos (5 min de ciclo PowerMatcher + ~2 min blockchain)

### 4.3 Precificação P2P via PowerMatcher

O preço P2P é determinado pelo mercado local, não por tabela. Referências de ancoragem:

| Referência | R$/kWh |
|---|---|
| Tarifa distribuidora (piso do comprador) | ~0,90 |
| Preço P2P esperado (equilíbrio) | 0,05–0,15 |
| Custo marginal solar residencial | ~0,02–0,05 |
| Fee do protocolo | 1% do valor transacionado |

O comprador sempre paga menos que a tarifa da distribuidora. O vendedor sempre recebe mais que o custo marginal. O protocolo captura apenas 1% para sustentabilidade.

### 4.4 Sustentabilidade do Protocolo (Fees, Treasury)

**Fontes de receita do protocolo:**
- 1% de fee sobre toda energia transacionada (retida como LuzToken no treasury)
- Opcional: fee de registro de dispositivo (cobertura de custo de audit on-chain)

**Destino do treasury:**
- 60% → Desenvolvimento e manutenção do protocolo
- 25% → Grants para contribuidores open-source
- 15% → Fundo de emergência (bugs críticos, auditorias)

A partir da **Fase 3**, o treasury é controlado pela DAO. Antes disso, por multisig 3/5.

---

## 5. Segurança e Confiança

### 5.1 Device Attestation (TrustZone + ECDSA)

O maior vetor de ataque em um sistema de energia tokenizada é a **fraude de medição** — um dispositivo que reporta mais energia do que gerou. O VoltchainHub endereça isso em múltiplas camadas:

**Camada 1 — Hardware Security:**
- Chave privada ECDSA P-256 gerada durante provisionamento no ESP32-S3
- Chave armazenada em eFuse (one-time programmable, não legível por software)
- TrustZone separa execução de assinatura do firmware principal

**Camada 2 — Attestation On-Chain:**
- Durante registro, o dispositivo assina um challenge do contrato `DeviceRegistry`
- A chave pública é registrada on-chain vinculada ao endereço do proprietário
- Cada leitura subsequente inclui assinatura + nonce sequencial (previne replay attacks)

**Camada 3 — Validação Estatística:**
- `EnergyOracle` mantém histórico de leituras por dispositivo
- Anomalias (pico súbito, padrão impossível) geram flag e revisão manual
- Threshold configurável por tipo de instalação (residencial vs. industrial)

### 5.2 Oracle Security Model

O `EnergyOracle` é o ponto crítico de confiança entre o mundo físico e a blockchain. O design segue o princípio de **minimização de confiança**:

- **Multi-oracle:** Pelo menos 3 oracles independentes devem concordar para mint de tokens acima de 100 kWh
- **Stake de operador:** Operadores de oracle fazem stake em MATIC — comportamento malicioso resulta em slash
- **Janela de contestação:** 30 minutos após cada leitura para contestação por qualquer participante com evidência
- **Fallback:** Se oracle principal offline > 15 min, ciclo de clearing é pausado (sem perda, sem fraude)

### 5.3 Smart Contract Audit Approach

Antes do deploy em mainnet (Fase 2), todos os contratos passam por:

1. **Análise estática automatizada** — Slither, MythX
2. **Testes de fuzzing** — Echidna para invariantes críticos (supply conservation, vault balance)
3. **Revisão de código por pares** — mínimo 2 revisores externos
4. **Audit profissional** — mínimo 1 firma de auditoria reconhecida antes de Fase 3
5. **Bug bounty público** — programa ativo a partir da Fase 2

Todos os resultados de auditoria são publicados no repositório público.

### 5.4 Regulatório: Como Opera Dentro da ANEEL REN 1000

VoltchainHub **não substitui** a distribuidora — ela ainda é obrigada por lei. O protocolo opera na camada de **liquidação financeira** e **otimização de uso** dos créditos de compensação.

**Modelo de compatibilidade:**

```
Prosumidor A gera excedente
  → Injeta na rede da distribuidora (como sempre, conforme REN 1000)
  → Distribuidora credita kWh na conta
  → VoltchainHub tokeniza esse crédito como LuzToken
  → Prosumidor pode vender LuzToken para vizinhos
  → Vizinhos usam LuzToken para abater suas próprias faturas
```

Esse modelo opera inteiramente dentro do sistema de compensação da REN 1000. Não requer nova regulamentação. Não contorna a distribuidora — usa ela como infraestrutura de transmissão.

**Para transações diretas em microrredes isoladas** (condomínios com sistema próprio, comunidades off-grid): o protocolo pode operar em modo autônomo, mas requer autorização específica da ANEEL como autoprodução. O VoltchainHub mantém documentação jurídica de suporte para esse caso de uso.

---

## 6. Roadmap

### Fase 1 — MVP Técnico (30 dias)
- [ ] Firmware ESP32-S3: leitura Modbus + assinatura ECDSA + MQTT
- [ ] Contratos Solidity: LuzToken, DeviceRegistry, EnergyOracle (testnet Polygon Mumbai)
- [ ] OpenEMS adapter: publicação de leituras para oracle
- [ ] PowerMatcher: instância local com 2 agentes simulados
- [ ] Dashboard básico: saldo LuzToken, histórico de transações
- **Critério de sucesso:** Transação end-to-end simulada com hardware real

### Fase 2 — Piloto 10 Prosumidores MG (90 dias)
- [ ] Deploy em 10 residências na Região Metropolitana de BH
- [ ] Integração com 3 modelos de inversores populares no Brasil (Fronius, Growatt, Deye)
- [ ] Contratos em Polygon mainnet com valor real
- [ ] Análise estatística de fraude em produção
- [ ] Relatório técnico público de resultados
- **Critério de sucesso:** ≥ 500 kWh transacionados P2P com latência < 10 min

### Fase 3 — Protocolo Público + DAO (180 dias)
- [ ] Auditoria de segurança por firma externa
- [ ] Deploy de governança Aragon OSx
- [ ] SDK público (TypeScript + Python) para integradores
- [ ] Documentação completa (pt-BR + en)
- [ ] Programa de grants para contribuidores
- [ ] Integração com SHIP protocol para discovery automático
- **Critério de sucesso:** ≥ 3 integradores independentes usando o protocolo

### Fase 4 — 1000 Nós Ativos (1 ano)
- [ ] 1000+ dispositivos registrados on-chain
- [ ] Expansão para 5 estados brasileiros
- [ ] Parceria com pelo menos 1 distribuidora piloto
- [ ] Mercado de certificados de energia renovável sobre LuzToken
- [ ] Bridge para outros protocolos de energia (Energy Web Chain)
- **Critério de sucesso:** ≥ 100.000 kWh mensais transacionados no protocolo

---

## 7. Diferenciais Competitivos

### vs. Energia Centralizada

| Dimensão | Distribuidora Atual | VoltchainHub P2P |
|---|---|---|
| Preço ao comprador | R$ 0,90/kWh | R$ 0,05–0,15/kWh |
| Receita ao vendedor | R$ 0,00 (crédito) | R$ 0,05–0,15/kWh |
| Transparência | Opaca | 100% on-chain |
| Latência de liquidação | 30 dias (fatura) | ~7 minutos |
| Acesso | Monopólio regional | Permissionless |

### vs. Outros Protocolos Blockchain de Energia

| Protocolo | País | Open-Source | Brasil-ready | P2P Real | Custo/tx |
|---|---|---|---|---|---|
| **VoltchainHub** | Brasil | ✅ Apache 2.0 | ✅ REN 1000 | ✅ | < $0,001 |
| Power Ledger | Austrália | ❌ | ❌ | ✅ | ~$0,01 |
| WePower | Lituânia | ❌ | ❌ | Parcial | ~$0,05 |
| Energy Web | EUA/Global | Parcial | ❌ | ❌ | ~$0,001 |
| Nexo (CPFL) | Brasil | ❌ | ✅ | ❌ | N/A |

O VoltchainHub é o único protocolo totalmente open-source, construído desde o início para o mercado brasileiro, com custo de transação < $0,001.

### Por Que Brasil/LatAm Primeiro

1. **Market timing:** 5M+ prosumidores ativos, 20M previstos — janela de 5 anos para se tornar standard
2. **Sem concorrência local:** zero protocolos open-source nacionais para este nicho
3. **Marco regulatório favorável:** ANEEL REN 1000 é mais avançada que muitos países europeus em geração distribuída
4. **Irradiação solar:** Brasil tem irradiação 30–40% superior à Europa — custo marginal solar mais baixo
5. **Potencial LatAm:** Chile, Colômbia, México têm contextos similares — modelo exportável com ajustes mínimos

---

## 8. Governança

### 8.1 Open-Source (Apache 2.0)

Todo código do VoltchainHub é e sempre será Apache 2.0:
- Firmware ESP32-S3
- Contratos Solidity
- Adapters OpenEMS/PowerMatcher
- SDKs e ferramentas

Nenhuma funcionalidade core será proprietária. O modelo de negócio do ecossistema é construído sobre serviços, suporte e integração — não sobre lock-in de protocolo.

### 8.2 Fase 1: Multisig Gnosis Safe 3/5

Durante as fases iniciais (Fases 1 e 2), o treasury e upgrades de contratos são controlados por um **multisig Gnosis Safe 3-de-5** com signatários públicos e conhecidos pela comunidade. Todas as transações do treasury são visíveis on-chain.

Decisões que requerem multisig:
- Deploy de novos contratos em mainnet
- Mudanças nos parâmetros do protocolo (fee rate, thresholds)
- Movimentação de treasury acima de $1.000

### 8.3 Fase 3: DAO com Aragon OSx

Na Fase 3, a governança migra para uma DAO usando **Aragon OSx** (modular, auditado, battle-tested):

- **Token de governança:** LuzToken acumulado de participação no protocolo confere direito de voto
- **Quorum:** 10% do supply de governança para propostas regulares; 30% para upgrades críticos
- **Timelock:** 48h entre aprovação e execução de qualquer mudança de contrato
- **Veto:** Multisig fundador retém veto de emergência por 12 meses pós-DAO (sunset automático)

### 8.4 Contribuição e Comunidade

O protocolo cresce com a comunidade. Formas de contribuir:

- **Código:** PRs no GitHub — issues marcadas como `good-first-issue` para novos contribuidores
- **Hardware:** Testar com novos inversores/medidores e contribuir adapters OpenEMS
- **Pesquisa:** Simulações de mercado, otimização de algoritmos PowerMatcher
- **Documentação:** Guias de instalação, tradução, casos de uso regionais
- **Auditoria:** Revisão de contratos, análise de segurança, fuzzing

Contribuidores regulares são elegíveis a grants do treasury da DAO.

---

## 9. Equipe e Contexto

VoltchainHub é um projeto pessoal iniciado por **Vinicius**, engenheiro e desenvolvedor com foco em soberania tecnológica, descentralização e impacto social. O protocolo nasce da convicção de que tecnologia deve servir às pessoas, não a monopólios.

O protocolo não pertence a uma empresa. Pertence a uma visão: tecnologia como instrumento de libertação econômica. Hoje, quem tem painel solar está preso ao monopólio da distribuidora. Amanhã, com VoltchainHub, esse prosumidor é um nó soberano em uma rede de energia distribuída.

**Buscamos:**
- Engenheiros de firmware com experiência em ESP32 e protocolos de energia
- Desenvolvedores Solidity com foco em segurança
- Especialistas em OpenEMS/PowerMatcher
- Advogados de energia familiarizados com regulação ANEEL
- Prosumidores dispostos a ser piloto na Fase 2

Se você acredita que energia é um direito, não um privilégio de quem pode pagar R$ 0,90/kWh — **você já é parte disso.**

---

## 10. Conclusão

O Brasil está na encruzilhada energética. De um lado, uma infraestrutura centralizada do século XX, cara e ineficiente. Do outro, 5 milhões de prosumidores gerando energia limpa, travados em um sistema que não permite a troca direta entre vizinhos.

VoltchainHub é a infraestrutura que falta. Não é uma startup. Não é um produto. É um **protocolo aberto** — como o HTTP é para a web, como o Bitcoin é para o dinheiro, o VoltchainHub aspira ser para a energia distribuída brasileira.

A tecnologia existe. O marco regulatório existe. O mercado existe. O que faltava era alguém colocar as peças juntas, de forma aberta, para que qualquer pessoa possa usar, auditar e melhorar.

Essa é a missão do VoltchainHub.

**A rede começa com o primeiro nó. Seja o primeiro.**

- GitHub: `github.com/viniciusvj/voltchainhub`
- Comunidade: Discord VoltchainHub *(em breve)*
- Para pilotos Fase 2: *(em breve)*

---

## Apêndice A — Contratos Inteligentes (Interfaces Solidity)

```solidity
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

// ============================================================
// LuzToken — ERC-1155 Multitoken
// 1 token = 1 kWh verificado
// tokenId encoda: deviceId + timestamp_slot + sourceType
// ============================================================
interface ILuzToken {
    /// @notice Minta kWh verificados para um prosumidor
    /// @param to Endereço do prosumidor gerador
    /// @param tokenId Hash(deviceId, slot, source)
    /// @param amount Quantidade em Wh (1 token = 1000 Wh = 1 kWh)
    /// @param data Metadata JSON encodado (IPFS hash opcional)
    function mint(
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes calldata data
    ) external;

    /// @notice Queima tokens após consumo confirmado
    function burn(address from, uint256 tokenId, uint256 amount) external;

    /// @notice Retorna saldo de kWh disponíveis para um endereço
    function balanceOf(address account, uint256 id) external view returns (uint256);

    /// @notice Codifica tokenId a partir de parâmetros
    function encodeTokenId(
        address device,
        uint32 slot,      // slot de 5 minutos desde epoch
        uint8 sourceType  // 0=solar, 1=eolico, 2=bateria, 3=rede
    ) external pure returns (uint256);

    event TokenMinted(address indexed to, uint256 indexed tokenId, uint256 amount);
    event TokenBurned(address indexed from, uint256 indexed tokenId, uint256 amount);
}

// ============================================================
// DeviceRegistry — Registro e Attestation de Dispositivos
// ============================================================
interface IDeviceRegistry {
    struct Device {
        address owner;         // Endereço Ethereum do prosumidor
        bytes32 publicKeyX;    // Coordenada X da chave pública ECDSA P-256
        bytes32 publicKeyY;    // Coordenada Y da chave pública ECDSA P-256
        uint64  registeredAt;
        bool    active;
        string  metadata;      // IPFS CID com specs do dispositivo
    }

    /// @notice Registra novo dispositivo com prova de attestation
    /// @param deviceId Identificador único (keccak256 do serial + MAC)
    /// @param pubKeyX Coordenada X da chave pública do dispositivo
    /// @param pubKeyY Coordenada Y da chave pública do dispositivo
    /// @param attestationSig Assinatura do challenge de registro
    function registerDevice(
        bytes32 deviceId,
        bytes32 pubKeyX,
        bytes32 pubKeyY,
        bytes calldata attestationSig,
        string calldata metadata
    ) external;

    /// @notice Verifica assinatura ECDSA de uma leitura
    function verifyReading(
        bytes32 deviceId,
        bytes32 readingHash,
        bytes calldata signature
    ) external view returns (bool valid);

    /// @notice Desativa dispositivo comprometido (owner ou governance)
    function deactivateDevice(bytes32 deviceId, string calldata reason) external;

    function getDevice(bytes32 deviceId) external view returns (Device memory);

    event DeviceRegistered(bytes32 indexed deviceId, address indexed owner);
    event DeviceDeactivated(bytes32 indexed deviceId, string reason);
}

// ============================================================
// EnergyOracle — Ponte entre medição física e blockchain
// ============================================================
interface IEnergyOracle {
    struct Reading {
        bytes32 deviceId;
        uint256 wattHours;     // Energia medida em Wh
        uint64  timestamp;     // Unix timestamp da leitura
        uint32  slot;          // Slot PowerMatcher (5 min)
        bytes   signature;     // Assinatura ECDSA do ESP32-S3
    }

    /// @notice Submete leitura assinada pelo dispositivo
    /// @dev Oracle valida assinatura, consistência e emite evento
    function submitReading(Reading calldata reading) external;

    /// @notice Confirma leitura após quorum de oracles (multi-oracle mode)
    function confirmReading(bytes32 readingId, bytes calldata oracleSig) external;

    /// @notice Contesta leitura dentro da janela de 30 min
    function contestReading(bytes32 readingId, bytes calldata evidence) external;

    event ReadingSubmitted(bytes32 indexed readingId, bytes32 indexed deviceId, uint256 wh);
    event ReadingConfirmed(bytes32 indexed readingId);
    event ReadingContested(bytes32 indexed readingId, address contester);
}

// ============================================================
// EnergyVault — Escrow para transações P2P
// ============================================================
interface IEnergyVault {
    struct Trade {
        address seller;
        address buyer;
        uint256 tokenId;
        uint256 energyAmount;  // Em Wh
        uint256 pricePerKwh;   // Em MATIC (18 decimais)
        uint64  deadline;      // Expiração do escrow
        TradeStatus status;
    }

    enum TradeStatus { Pending, Locked, Delivered, Settled, Expired, Disputed }

    /// @notice Cria e bloqueia escrow para uma trade P2P
    /// @dev Requer aprovação de LuzToken pelo seller e MATIC pelo buyer
    function lockTrade(
        address seller,
        uint256 tokenId,
        uint256 energyAmount,
        uint256 pricePerKwh,
        uint64 deliveryDeadline
    ) external payable returns (bytes32 tradeId);

    /// @notice Confirma entrega de energia (chamado pelo OpenEMS do buyer)
    function confirmDelivery(bytes32 tradeId) external;

    /// @notice Liquida trade após confirmação — transfere tokens e MATIC
    function settleTrade(bytes32 tradeId) external;

    /// @notice Abre disputa para resolução manual/DAO
    function disputeTrade(bytes32 tradeId, string calldata reason) external;

    /// @notice Expira trade não confirmada após deadline
    function expireTrade(bytes32 tradeId) external;

    function getTrade(bytes32 tradeId) external view returns (Trade memory);

    event TradeLocked(bytes32 indexed tradeId, address seller, address buyer, uint256 amount);
    event TradeSettled(bytes32 indexed tradeId, uint256 energyWh, uint256 valueMatic);
    event TradeDisputed(bytes32 indexed tradeId, string reason);
}
```

---

## Apêndice B — Stack Tecnológica Completa

| Camada | Componente | Versão | Licença | Link |
|---|---|---|---|---|
| Hardware | ESP32-S3 | ESP-IDF 5.x | Apache 2.0 | espressif.com |
| Hardware | HomePlug AV | — | Spec aberta | homeplug.org |
| Edge | OpenEMS | 2024.x | LGPL 2.1 | openems.io |
| Edge | PowerMatcher | 1.2 | Apache 2.0 | github.com/flexiblepower |
| Protocolo | S2 Protocol | 1.0 | Apache 2.0 | s2standard.org |
| Protocolo | SHIP | 1.0 | Spec aberta | eebus.org |
| Blockchain | Polygon PoS | — | MIT | polygon.technology |
| Contratos | OpenZeppelin | 5.x | MIT | openzeppelin.com |
| Contratos | Hardhat | 2.x | MIT | hardhat.org |
| Segurança | Slither | latest | AGPL 3.0 | github.com/crytic |
| Governança | Aragon OSx | 1.3 | GPL 3.0 | aragon.org |
| Governança | Gnosis Safe | 1.4 | LGPL 3.0 | safe.global |
| Frontend | React + Viem | 18.x / 2.x | MIT | react.dev |

**Requisitos mínimos de hardware (nó completo):**
- Edge Node: Raspberry Pi 4 (4GB RAM) ou equivalente ARM Cortex-A72
- Medidor: ESP32-S3-WROOM-1 com sensor de corrente SCT-013
- Conectividade: Wi-Fi 2.4GHz ou Ethernet (PLC HomePlug AV como alternativa)
- Armazenamento: 32GB microSD (edge node)

---

## Apêndice C — Referências e Projetos Base

### Regulatório Brasil
- ANEEL REN 1000/2021 — Marco legal de geração distribuída
- ANEEL REN 1059/2023 — Atualização sobre sistemas de armazenamento
- MME PDE 2031 — Plano Decenal de Expansão de Energia (projeções solar)

### Padrões Técnicos
- IEC 62746-10-3 (S2 Protocol) — Customer Energy Manager interface
- IEEE 1901 (HomePlug AV) — Broadband over Power Line
- IEC 61968/61970 (CIM) — Common Information Model para energia

### Projetos Open-Source Base
- **OpenEMS** — github.com/OpenEMS/openems
- **PowerMatcher** — github.com/flexiblepower/powermatcher
- **S2 Protocol Reference** — github.com/flexiblepower/s2-ws-json
- **Hardhat** — github.com/NomicFoundation/hardhat
- **OpenZeppelin Contracts** — github.com/OpenZeppelin/openzeppelin-contracts

### Projetos de Referência no Setor
- **Energy Web Chain** — Blockchain dedicada para setor elétrico (EWF)
- **Power Ledger** — Protocolo P2P australiano (proprietário)
- **Brooklyn Microgrid** — Case LO3 Energy, Nova York
- **Pylon Network** — Protocolo europeu, Espanha

### Papers e Estudos
- IRENA (2023) — "Peer-to-Peer Electricity Trading: Innovation Landscape Brief"
- ENEA Consulting (2022) — "Blockchain for Energy: Beyond the Hype"
- ANEEL (2024) — Relatório Anual de Geração Distribuída
- Tushar et al. (2020) — "Peer-to-Peer Energy Trading in Smart Grid Networks"

---

*VoltchainHub Whitepaper v0.1 — Março 2026*  
*Licença Apache 2.0 — Livre para uso, modificação e distribuição com atribuição*  
*"A rede começa com o primeiro nó."*
