# Parecer técnico (draft): REN 1000/2021, Lei 14.300/2022 e o marketplace P2P tokenizado do VoltchainHub

> **Status:** rascunho de pesquisa (issue [#5](https://github.com/viniciusvj/voltchainhub/issues/5)), elaborado pela equipe do projeto.
> **Este documento NÃO é parecer jurídico assinado.** É o levantamento técnico-regulatório que servirá de base para revisão por profissional de direito regulatório elétrico. Conclusões marcadas com nível de confiança. Onde há dúvida sobre artigo exato, isso está sinalizado em vez de citado com falsa precisão.
> **Compromisso de honestidade:** o critério da issue é parecer honesto, não advocacy. Este draft conclui que a premissa original do whitepaper ("opera inteiramente dentro da REN 1000, não requer nova regulamentação") é **otimista demais** na parte do mercado secundário. Detalhes abaixo.

---

## 0. Resumo executivo

1. O marco relevante é mais amplo que a REN 1000/2021: a espinha dorsal da geração distribuída (GD) é a **Lei 14.300/2022** (Marco Legal da Micro e Minigeração Distribuída), regulamentada pela **REN 1.059/2023**, que incorporou as regras de GD ao corpo da REN 1000/2021. Qualquer análise citando só a REN 1000 está incompleta.
2. **O que é sólido:** tokenizar a *leitura assinada* (LuzToken como recibo de kWh verificado) e usar o protocolo como camada de *medição, telemetria e liquidação financeira privada* não invade competência da ANEEL. Confiança: alta.
3. **O que é frágil:** um mercado secundário líquido e aberto de "direito econômico sobre o crédito de compensação" se aproxima materialmente de **comercialização de energia**, atividade restrita a agentes autorizados (ANEEL/CCEE), e o consumidor residencial (Grupo B) ainda não pode operar no mercado livre. A tese "tokenizamos o direito econômico, não a energia" é criativa mas não testada; a ANEEL tende a olhar a substância econômica, não o rótulo. Confiança na tese sem estrutura adicional: baixa a média.
4. **Caminho defensável recomendado:** operar o P2P dentro das figuras que a Lei 14.300 já permite (**geração compartilhada** via consórcio/cooperativa/condomínio e **autoconsumo remoto**), usando o VoltchainHub como camada de rateio, medição e acerto financeiro interno entre participantes do mesmo arranjo. O token liquida o acerto entre membros; a alocação de créditos continua sendo a registrada na distribuidora. Confiança: alta.
5. **Rota institucional:** buscar enquadramento em ambiente experimental (sandbox regulatório da ANEEL / projetos-piloto de P&D) antes de qualquer operação aberta ao público.

## 1. Posição atual do marco (o que os textos dizem)

**Lei 14.300/2022** cria o Sistema de Compensação de Energia Elétrica (SCEE) em lei, define microgeração (até 75 kW) e minigeração distribuída, e consagra:

- Créditos de energia com validade de **60 meses**.
- Modalidades: autoconsumo local, **autoconsumo remoto** (mesma titularidade), **geração compartilhada** (consórcio, cooperativa, condomínio civil voluntário ou edilício) e múltiplas unidades consumidoras.
- Alocação de créditos entre unidades participantes por **percentuais previamente cadastrados na distribuidora**, alteráveis mediante solicitação do titular (a periodicidade de alteração é operacionalizada pela distribuidora; verificar prazo exato na REN 1.059/2023 antes de desenhar produto).
- Regra de transição de custeio de rede (o "Fio B", escalonado 2023-2028) para novos entrantes.

**REN 1000/2021** consolida as regras de fornecimento e relacionamento com a distribuidora; após a REN 1.059/2023, contém também o capítulo operacional da GD/SCEE. Ela regula *como* créditos são apurados, alocados e compensados na fatura.

**O que NENHUM dos textos prevê:** venda direta de crédito de compensação entre consumidores fora das modalidades acima. Não há proibição nominal de "P2P", mas o silêncio não é permissão: o setor elétrico é regime de serviço público regulado, e comercialização de energia é atividade tipificada que exige autorização (Lei 9.074/1995 e regulamentação ANEEL/CCEE do mercado livre).

## 2. "Tokenizamos o direito econômico, não a energia": isso se sustenta?

Argumento do whitepaper (§5.4): a compensação permanece na distribuidora; o LuzToken representaria só o direito econômico sobre o crédito, então não haveria comercialização de energia.

Análise honesta, em dois cenários:

**Cenário A: circuito fechado dentro de geração compartilhada.** Os participantes já integram o mesmo arranjo jurídico (cooperativa/consórcio/condomínio). Os percentuais de alocação na distribuidora são o instrumento oficial; o token só organiza o acerto financeiro interno e a auditoria de medição. Aqui a tese se sustenta bem: o que se negocia é obrigação civil entre cotistas de um arranjo lícito, não energia. **Defensável.**

**Cenário B: mercado aberto, qualquer prosumidor vende a qualquer vizinho.** Para o comprador realizar o valor do token, o crédito precisa aparecer na fatura dele, o que exige mudança de alocação na distribuidora fora de um arranjo de geração compartilhada do qual ele participe. Ou seja: ou o token não entrega o kWh prometido (vira derivativo de liquidação duvidosa), ou entrega através de reengenharia contínua de cadastros que a distribuidora pode legitimamente recusar. Em substância econômica, isso é um mercado de energia varejista paralelo. A ANEEL e a CCEE historicamente caracterizam pela substância. **Risco alto de descaracterização; não recomendado sem sandbox ou mudança regulatória** (a abertura do mercado livre para baixa tensão, em discussão legislativa, mudaria esse quadro).

## 3. Obrigações da distribuidora e leitura on-chain paralela

A medição fiscal continua sendo a da distribuidora; nada na REN 1000 impede o consumidor de instalar medição própria adicional atrás do medidor. O nó VoltchainHub não interfere no equipamento da concessionária (vedado), não altera faturamento e não cria obrigação nova para a distribuidora. A assinatura on-chain de leituras próprias é juridicamente inerte perante a distribuidora: vale como prova privada entre as partes do protocolo. Confiança: alta. Ponto de atenção: qualquer instalação no padrão de entrada deve respeitar as normas técnicas da distribuidora local.

## 4. CVM e BCB: onde pousam os tokens

- **LuzToken (recibo de kWh):** pelo Parecer de Orientação CVM nº 40/2022, token é valor mobiliário se houver esforço de terceiros + expectativa de lucro (teste Howey abrasileirado). Um recibo 1:1 de kWh verificado, sem promessa de valorização, sem pool de rendimento e sem revenda especulativa incentivada pelo emissor, tende a ficar fora da competência da CVM (token de utilidade/recibo). **Mas**: se o marketplace aberto do Cenário B existir e o projeto promover o token como algo que se compra barato e se vende caro, a análise muda. O design token-agnostic (sem token especulativo próprio, fee fixo de 0,5%) ajuda concretamente aqui.
- **Stablecoins recebidas (BRZ, USDC etc.):** são ativos virtuais sob a Lei 14.478/2022. Quem presta serviço de intermediação/custódia/troca profissionalmente é **VASP** e dependerá de autorização do BCB conforme a regulamentação em implantação (processo de consulta pública do BCB em 2024/2025; verificar estágio atual antes do launch). Um protocolo não custodial com swap on-chain via Uniswap reduz, mas não elimina, a discussão de enquadramento do operador do frontend/orquestrador.
- **Off-ramp PIX:** terceirizado (Transfero, Ripio, Mercado Bitcoin), que já são instituições reguladas/em regularização. Manter o protocolo fora do fluxo fiat é decisão correta e deve ser preservada.

## 5. Comparado internacional (o que dá para aprender)

- **Reino Unido:** pilotos P2P (ex.: trials com Ofgem em regime de derogação/sandbox regulatório). Lição: foi via sandbox, não via interpretação criativa do marco vigente.
- **Austrália (Power Ledger):** operou em projetos com utilities parceiras (ex.: RENeW Nexus), sempre com a distribuidora dentro do arranjo e liquidação nas faturas dela. Lição: a distribuidora como parceira, não como camada a contornar.
- **Portugal/UE:** a Diretiva (UE) 2019/944 cria as figuras de **comunidades de energia** e autoconsumo coletivo, transpostas em Portugal (regime do autoconsumo coletivo/CERs); a Cleanwatts opera dentro dessa figura. Lição: onde P2P prosperou, houve figura jurídica própria. No Brasil, a figura funcionalmente mais próxima é a geração compartilhada da Lei 14.300, o que reforça o Cenário A como rota.

## 6. Risco regulatório residual e migração ordenada

Riscos mapeados, do mais provável ao menos:

1. **Descaracterização do mercado aberto como comercialização não autorizada** (Cenário B): mitigação = lançar apenas Cenário A + sandbox.
2. **Distribuidoras dificultarem alterações frequentes de alocação de créditos:** mitigação = janelas de realocação alinhadas ao ciclo de faturamento, e rateio interno financeiro (token) absorvendo a diferença entre alocação cadastrada e consumo real.
3. **Enquadramento VASP do operador do marketplace:** mitigação = arquitetura não custodial + acompanhamento da regulamentação BCB + jurídico antes do mainnet.
4. **Mudança adversa de regras do SCEE** (revisões periódicas): mitigação = o protocolo não depende do subsídio; precifica o crédito como ele estiver.

**Plano de migração ordenada** (se a ANEEL se opuser a qualquer componente): (i) suspender transferibilidade do LuzToken (vira recibo não transferível; o contrato já deve prever esse modo), (ii) manter medição assinada e rateio interno em arranjos de geração compartilhada, que são incontroversos, (iii) reapresentar o caso via sandbox/P&D com dados do piloto. O design do produto deve nascer com esse "modo de recuo" implementado, não prometido.

## 7. Recomendações objetivas ao projeto

1. **Corrigir o whitepaper §5.4:** trocar "não requer nova regulamentação" por descrição dos dois cenários deste parecer; incluir Lei 14.300/2022 e REN 1.059/2023 nas referências normativas.
2. **Piloto MG (fase 2) estruturado como geração compartilhada** (cooperativa ou consórcio entre os 10 prosumidores) com CNPJ e percentuais registrados na distribuidora local (CEMIG): isso torna o piloto regulatoriamente trivial.
3. Implementar no contrato LuzToken o **modo não transferível** (kill switch de transferibilidade) descrito no §6.
4. Antes de qualquer marketplace aberto: protocolo de consulta formal à ANEEL e/ou inscrição em sandbox regulatório.
5. Submeter este draft a **revisão por advogado(a) de direito regulatório elétrico** e registrar o aceite/discordância em PR. Este documento só sai do status "draft" com essa assinatura.

## 8. Referências normativas e leituras

- Lei nº 14.300/2022 (Marco Legal da Micro e Minigeração Distribuída, SCEE)
- REN ANEEL nº 1.000/2021 (regras de fornecimento, consolidada)
- REN ANEEL nº 1.059/2023 (regulamenta a Lei 14.300 e incorpora GD à REN 1000)
- Lei nº 9.074/1995 (regime de concessões e autorização de comercialização)
- Parecer de Orientação CVM nº 40/2022 (criptoativos como valores mobiliários)
- Lei nº 14.478/2022 (marco dos ativos virtuais; competência do BCB)
- Diretiva (UE) 2019/944 (mercado interno de eletricidade; comunidades de energia)
- Leituras secundárias sugeridas ao revisor: notas técnicas ANEEL do processo da REN 1.059/2023, estudos ABRADEE sobre GD e materiais públicos dos pilotos Power Ledger (RENeW Nexus) e Cleanwatts.
