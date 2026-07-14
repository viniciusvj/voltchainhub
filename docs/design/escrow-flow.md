# Design: fluxo de escrow (EnergyVault) e o papel do buyer

> Status: decisão de arquitetura. Contexto: o `lockTrade` do EnergyVault é
> `payable` e puxa os LuzTokens do seller; quem paga o MATIC é `msg.sender`.

## O contrato

`EnergyVault.lockTrade(seller, tokenId, energyWh, pricePerKwh, deadline) payable`:

1. Exige `msg.value >= energyWh * pricePerKwh / 1000` (o **buyer** trava o pagamento).
2. Faz `luzToken.safeTransferFrom(seller, vault, tokenId, energyWh)`, ou seja, o
   **seller** precisa ter feito `setApprovalForAll(vault, true)` antes.
3. `confirmDelivery(tradeId)` (só o buyer) e `settleTrade(tradeId)` liberam:
   LuzTokens para o buyer, MATIC para o seller.

Conclusão: **quem chama `lockTrade` é o buyer, com a própria wallet e o próprio
MATIC.** O seller participa só aprovando o vault como operador do LuzToken.

## Dois modelos

### 1. Buyer-funded (produção, correto)

O buyer conecta a carteira no dApp e assina `lockTrade` com `value`. O backend
NÃO entra no caminho do dinheiro: ele só faz matching/oracle e pode observar os
eventos. Implementação: hook no frontend (wagmi `useWriteContract`) na tela de
compra do mercado (`components/market/trade-form.tsx`), com:

- pré-checagem de que o seller aprovou o vault (ou fluxo que peça a aprovação);
- `value = energyWh * pricePerKwh / 1000` calculado no cliente;
- leitura do `tradeId` do evento `TradeLocked` para as etapas seguintes.

Esse é o alvo. Enquanto a tela de trade não estiver ligada, o botão de compra
deve deixar claro "em breve" em vez de simular.

### 2. Custodial de testnet (atual, no backend)

`BlockchainGateway.lockEscrow` faz o **oracle signer** agir como buyer
(`msg.sender` = chave do backend). Isso só funciona porque, na testnet, a chave
do backend tem POL e é usada para demonstrar o fluxo de ponta a ponta (ver
`contracts/scripts/vault-smoke-amoy.ts`). **Não é o modelo de produção**: o
backend não deve custodiar o dinheiro do comprador. Está marcado explicitamente
como custodial/testnet no código.

Se um dia um modelo custodial for desejado de propósito (ex.: gateway de
pagamento que recebe fiat e compra em nome do usuário), ele precisa de KYC,
segregação de fundos e uma decisão de produto e jurídica própria; não é o default.

## Decisão

- Produção: escrow é **buyer-funded no frontend**. O `lockEscrow` do backend fica
  como caminho de teste/demonstração, claramente rotulado, e o `Auctioneer` que o
  usa opera só em modo testnet.
- Próximo passo de implementação: ligar `trade-form.tsx` ao `lockTrade` buyer-funded
  e remover/segregar o uso custodial do caminho de produção.
