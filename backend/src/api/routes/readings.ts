import type { FastifyInstance } from 'fastify';
import type { ReadingRepository } from '../../domain/ports/ReadingRepository.js';

export function registerReadingRoutes(app: FastifyInstance, readingRepo: ReadingRepository): void {
  app.get<{ Params: { id: string } }>('/readings/:id', async (request, reply) => {
    const reading = readingRepo.findById(request.params.id);
    if (!reading) {
      return reply.status(404).send({ error: 'Reading not found' });
    }
    return reading;
  });

  app.get<{ Querystring: { deviceId?: string; limit?: string } }>('/readings', async (request) => {
    const limit = Math.min(parseInt(request.query.limit || '50', 10), 500);
    if (request.query.deviceId) {
      return readingRepo.findByDevice(request.query.deviceId, limit);
    }
    return readingRepo.findRecent(limit);
  });
}
