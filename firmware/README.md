# Firmware — ESP32-S3

> **Estado:** 🔴 Não iniciado. Esta é a área mais aberta do projeto para contribuidores com experiência embedded.

## O que mora aqui (ainda não existe)

Firmware do dispositivo de borda que o whitepaper chama de **nó VoltchainHub**. Responsabilidades:

1. **Medição de energia** via CT sensor (SCT-013-030A ou similar) em ADC do ESP32-S3.
2. **Integração de energia** em janela de 1 minuto (RMS + kWh).
3. **Assinatura ECDSA P-256** da leitura, com chave privada armazenada em eFuse e executada em TrustZone (chave nunca sai da secure world).
4. **Publicação MQTT** (TLS) da leitura assinada para o backend.
5. **Sincronização NTP** para timestamps confiáveis.
6. **Provisionamento seguro** — durante primeira boot, ESP32 gera par de chaves, envia publicKey para `DeviceRegistry.registerDevice()`, guarda privateKey em eFuse.

## Issue ativa

**Design doc antes do código** — veja [#4: Design doc driver CT sensor SCT-013 → ESP32-S3 + ECDSA](https://github.com/viniciusvj/voltchainhub/issues/4).

Ordem desejada:

1. Design doc em `docs/design/firmware-esp32s3.md` — decisões fundamentais (ESP-IDF vs Arduino, RTOS task layout, particionamento TrustZone, ADC sampling rate)
2. Bring-up bare-metal do ADC com SCT-013, validação elétrica
3. ECDSA isolado no TrustZone (exemplo funcional)
4. Integração MQTT over TLS
5. Firmware OTA via HTTPS (signed manifest)

## BOM estimado (piloto 10 unidades)

| Item | Part # | Custo unit. (USD) |
|---|---|---|
| ESP32-S3-WROOM-1 (módulo) | ESP32-S3-WROOM-1-N8R8 | ~4.50 |
| CT Sensor 30A | SCT-013-030A | ~7.00 |
| Burden resistor + op-amp (MCP6002) | — | ~1.50 |
| Caixa IP65 | — | ~8.00 |
| Fonte 5V (DC-DC do próprio medidor) | — | ~3.00 |
| PCB (10 unid.) | custom | ~5.00 |
| Montagem | — | ~10.00 |
| **Total** | — | **~40 USD / unidade** |

Valores são estimativas iniciais — podem variar ±30% conforme fornecedor e lote.

## Referências relevantes

- [ESP-IDF TrustZone docs](https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/security/secure-boot-v2.html)
- [OpenEnergyMonitor — emonESP](https://github.com/openenergymonitor/emonesp) — projeto aberto de CT + ESP32 Wi-Fi
- [IoTaWatt](https://github.com/boblemaire/IoTaWatt) — referência Arduino para medição
- [mbedTLS ECDSA](https://tls.mbed.org/kb/how-to/generate-an-ecdsa-key-and-csr) — biblioteca que vamos usar (ou HW crypto periférico)

## Como começar

1. Leia o [Whitepaper v0.1 §3.2](../VoltchainHub-Whitepaper-v0.1.md) (camada hardware).
2. Comente em [#4](https://github.com/viniciusvj/voltchainhub/issues/4) com sua experiência e interesse.
3. Abra PR do design doc em `docs/design/firmware-esp32s3.md` antes de começar a escrever código.

Esta é uma **área de alta dificuldade e alto impacto** — quem entrega a primeira versão funcional basicamente define a referência de hardware do ecossistema.
