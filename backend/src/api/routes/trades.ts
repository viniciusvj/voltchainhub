import type { FastifyInstance } from 'fastify';
import type { TradeRepository } from '../../domain/ports/TradeRepository.js';
import type { BlockchainGateway } from '../../domain/ports/BlockchainGateway.js';

export function registerTradeRoutes(
  app: FastifyInstance,
  tradeRepo: TradeRepository,
  blockchain: BlockchainGateway,
): void {
  app.get<{ Querystring: { participant?: string; limit?: string } }>('/trades', async (request) => {
    const limit = Math.min(parseInt(request.query.limit || '50', 10), 500);
    if (request.query.participant) {
      return tradeRepo.findByParticipant(request.query.participant, limit);
    }
    return tradeRepo.findRecent(limit);
  });

  app.get<{ Params: { id: string } }>('/trades/:id', async (request, reply) => {
    const trade = tradeRepo.findById(request.params.id);
    if (!trade) {
      return reply.status(404).send({ error: 'Trade not found' });
    }
    return trade;
  });

  app.post<{ Body: { sessionId: string; seller: string; buyer: string; kWh: number; pricePerKWh: number } }>(
    '/trades',
    async (request, reply) => {
      const { sessionId, seller, buyer, kWh, pricePerKWh } = request.body;
      if (!sessionId || !seller || !buyer || !kWh || !pricePerKWh) {
        return reply.status(400).send({ error: 'Missing required fields: sessionId, seller, buyer, kWh, pricePerKWh' });
      }

      const trade = {
        id: crypto.randomUUID(),
        sessionId,
        seller,
        buyer,
        kWh,
        pricePerKWh,
        status: 'pending' as const,
        txHash: null,
        createdAt: Date.now(),
        settledAt: null,
      };

      tradeRepo.save(trade);

      try {
        const { txHash } = await blockchain.lockEscrow(buyer, seller, kWh, pricePerKWh);
        tradeRepo.updateStatus(trade.id, 'locked', txHash);
        trade.status = 'locked';
        trade.txHash = txHash;
      } catch {
        // Escrow lock failed, trade stays pending
      }

      return reply.status(201).send(trade);
    },
  );

  app.get<{ Params: { addr: string } }>('/balance/:addr', async (request) => {
    const balance = await blockchain.getBalance(request.params.addr);
    return { address: request.params.addr, ...balance };
  });
}
