import type { Bid } from '../domain/entities/Bid.js';
import type { MarketBasis } from '../domain/value-objects/MarketBasis.js';
import { MarketAgent } from './MarketAgent.js';

export class ConsumerAgent extends MarketAgent {
  private demandKWh = 0;
  private maxBuyingPrice = 0.90; // R$/kWh — distribuidora tariff (ceiling)

  constructor(agentId: string, basis: MarketBasis) {
    super(agentId, basis);
  }

  updateDemand(wattsH: number): void {
    this.demandKWh = wattsH / 1000;
  }

  setMaxBuyingPrice(price: number): void {
    this.maxBuyingPrice = price;
  }

  createBid(sessionId: string): Bid | null {
    if (this.demandKWh <= 0) return null;

    const demand = this.buildDemandArray(
      this.demandKWh,
      0,
      this.maxBuyingPrice,
    );

    return {
      agentId: this.agentId,
      sessionId,
      demandArray: demand,
      minPrice: 0,
      maxPrice: this.maxBuyingPrice,
      timestamp: Date.now(),
    };
  }
}
