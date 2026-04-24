import type { PaymentPreference } from '../entities/PaymentPreference.js';
import type { PaymentPreferenceRepository } from '../ports/PaymentPreferenceRepository.js';

/**
 * Route a payment settlement from buyer's token to seller's preferred token.
 *
 * The router is pure — it decides the route and parameters; the on-chain
 * VoltMarketplace contract performs the actual swap via Uniswap v3.
 */

export interface RouteRequest {
  buyerAddress: string;
  sellerAddress: string;
  payTokenAddress: string;
  grossAmount: bigint;
  /** Fallback token if seller has no explicit preference. */
  defaultReceiveToken: {
    address: string;
    symbol: string;
    category: PaymentPreference['category'];
  };
}

export interface RouteDecision {
  receiveTokenAddress: string;
  receiveTokenSymbol: string;
  directTransfer: boolean;
  maxSlippageBps: number;
  /**
   * Lower bound the marketplace contract will enforce. The caller is
   * responsible for computing this from an off-chain oracle quote and
   * the seller's maxSlippageBps.
   */
  computeMinReceive: (quotedOut: bigint) => bigint;
}

export class SettlementRouter {
  constructor(private readonly preferences: PaymentPreferenceRepository) {}

  route(req: RouteRequest): RouteDecision {
    const pref = this.preferences.findByOwner(req.sellerAddress);

    const receiveToken = pref?.receiveTokenAddress ?? req.defaultReceiveToken.address;
    const receiveSymbol = pref?.receiveTokenSymbol ?? req.defaultReceiveToken.symbol;
    const slippageBps = pref?.maxSlippageBps ?? 50; // default 0.5%

    return {
      receiveTokenAddress: receiveToken,
      receiveTokenSymbol: receiveSymbol,
      directTransfer: receiveToken.toLowerCase() === req.payTokenAddress.toLowerCase(),
      maxSlippageBps: slippageBps,
      computeMinReceive: (quotedOut) =>
        (quotedOut * BigInt(10_000 - slippageBps)) / 10_000n,
    };
  }
}
