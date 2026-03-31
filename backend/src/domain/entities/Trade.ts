export interface Trade {
  id: string;
  sessionId: string;
  seller: string;
  buyer: string;
  kWh: number;
  pricePerKWh: number;
  status: 'pending' | 'locked' | 'delivered' | 'settled' | 'cancelled';
  txHash: string | null;
  createdAt: number;
  settledAt: number | null;
}
