import type { FastifyInstance } from 'fastify';
import type { DeviceRepository } from '../../domain/ports/DeviceRepository.js';

export function registerDeviceRoutes(app: FastifyInstance, deviceRepo: DeviceRepository): void {
  app.get('/devices', async () => {
    return deviceRepo.findAll();
  });

  app.get<{ Params: { id: string } }>('/devices/:id', async (request, reply) => {
    const device = deviceRepo.findById(request.params.id);
    if (!device) {
      return reply.status(404).send({ error: 'Device not found' });
    }
    return device;
  });
}
