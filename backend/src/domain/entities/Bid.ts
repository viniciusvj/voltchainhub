export interface Bid {
  agentId: string;
  sessionId: string;
  demandArray: number[];
  minPrice: number;
  maxPrice: number;
  timestamp: number;
}
