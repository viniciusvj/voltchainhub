import type { PaymentPreference } from '../entities/PaymentPreference.js';

export interface PaymentPreferenceRepository {
  findByOwner(ownerAddress: string): PaymentPreference | null;
  upsert(pref: PaymentPreference): void;
  listAll(): PaymentPreference[];
}
