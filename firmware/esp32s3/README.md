# VoltchainHub node, ESP32-S3 (bring-up skeleton)

Minimal ESP-IDF project that implements the task pipeline from
[`docs/design/firmware-esp32s3.md`](../../docs/design/firmware-esp32s3.md):

```
sampling  ->  energy (1-min window)  ->  signer (secure element)  ->  net (MQTT)
```

It **builds and runs on a bare ESP32-S3** but the hardware-facing pieces are
stubbed (marked `STUB` in `main/voltchain_main.c`) so contributors can bring up
one layer at a time:

- `sample_current_amps()` simulates the SCT-013 + ADC front-end. Next: real
  `esp_adc/continuous` DMA read + RMS.
- `secure_element_sign()` returns placeholder bytes. Next: ATECC608B ECDSA P-256
  via `esp-cryptoauthlib` (key generated in and never leaving the secure element).
- `net_task` logs the payload it would publish. Next: CBOR encode + MQTT/TLS to
  `voltchain/v1/<dev>/reading`, plus SNTP and the 72h offline buffer.

## Build

```bash
# ESP-IDF v5.x installed and exported (idf.py on PATH)
cd firmware/esp32s3
idf.py set-target esp32s3
idf.py build
idf.py -p <PORT> flash monitor
```

Expected log: one `window ...` line per minute followed by a `PUBLISH ...` line.

## Roadmap for this component

See the "Firmware & hardware" section of [`../../ROADMAP.md`](../../ROADMAP.md)
and issue #4. Hardware decision recap: the signing key lives in an **ATECC608B
secure element** (the Xtensa ESP32-S3 has no ARM TrustZone); ESP32-C6 + ESP-TEE
is the future path.
