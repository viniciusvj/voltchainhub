# Hardware — PCB & Schematic

> **Estado:** 🔴 Não iniciado. Depende do design do firmware (ESP32-S3).

## O que mora aqui (ainda não existe)

Projeto do hardware físico do nó VoltchainHub:

1. **Schematic (KiCad)** — ESP32-S3 + CT sensor interface + PSU + antena + TLS provisioning header
2. **PCB (2 ou 4 camadas)** — layout compacto, caixa IP65, considerar EMI do CT sensor
3. **BOM** — lista final de componentes, fornecedores brasileiros prioritários (para facilitar piloto MG)
4. **Fabricação docs** — Gerber, pick-and-place, assembly drawing para fábrica (JLCPCB ou equivalente)
5. **Guia de montagem** — para o piloto de 10 unidades em Minas Gerais (fase 2)

## Antes de iniciar o hardware

O hardware depende de decisões que serão tomadas na fase de **design do firmware**:

- **ADC:** usar ADC interno do ESP32-S3 ou externo (MCP3208)?
- **CT sensor model:** SCT-013-030A (30A/1V, output em voltagem) ou SCT-013-000 (100A/50mA, output em corrente)?
- **Burden resistor:** fixo ou ajustável por dip-switch?
- **Proteção da entrada ADC:** zener + RC filter + ESD?
- **Conectividade:** Wi-Fi only (ESP32-S3 tem built-in), ou adicionar PLC HomePlug AV em variação futura?

Dessas depende o schematic. Por isso o roteiro é: **design doc firmware → schematic → PCB**.

## Issues relacionadas

- [#4 — Design doc firmware ESP32-S3 + SCT-013 + ECDSA](https://github.com/viniciusvj/voltchainhub/issues/4) — bloqueador desta área

## Ferramentas esperadas

- **KiCad 8+** (Apache 2.0 compatível, livre)
- Repositório de componentes: KiCad oficial + símbolos custom para ESP32-S3-WROOM-1
- Revisão via PR — capturas do schematic + render 3D do PCB no corpo do PR

## Como começar

Contribuir aqui requer experiência em:
- Design analógico (entrada do CT sensor — a parte mais crítica eletricamente)
- Layout RF mínimo (antena Wi-Fi do ESP32)
- EMC básico (CT sensor captura campo magnético; cabo pode pegar noise)

Se você tem essa experiência e interesse em contribuir, abra uma Discussion no repositório apresentando-se — faremos onboarding dirigido.
