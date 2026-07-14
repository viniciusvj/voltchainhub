# Design Doc: Firmware do nó de medição (ESP32-S3 + SCT-013 + ECDSA P-256)

> **Status:** rascunho para revisão (issue [#4](https://github.com/viniciusvj/voltchainhub/issues/4)).
> **Escopo:** arquitetura de hardware e firmware do nó VoltchainHub de medição. Não cobre PLC HomePlug nem WPT (ficam para docs próprios).
> **Público:** contribuidores embedded. Feedback via Discussions ou comentários no PR.

---

## 1. Objetivo

Um dispositivo de baixo custo (< USD 25/unidade em piloto de 10) que:

1. Mede corrente via CT sensor SCT-013 e integra energia em janelas de 1 minuto (kWh).
2. Assina cada janela com ECDSA P-256, com a chave privada inacessível ao firmware de aplicação.
3. Publica a leitura assinada via MQTT over TLS com timestamp NTP.
4. Sobrevive offline por 72h (buffer local) e aceita OTA assinado.

A assinatura é o que dá valor ao dado: o `EnergyOracle` só minta LuzToken para leituras cuja assinatura bate com a chave pública registrada no `DeviceRegistry` (whitepaper §5.1).

## 2. Diagrama de blocos

```
      Rede elétrica (fase do circuito medido)
              │
        ┌─────┴─────┐
        │  SCT-013  │  CT clamp, não invasivo
        └─────┬─────┘
              │ sinal AC (corrente induzida)
   ┌──────────┴───────────┐
   │ Condicionamento:     │
   │ burden + bias mid-   │
   │ rail + RC anti-alias │
   └──────────┬───────────┘
              │ 0..3.1V centrado em 1.55V
   ┌──────────┴───────────────────────────────┐
   │ ESP32-S3                                 │
   │  ADC1 (12-bit, ~4 kHz)                   │
   │  Task RTOS: sampling → RMS → kWh (1 min) │
   │  mbedTLS SHA-256 do payload              │
   └──────────┬───────────────────┬───────────┘
              │ I2C               │ Wi-Fi
   ┌──────────┴─────────┐  ┌──────┴──────────────┐
   │ ATECC608B          │  │ MQTT over TLS       │
   │ (secure element,   │  │ voltchain/<id>/     │
   │  ECDSA P-256,      │  │ reading (QoS 1)     │
   │  chave nunca sai)  │  │ + SNTP (pool.ntp)   │
   └────────────────────┘  └─────────────────────┘
```

Alimentação: HLK-PM01 (5V/0.6A) + LDO 3.3V, ou USB durante bring-up.

## 3. Hardware

### 3.1 CT sensor: SCT-013-000, não a variante -030

| | SCT-013-000 | SCT-013-030 |
|---|---|---|
| Saída | corrente (50 mA @ 100 A) | tensão (1 V @ 30 A, burden interno) |
| Faixa | escolhida pelo burden externo | fixa em 30 A |
| Precisão útil | melhor no range baixo se burden dimensionado | trava em 30 A |

**Decisão: SCT-013-000 com burden externo.** Entrada residencial brasileira comum tem disjuntor geral de 40 a 63 A; a variante de 30 A satura. Com burden externo escolhemos a faixa por instalação (ex.: 33 Ω para ~68 A fundo de escala em 3.1 Vpp) e a mesma placa serve de residencial a pequeno comércio.

Condicionamento clássico (OpenEnergyMonitor):

- Burden de precisão 1% entre os terminais do CT.
- Bias de meia escala: divisor 2x 10 kΩ de 3.3V + capacitor 10 µF, centrando o sinal em ~1.65 V.
- RC anti-aliasing: R 1 kΩ + C 22 nF (fc ≈ 7 kHz) por canal. Com amostragem a 4 kHz e conteúdo espectral relevante até o 33º harmônico de 60 Hz (~2 kHz), é suficiente; harmônicos acima disso têm energia desprezível em cargas residenciais.
- Diodos de clamp (BAT54S) protegendo o pino do ADC contra CT desconectado sob carga.

**Regra de segurança de campo: nunca desconectar o burden com o CT instalado em condutor energizado** (o secundário aberto gera picos de tensão). O burden mora na placa, soldado.

### 3.2 ADC: interno do ESP32-S3, com calibração (e limitação documentada)

O ADC interno do ESP32-S3 (12-bit SAR) tem não-linearidade e ruído conhecidos. Mitigação:

- Usar ADC1 (ADC2 conflita com Wi-Fi).
- Curva de calibração de fábrica via `esp_adc_cal` + atenuação 11 dB.
- Oversampling: amostrar a 4 kHz e a métrica é RMS de janela, o que dilui ruído não correlacionado.
- Erro esperado pós-calibração: 1 a 2% na energia integrada, aceitável para piloto (medidor fiscal continua sendo o da distribuidora; o nó mede o excedente para efeito de mercado P2P).

**Alternativa marcada para fase 2:** front-end dedicado ATM90E32AS (SPI, classe 0.5, mede tensão + corrente + fator de potência de até 3 fases, ~USD 2). Se o piloto mostrar que 1-2% não basta, trocamos o front-end sem tocar no resto da arquitetura. Projetos de referência: CircuitSetup Expandable 6 Channel ESP32 Energy Meter usa exatamente esse caminho.

Amostragem: 4 kHz por canal via timer de hardware + DMA (`adc_continuous`), 240 amostras por ciclo de 60 Hz. RMS por janela de 200 ms (12 ciclos), acumulação de energia por janela de 1 min.

Sem medição de tensão no MVP: assumimos tensão nominal da instalação (127/220 V configurável no provisionamento) e fator de potência unitário, o que superestima levemente kWh em cargas reativas. Documentado como limitação; ATM90E32AS resolve na fase 2.

### 3.3 Elemento seguro: ATECC608B (e a correção do "TrustZone")

**Decisão controversa, explícita:** o whitepaper (§3.2, §5.1) diz "TrustZone" no ESP32-S3. **O ESP32-S3 não tem ARM TrustZone** (núcleo Xtensa LX7, não ARM; TrustZone é tecnologia ARM). O que o S3 oferece: Secure Boot v2, Flash Encryption, eFuse com bloqueio de leitura, e o periférico Digital Signature (que protege chave RSA, não ECDSA). O periférico ECDSA de hardware só existe em chips mais novos (ESP32-C6/H2/P4), e o framework ESP-TEE da Espressif hoje mira RISC-V (C6), não o S3.

Três opções avaliadas para "chave privada que o firmware nunca lê":

| Opção | Custo | Segurança | Risco |
|---|---|---|---|
| A. **ATECC608B via I2C** | +USD 0.80 | chave gerada e usada dentro do SE, nunca exportável; ECDSA P-256 nativo em ~50 ms | soldagem extra; provisionamento tem curva de aprendizado |
| B. ECDSA em software (mbedTLS) + chave em NVS criptografado + Flash Encryption + Secure Boot v2 | +0 | chave protegida contra leitura externa, mas presente em RAM durante assinatura | exploit de RCE no firmware exfiltra a chave |
| C. Migrar o nó para ESP32-C6 + ESP-TEE + periférico ECDSA | ~igual | TEE real da Espressif | abandona o S3 do whitepaper; ESP-TEE ainda maturando |

**Decisão: opção A (ATECC608B) para o piloto, mantendo o ESP32-S3 como host.** É o mesmo padrão do ESP32-WROOM-32SE da própria Espressif e do esp-cryptoauthlib, integração conhecida. A opção C fica registrada como candidata natural quando ESP-TEE estabilizar. O whitepaper deve ser corrigido em revisão futura: trocar "TrustZone" por "elemento seguro dedicado (secure element)".

Ainda assim habilitamos no S3: Secure Boot v2 (cadeia de boot assinada), Flash Encryption (protege config e buffer), e eFuse para o device ID.

### 3.4 BOM estimada (piloto, 10 unidades)

| Item | Ref | USD/unid |
|---|---|---|
| ESP32-S3-WROOM-1 (módulo, 8MB PSRAM) | Espressif | 3.50 |
| SCT-013-000 | YHDC | 5.00 |
| ATECC608B-SSHDA | Microchip | 0.80 |
| Fonte HLK-PM01 + LDO + passivos | Hi-Link | 4.00 |
| PCB 2 camadas (lote 10) + conectores | JLC/PCBWay | 4.50 |
| Caixa DIN-rail ABS | genérica | 3.00 |
| Margem/frete/imposto BR (~25%) | | 5.20 |
| **Total** | | **~26.00** |

Acima do alvo de USD 25 por pouco; em lote de 100 cai para ~USD 16.

## 4. Firmware

### 4.1 ESP-IDF, não Arduino

**Decisão: ESP-IDF v5.x puro.** Motivos: Secure Boot v2 e Flash Encryption são cidadãos de primeira classe no tooling (idf.py), `adc_continuous` com DMA não existe no core Arduino, esp-cryptoauthlib (ATECC608B) integra via componente oficial, e OTA assinado (`esp_https_ota` + verificação de assinatura de app) já vem pronto. Arduino facilitaria contribuidor casual, mas este nó é infraestrutura de confiança, não projeto hobby. Contribuidores Arduino são bem-vindos nos exemplos de bring-up (pasta `firmware/examples/`).

### 4.2 Layout de tasks (FreeRTOS)

| Task | Core | Prio | Função |
|---|---|---|---|
| `sampling` | 1 | alta | drena buffers DMA do ADC, acumula Σi² |
| `energy` | 1 | média | a cada 200 ms fecha RMS; a cada 1 min fecha janela kWh e enfileira |
| `signer` | 0 | média | monta payload canônico, SHA-256, assina via ATECC608B (I2C), enfileira p/ envio |
| `net` | 0 | média | Wi-Fi/MQTT/TLS, publica QoS 1, gerencia backlog offline |
| `sys` | 0 | baixa | SNTP, watchdog, OTA, LED de status |

Filas entre tasks (`xQueueSend`), zero estado compartilhado sem fila. Sampling isolada no core 1 para jitter mínimo; rede e crypto no core 0.

### 4.3 Payload e assinatura

Payload canônico (CBOR, determinístico, ~60 bytes):

```
{
  "v": 1,                      // versão do schema
  "dev": "vch-<eFuse-id>",     // device id
  "seq": 18421,                // nonce sequencial persistido (anti-replay)
  "t0": 1767100800,            // início da janela (epoch, NTP)
  "dt": 60,                    // duração (s)
  "mwh": 12417,                // energia da janela em mWh (int, sem float)
  "irms_max": 8213             // mA, telemetria de sanidade p/ oracle
}
```

Assinatura: `ECDSA-P256(SHA256(cbor))` executada dentro do ATECC608B. Publicação MQTT:

```
tópico: voltchain/v1/<dev>/reading
corpo:  cbor || sig(64B)      QoS 1, retain off
```

O backend (`ReadingHandler`) já valida drift de timestamp e z-score de anomalia; o `seq` monotônico fecha replay. Janelas ficam em buffer circular no SPIFFS (72 h = 4.320 janelas ≈ 550 KB) quando offline, com reenvio FIFO.

### 4.4 Provisionamento

1. Primeiro boot: firmware detecta ATECC608B virgem, dispara geração de chave no slot 0 (privada nunca sai do SE).
2. Dispositivo expõe BLE temporário; app/CLI de instalação lê a chave pública + device id.
3. Instalador chama `DeviceRegistry.registerDevice(pubKey, ownerAddress)`; contrato emite challenge; dispositivo assina; registro concluído.
4. eFuse de modo produção queimado: desabilita JTAG, ativa Secure Boot + Flash Encryption.

### 4.5 Footprint estimado

- ECDSA no ATECC608B: ~50 ms por assinatura, 1 por minuto: irrelevante.
- mbedTLS TLS 1.2 + MQTT: ~45 KB RAM em pico de handshake.
- Buffers ADC DMA: 8 KB. Total do app: ~120 KB RAM de 512 KB SRAM + 8 MB PSRAM de folga. Sem pressão.

## 5. Interface pública (o que o resto do sistema vê)

- **MQTT** `voltchain/v1/<dev>/reading`: leitura assinada (formato §4.3). Único contrato de dados com o backend.
- **MQTT** `voltchain/v1/<dev>/status`: LWT online/offline + versão de firmware + RSSI (não assinado, telemetria).
- **HTTP local** `GET /healthz` (opcional, rede local): diagnóstico de instalação.
- OpenEMS integra consumindo do broker (bridge já prevista no backend), não falando com o nó diretamente.

## 6. Riscos e questões abertas

1. **Precisão sem canal de tensão** (assumimos V nominal): validar no piloto contra medidor da distribuidora; gatilho para ATM90E32AS na fase 2.
2. **Fornecimento do ATECC608B no BR**: lead time da Microchip varia; plano B temporário é a opção B (§3.3) com downgrade de segurança documentado por dispositivo no `DeviceRegistry`.
3. **Correção do whitepaper** (TrustZone → secure element): abrir PR separado de correção editorial.
4. **Bifásico/trifásico**: MVP é monofásico (1 CT). O ATM90E32AS da fase 2 já cobre 3 canais.

## 7. Referências

- OpenEnergyMonitor, condicionamento de CT e EmonLib: https://github.com/openenergymonitor
- IotaWatt (ADC externo MCP3208, 14 canais): https://github.com/boblemaire/IoTaWatt
- CircuitSetup ESP32 Energy Meter (ATM90E32AS): https://github.com/CircuitSetup/Expandable-6-Channel-ESP32-Energy-Meter
- Espressif: Secure Boot v2, Flash Encryption, ADC continuous mode driver (docs ESP-IDF v5.x)
- esp-cryptoauthlib (ATECC608 + ESP-IDF): https://github.com/espressif/esp-cryptoauthlib
- Microchip ATECC608B datasheet (DS40002239)
- YHDC SCT-013 datasheet
- Whitepaper VoltchainHub §3.2 e §5.1 (esqueleto que este doc expande)
