import type { Reading } from '../entities/Reading.js';

export interface ReadingRepository {
  save(reading: Reading): void;
  findById(id: string): Reading | null;
  findByDevice(deviceId: string, limit?: number): Reading[];
  findRecent(limit: number): Reading[];
  getLastNonce(deviceId: string): number | null;
  getStatsForDevice(deviceId: string, windowSize: number): { mean: number; stddev: number; count: number } | null;
}
