import { randomUUID } from 'node:crypto';
import type { Bid } from '../domain/entities/Bid.js';
import type { Trade } from '../domain/entities/Trade.js';
import type { MarketSession } from '../domain/entities/MarketSession.js';
import type { MarketBasis } from '../domain/value-objects/MarketBasis.js';
import type { MarketSessionRepository } from '../domain/ports/MarketSessionRepository.js';
import type { TradeRepository } from '../domain/ports/TradeRepository.js';
import type { BlockchainGateway } from '../domain/ports/BlockchainGateway.js';
import { clearMarket } from '../domain/services/ClearingEngine.js';
import type { MarketAgent } from './MarketAgent.js';
import { createLogger } from '../logger.js';

const log = createLogger('auctioneer');

export class Auctioneer {
  private agents: MarketAgent[] = [];

  constructor(
    private basis: MarketBasis,
    private sessionRepo: MarketSessionRepository,
    private tradeRepo: TradeRepository,
    private blockchain: BlockchainGateway,
    private minParticipants: number,
  ) {}

  registerAgent(agent: MarketAgent): void {
    this.agents.push(agent);
    log.info({ agentId: agent.agentId, totalAgents: this.agents.length }, 'Agent registered');
  }

  removeAgent(agentId: string): void {
    this.agents = this.agents.filter(a => a.agentId !== agentId);
  }

  async clear(): Promise<MarketSession> {
    const now = Date.now();
    const session: MarketSession = {
      id: randomUUID(),
      startsAt: now,
      endsAt: now + 300_000,
      equilibriumPrice: null,
      bidCount: 0,
      tradeCount: 0,
      status: 'collecting',
    };

    this.sessionRepo.save(session);

    // Collect bids from all agents
    const bids: Bid[] = [];
    for (const agent of this.agents) {
      const bid = agent.createBid(session.id);
      if (bid) bids.push(bid);
    }

    session.bidCount = bids.length;

    if (bids.length < this.minParticipants) {
      session.status = 'skipped';
      this.sessionRepo.update(session);
      log.info({ sessionId: session.id, bidCount: bids.length, minRequired: this.minParticipants }, 'Market session skipped: insufficient participants');
      return session;
    }

    session.status = 'clearing';
    this.sessionRepo.update(session);

    const result = clearMarket(bids, this.basis);
    if (!result) {
      session.status = 'skipped';
      this.sessionRepo.update(session);
      return session;
    }

    session.equilibriumPrice = result.equilibriumPrice;
    log.info({ sessionId: session.id, equilibriumPrice: result.equilibriumPrice, bidCount: bids.length }, 'Market cleared');

    // Match producers and consumers at equilibrium price
    const trades = this.matchTrades(bids, result.equilibriumPrice, session.id);
    session.tradeCount = trades.length;

    for (const trade of trades) {
      this.tradeRepo.save(trade);
      try {
        const { txHash } = await this.blockchain.lockEscrow(trade.buyer, trade.seller, trade.kWh, trade.pricePerKWh);
        this.tradeRepo.updateStatus(trade.id, 'locked', txHash);
      } catch (err) {
        log.error({ err, tradeId: trade.id }, 'Failed to lock escrow');
      }
    }

    session.status = 'settled';
    this.sessionRepo.update(session);
    return session;
  }

  private matchTrades(bids: Bid[], equilibriumPrice: number, sessionId: string): Trade[] {
    const producers: { agentId: string; kWh: number }[] = [];
    const consumers: { agentId: string; kWh: number }[] = [];

    const priceStep = Math.round(
      ((equilibriumPrice - this.basis.minPrice) / (this.basis.maxPrice - this.basis.minPrice)) * this.basis.priceSteps,
    );
    const stepIdx = Math.min(Math.max(priceStep, 0), this.basis.priceSteps - 1);

    for (const bid of bids) {
      const quantity = bid.demandArray[stepIdx] ?? 0;
      if (quantity < 0) {
        producers.push({ agentId: bid.agentId, kWh: Math.abs(quantity) });
      } else if (quantity > 0) {
        consumers.push({ agentId: bid.agentId, kWh: quantity });
      }
    }

    const trades: Trade[] = [];
    let pi = 0;
    let ci = 0;
    let pRemaining = producers[0]?.kWh ?? 0;
    let cRemaining = consumers[0]?.kWh ?? 0;

    while (pi < producers.length && ci < consumers.length) {
      const matched = Math.min(pRemaining, cRemaining);
      if (matched > 0.001) {
        trades.push({
          id: randomUUID(),
          sessionId,
          seller: producers[pi].agentId,
          buyer: consumers[ci].agentId,
          kWh: Math.round(matched * 1000) / 1000,
          pricePerKWh: equilibriumPrice,
          status: 'pending',
          txHash: null,
          createdAt: Date.now(),
          settledAt: null,
        });
      }

      pRemaining -= matched;
      cRemaining -= matched;

      if (pRemaining < 0.001) {
        pi++;
        pRemaining = producers[pi]?.kWh ?? 0;
      }
      if (cRemaining < 0.001) {
        ci++;
        cRemaining = consumers[ci]?.kWh ?? 0;
      }
    }

    return trades;
  }

  get agentCount(): number {
    return this.agents.length;
  }
}
