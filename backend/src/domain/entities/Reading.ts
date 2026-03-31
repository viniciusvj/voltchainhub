import type { EcdsaSignature } from '../value-objects/EcdsaSignature.js';

export interface Reading {
  id: string;
  deviceId: string;
  wattsH: number;
  timestamp: number;
  nonce: number;
  signature: EcdsaSignature;
  verified: boolean;
  anomalyFlags: string[];
  receivedAt: number;
}
