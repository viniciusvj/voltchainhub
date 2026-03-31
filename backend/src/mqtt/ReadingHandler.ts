import { randomUUID } from 'node:crypto';
import type { DeviceRepository } from '../domain/ports/DeviceRepository.js';
import type { ReadingRepository } from '../domain/ports/ReadingRepository.js';
import type { Reading } from '../domain/entities/Reading.js';
import { validateReadingSignature, validateNonce, validateTimestamp } from '../domain/services/ReadingValidator.js';
import { detectAnomalies } from '../domain/services/AnomalyDetector.js';
import { readingPayloadSchema, type ReadingPayloadInput } from './schemas/reading-payload.js';
import { createLogger } from '../logger.js';

const log = createLogger('reading-handler');

export interface ReadingHandlerDeps {
  deviceRepo: DeviceRepository;
  readingRepo: ReadingRepository;
  onVerifiedReading?: (reading: Reading) => void;
  timestampDriftTolerance: number;
  anomalyZScoreThreshold: number;
}

export class ReadingHandler {
  constructor(private deps: ReadingHandlerDeps) {}

  handle(rawPayload: string): void {
    let parsed: ReadingPayloadInput;
    try {
      parsed = readingPayloadSchema.parse(JSON.parse(rawPayload));
    } catch (err) {
      log.warn({ err }, 'Invalid reading payload');
      return;
    }

    const device = this.deps.deviceRepo.findById(parsed.deviceId);
    if (!device) {
      log.warn({ deviceId: parsed.deviceId }, 'Unknown device');
      return;
    }
    if (device.status !== 'active') {
      log.warn({ deviceId: parsed.deviceId, status: device.status }, 'Device not active');
      return;
    }

    const sigResult = validateReadingSignature(
      { deviceId: parsed.deviceId, wattsH: parsed.wattsH, timestamp: parsed.timestamp, nonce: parsed.nonce },
      parsed.signature,
      device.publicKeyHex,
    );
    if (!sigResult.valid) {
      log.warn({ deviceId: parsed.deviceId, error: sigResult.error }, 'Signature validation failed');
      return;
    }

    const lastNonce = this.deps.readingRepo.getLastNonce(parsed.deviceId);
    const nonceResult = validateNonce(parsed.nonce, lastNonce);
    if (!nonceResult.valid) {
      log.warn({ deviceId: parsed.deviceId, error: nonceResult.error }, 'Nonce validation failed');
      return;
    }

    const tsResult = validateTimestamp(parsed.timestamp, Math.floor(Date.now() / 1000), this.deps.timestampDriftTolerance);
    if (!tsResult.valid) {
      log.warn({ deviceId: parsed.deviceId, error: tsResult.error }, 'Timestamp validation failed');
      return;
    }

    const stats = this.deps.readingRepo.getStatsForDevice(parsed.deviceId, 50);
    const anomalyResult = detectAnomalies(parsed.wattsH, device.ratedCapacityWh, stats, this.deps.anomalyZScoreThreshold);

    const reading: Reading = {
      id: randomUUID(),
      deviceId: parsed.deviceId,
      wattsH: parsed.wattsH,
      timestamp: parsed.timestamp,
      nonce: parsed.nonce,
      signature: parsed.signature,
      verified: anomalyResult.valid,
      anomalyFlags: anomalyResult.flags.map(f => f.message),
      receivedAt: Date.now(),
    };

    this.deps.readingRepo.save(reading);
    log.info({ readingId: reading.id, deviceId: reading.deviceId, wattsH: reading.wattsH, verified: reading.verified }, 'Reading processed');

    if (reading.verified && this.deps.onVerifiedReading) {
      this.deps.onVerifiedReading(reading);
    }
  }
}
