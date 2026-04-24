export type TokenCategory = 'BRL_STABLE' | 'USD_STABLE' | 'NATIVE_WRAPPED' | 'OTHER';

export interface PaymentPreference {
  ownerAddress: string;
  receiveTokenAddress: string;
  receiveTokenSymbol: string;
  category: TokenCategory;
  maxSlippageBps: number;
  updatedAt: number;
}
