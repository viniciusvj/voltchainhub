import type { FastifyInstance } from 'fastify';
import type { MarketSessionRepository } from '../../domain/ports/MarketSessionRepository.js';

export function registerMarketRoutes(app: FastifyInstance, sessionRepo: MarketSessionRepository): void {
  app.get('/market/price', async () => {
    const latest = sessionRepo.findLatest();
    if (!latest) {
      return { price: null, message: 'No market sessions yet' };
    }
    return {
      price: latest.equilibriumPrice,
      sessionId: latest.id,
      status: latest.status,
      timestamp: latest.startsAt,
    };
  });

  app.get<{ Querystring: { from?: string; to?: string } }>('/market/sessions', async (request) => {
    const from = parseInt(request.query.from || '0', 10);
    const to = parseInt(request.query.to || String(Date.now()), 10);
    return sessionRepo.findByTimeRange(from, to);
  });

  app.get<{ Params: { id: string } }>('/market/sessions/:id', async (request, reply) => {
    const session = sessionRepo.findById(request.params.id);
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }
    return session;
  });
}
