import type { Device } from '../entities/Device.js';

export interface DeviceRepository {
  save(device: Device): void;
  findById(id: string): Device | null;
  findByOwner(owner: string): Device[];
  findByPublicKey(publicKeyHex: string): Device | null;
  findAll(): Device[];
}
