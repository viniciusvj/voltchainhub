import type { Bid } from '../entities/Bid.js';
import type { MarketBasis } from '../value-objects/MarketBasis.js';

export interface ClearingResult {
  equilibriumPrice: number;
  equilibriumPriceStep: number;
  aggregatedDemand: number[];
}

/**
 * Port of the PowerMatcher Auctioneer clearing algorithm.
 * Aggregates bid demand arrays and finds the price step where aggregate demand crosses zero.
 */
export function clearMarket(bids: Bid[], basis: MarketBasis): ClearingResult | null {
  if (bids.length === 0) return null;

  const aggregated = aggregateBids(bids, basis.priceSteps);
  const priceStep = findIntersection(aggregated);

  const stepSize = (basis.maxPrice - basis.minPrice) / basis.priceSteps;
  const equilibriumPrice = basis.minPrice + priceStep * stepSize;

  return {
    equilibriumPrice: Math.round(equilibriumPrice * 10000) / 10000,
    equilibriumPriceStep: priceStep,
    aggregatedDemand: aggregated,
  };
}

function aggregateBids(bids: Bid[], priceSteps: number): number[] {
  const aggregated = new Array<number>(priceSteps).fill(0);

  for (const bid of bids) {
    for (let i = 0; i < priceSteps && i < bid.demandArray.length; i++) {
      aggregated[i] += bid.demandArray[i];
    }
  }

  return aggregated;
}

/**
 * Find the price step where aggregate demand crosses zero (supply meets demand).
 * Demand array is indexed by price step: low index = low price = high demand.
 * We look for the first step where aggregate demand goes from positive to zero or negative.
 */
function findIntersection(aggregated: number[]): number {
  for (let i = 0; i < aggregated.length; i++) {
    if (aggregated[i] <= 0) {
      if (i === 0) return 0;
      // Linear interpolation between steps
      const prev = aggregated[i - 1];
      const curr = aggregated[i];
      if (prev === curr) return i;
      const fraction = prev / (prev - curr);
      return Math.round((i - 1 + fraction) * 100) / 100;
    }
  }
  // All positive demand — price at maximum
  return aggregated.length - 1;
}
