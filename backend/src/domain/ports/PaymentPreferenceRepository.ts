import type { PaymentPreference, TokenCategory } from '../entities/PaymentPreference.js';

export interface PreferenceStats {
  totalPreferencesSet: number;
  byCategory: Record<TokenCategory, number>;
  topTokens: Array<{ symbol: string; count: number }>;
  averageMaxSlippageBps: number;
}

export interface PaymentPreferenceRepository {
  findByOwner(ownerAddress: string): PaymentPreference | null;
  upsert(pref: PaymentPreference): void;
  listAll(): PaymentPreference[];
  getStats(): PreferenceStats;
}
