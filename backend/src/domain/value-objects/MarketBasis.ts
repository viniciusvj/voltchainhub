export interface MarketBasis {
  commodity: string;
  currency: string;
  priceSteps: number;
  minPrice: number;
  maxPrice: number;
}

export const DEFAULT_MARKET_BASIS: MarketBasis = {
  commodity: 'electricity',
  currency: 'BRL',
  priceSteps: 100,
  minPrice: 0.0,
  maxPrice: 1.0,
};
