import type { Bid } from '../domain/entities/Bid.js';
import type { MarketBasis } from '../domain/value-objects/MarketBasis.js';

export abstract class MarketAgent {
  constructor(
    public readonly agentId: string,
    protected basis: MarketBasis,
  ) {}

  abstract createBid(sessionId: string): Bid | null;

  protected buildDemandArray(
    quantityKWh: number,
    minAcceptablePrice: number,
    maxAcceptablePrice: number,
  ): number[] {
    const { priceSteps, minPrice, maxPrice } = this.basis;
    const stepSize = (maxPrice - minPrice) / priceSteps;
    const demand = new Array<number>(priceSteps);

    for (let i = 0; i < priceSteps; i++) {
      const price = minPrice + i * stepSize;
      if (price < minAcceptablePrice) {
        demand[i] = quantityKWh;
      } else if (price > maxAcceptablePrice) {
        demand[i] = 0;
      } else {
        // Linear interpolation between min and max acceptable price
        const ratio = (maxAcceptablePrice - price) / (maxAcceptablePrice - minAcceptablePrice);
        demand[i] = quantityKWh * ratio;
      }
    }

    return demand;
  }
}
