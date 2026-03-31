import type { Bid } from '../domain/entities/Bid.js';
import type { MarketBasis } from '../domain/value-objects/MarketBasis.js';
import { MarketAgent } from './MarketAgent.js';

export class ProducerAgent extends MarketAgent {
  private availableKWh = 0;
  private minSellingPrice = 0.02; // R$/kWh — marginal cost of solar

  constructor(agentId: string, basis: MarketBasis) {
    super(agentId, basis);
  }

  updateProduction(wattsH: number): void {
    this.availableKWh = wattsH / 1000;
  }

  setMinSellingPrice(price: number): void {
    this.minSellingPrice = price;
  }

  createBid(sessionId: string): Bid | null {
    if (this.availableKWh <= 0) return null;

    // Producer supply = negative demand (offering energy)
    const demand = this.buildDemandArray(
      -this.availableKWh,
      this.minSellingPrice,
      this.basis.maxPrice,
    );

    return {
      agentId: this.agentId,
      sessionId,
      demandArray: demand,
      minPrice: this.minSellingPrice,
      maxPrice: this.basis.maxPrice,
      timestamp: Date.now(),
    };
  }
}
