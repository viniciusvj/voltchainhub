/*
 * VoltchainHub metering node, ESP32-S3 bring-up skeleton.
 *
 * Implements the FreeRTOS task layout from docs/design/firmware-esp32s3.md:
 *   sampling -> energy (1-min window) -> signer (secure element) -> net (MQTT).
 *
 * This is a SKELETON: the ADC read, the ATECC608B ECDSA signing and the MQTT
 * publish are stubbed/simulated so the flow builds and runs on a bare board
 * before the hardware/crypto/network layers land. Search for STUB.
 */
#include <string.h>
#include <inttypes.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "esp_log.h"
#include "esp_timer.h"

static const char *TAG = "voltchain";

/* One closed 1-minute energy window, ready to sign + publish. */
typedef struct {
    uint32_t slot;        /* monotonic window index (anti-replay nonce)     */
    uint64_t t0;          /* window start, unix seconds (NTP once wired)    */
    uint32_t wh_milli;    /* energy in the window, milli-Wh (integer)       */
    uint32_t irms_ma;     /* peak RMS current in the window, mA (telemetry) */
} energy_window_t;

typedef struct {
    energy_window_t win;
    uint8_t sig[64];      /* ECDSA P-256 r||s (STUB until ATECC608B)        */
} signed_reading_t;

static QueueHandle_t s_energy_q;   /* sampling+energy -> signer */
static QueueHandle_t s_publish_q;  /* signer -> net             */

#define SAMPLE_HZ        4000
#define WINDOW_SECONDS   60
#define SOURCE_SOLAR     0

/* STUB: replace with esp_adc/continuous DMA read of the SCT-013 front-end. */
static float sample_current_amps(void)
{
    /* Simulated ~2.5 A RMS with small jitter so windows differ. */
    static uint32_t n;
    float jitter = ((esp_timer_get_time() + n++) % 500) / 1000.0f;
    return 2.5f + jitter;
}

/* Accumulates energy over 1-minute windows and enqueues each closed window. */
static void energy_task(void *arg)
{
    (void)arg;
    const TickType_t period = pdMS_TO_TICKS(1000 / (SAMPLE_HZ / 1000)); /* coarse */
    uint32_t slot = 0;
    const float v_nominal = 127.0f; /* assumed until a voltage channel exists */

    while (1) {
        double wh = 0.0;
        uint32_t irms_peak_ma = 0;
        int64_t start_us = esp_timer_get_time();

        while ((esp_timer_get_time() - start_us) < (int64_t)WINDOW_SECONDS * 1000000) {
            float i = sample_current_amps();
            uint32_t i_ma = (uint32_t)(i * 1000.0f);
            if (i_ma > irms_peak_ma) irms_peak_ma = i_ma;
            /* power (W) = V * I; energy (Wh) over dt seconds */
            wh += (v_nominal * i) * (1.0 / 3600.0);
            vTaskDelay(period ? period : 1);
        }

        energy_window_t w = {
            .slot = slot++,
            .t0 = (uint64_t)(start_us / 1000000),
            .wh_milli = (uint32_t)(wh * 1000.0),
            .irms_ma = irms_peak_ma,
        };
        ESP_LOGI(TAG, "window slot=%" PRIu32 " wh_milli=%" PRIu32 " irms=%" PRIu32 "mA",
                 w.slot, w.wh_milli, w.irms_ma);
        xQueueSend(s_energy_q, &w, portMAX_DELAY);
    }
}

/* STUB: ATECC608B ECDSA P-256 over SHA-256(payload). Key never leaves the SE. */
static void secure_element_sign(const energy_window_t *w, uint8_t out_sig[64])
{
    /* Placeholder deterministic bytes so downstream parsing works. */
    for (int i = 0; i < 64; i++) out_sig[i] = (uint8_t)(w->slot + i);
}

static void signer_task(void *arg)
{
    (void)arg;
    energy_window_t w;
    while (1) {
        if (xQueueReceive(s_energy_q, &w, portMAX_DELAY) == pdTRUE) {
            signed_reading_t r = { .win = w };
            secure_element_sign(&w, r.sig); /* STUB */
            xQueueSend(s_publish_q, &r, portMAX_DELAY);
        }
    }
}

/* STUB: build the CBOR payload and publish over MQTT/TLS to voltchain/v1/<id>/reading. */
static void net_task(void *arg)
{
    (void)arg;
    signed_reading_t r;
    while (1) {
        if (xQueueReceive(s_publish_q, &r, portMAX_DELAY) == pdTRUE) {
            /* Real impl: CBOR-encode {v,dev,seq,t0,dt,mwh,irms_max} then append r.sig,
             * publish QoS1. Here we just log what would go out. */
            ESP_LOGI(TAG, "PUBLISH voltchain/v1/<dev>/reading slot=%" PRIu32
                          " mwh=%" PRIu32 " src=%d sig[0]=%02x",
                     r.win.slot, r.win.wh_milli, SOURCE_SOLAR, r.sig[0]);
        }
    }
}

void app_main(void)
{
    ESP_LOGI(TAG, "VoltchainHub node booting (skeleton). See docs/design/firmware-esp32s3.md");
    s_energy_q = xQueueCreate(8, sizeof(energy_window_t));
    s_publish_q = xQueueCreate(8, sizeof(signed_reading_t));

    /* sampling+energy on core 1, crypto+net on core 0 (per the design doc). */
    xTaskCreatePinnedToCore(energy_task, "energy", 4096, NULL, 5, NULL, 1);
    xTaskCreatePinnedToCore(signer_task, "signer", 4096, NULL, 5, NULL, 0);
    xTaskCreatePinnedToCore(net_task,    "net",    4096, NULL, 4, NULL, 0);
}
