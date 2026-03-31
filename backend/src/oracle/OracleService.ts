import type { Reading } from '../domain/entities/Reading.js';
import type { BlockchainGateway } from '../domain/ports/BlockchainGateway.js';
import { createLogger } from '../logger.js';

const log = createLogger('oracle');

const PROTOCOL_FEE_RATE = 0.01; // 1% fee per whitepaper section 4.1

export class OracleService {
  private buffer: Reading[] = [];

  constructor(private blockchain: BlockchainGateway) {}

  enqueue(reading: Reading): void {
    this.buffer.push(reading);
    log.debug({ readingId: reading.id, bufferSize: this.buffer.length }, 'Reading enqueued for oracle submission');
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0);
    log.info({ batchSize: batch.length }, 'Flushing oracle batch');

    for (const reading of batch) {
      try {
        await this.blockchain.submitReading(reading);

        // Mint LuzTokens: 99% to device owner, 1% protocol fee
        const kWh = reading.wattsH / 1000;
        const ownerAmount = kWh * (1 - PROTOCOL_FEE_RATE);
        const tokenId = `${reading.deviceId}-${Math.floor(reading.timestamp / 300)}`;

        await this.blockchain.mintTokens(reading.deviceId, tokenId, ownerAmount);

        log.info({ readingId: reading.id, kWh, minted: ownerAmount }, 'Reading submitted and tokens minted');
      } catch (err) {
        log.error({ err, readingId: reading.id }, 'Oracle submission failed, re-enqueuing');
        this.buffer.push(reading);
      }
    }
  }

  get bufferSize(): number {
    return this.buffer.length;
  }
}
