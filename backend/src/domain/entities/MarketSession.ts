export interface MarketSession {
  id: string;
  startsAt: number;
  endsAt: number;
  equilibriumPrice: number | null;
  bidCount: number;
  tradeCount: number;
  status: 'collecting' | 'clearing' | 'settled' | 'skipped';
}
