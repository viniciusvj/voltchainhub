import { p256 } from '@noble/curves/p256';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/curves/abstract/utils';
import type { EcdsaSignature } from '../value-objects/EcdsaSignature.js';

export interface ReadingPayload {
  deviceId: string;
  wattsH: number;
  timestamp: number;
  nonce: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateReadingSignature(
  payload: ReadingPayload,
  signature: EcdsaSignature,
  expectedPublicKeyHex: string,
): ValidationResult {
  try {
    const message = buildSigningMessage(payload);
    const messageHash = sha256(new TextEncoder().encode(message));

    const sigBytes = hexToBytes(signature.r + signature.s);
    const isValid = p256.verify(sigBytes, messageHash, hexToBytes(expectedPublicKeyHex));

    if (!isValid) {
      return { valid: false, error: 'ECDSA P-256 signature verification failed' };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, error: `Signature validation error: ${(err as Error).message}` };
  }
}

export function validateNonce(
  currentNonce: number,
  lastKnownNonce: number | null,
): ValidationResult {
  if (lastKnownNonce !== null && currentNonce !== lastKnownNonce + 1) {
    return {
      valid: false,
      error: `Nonce gap: expected ${lastKnownNonce + 1}, got ${currentNonce}`,
    };
  }
  return { valid: true };
}

export function validateTimestamp(
  readingTimestamp: number,
  currentTimestamp: number,
  driftToleranceSeconds: number,
): ValidationResult {
  const drift = Math.abs(readingTimestamp - currentTimestamp);
  if (drift > driftToleranceSeconds) {
    return {
      valid: false,
      error: `Timestamp drift ${drift}s exceeds tolerance ${driftToleranceSeconds}s`,
    };
  }
  return { valid: true };
}

function buildSigningMessage(payload: ReadingPayload): string {
  return `${payload.deviceId}:${payload.wattsH}:${payload.timestamp}:${payload.nonce}`;
}

export { buildSigningMessage, bytesToHex };
