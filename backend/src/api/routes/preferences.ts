import type { FastifyInstance } from 'fastify';
import type { PaymentPreferenceRepository } from '../../domain/ports/PaymentPreferenceRepository.js';
import type { PaymentPreference, TokenCategory } from '../../domain/entities/PaymentPreference.js';

const CATEGORIES: TokenCategory[] = ['BRL_STABLE', 'USD_STABLE', 'NATIVE_WRAPPED', 'OTHER'];

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

interface UpsertBody {
  ownerAddress: string;
  receiveTokenAddress: string;
  receiveTokenSymbol: string;
  category: TokenCategory;
  maxSlippageBps?: number;
}

export function registerPreferenceRoutes(
  app: FastifyInstance,
  preferenceRepo: PaymentPreferenceRepository,
): void {
  app.get<{ Params: { ownerAddress: string } }>(
    '/preferences/:ownerAddress',
    async (request, reply) => {
      const owner = request.params.ownerAddress;
      if (!ADDRESS_RE.test(owner)) {
        return reply.status(400).send({ error: 'invalid address' });
      }
      const pref = preferenceRepo.findByOwner(owner);
      if (!pref) return reply.status(404).send({ error: 'preference not set' });
      return pref;
    },
  );

  app.put<{ Body: UpsertBody }>('/preferences', async (request, reply) => {
    const body = request.body;
    if (!body || !ADDRESS_RE.test(body.ownerAddress) || !ADDRESS_RE.test(body.receiveTokenAddress)) {
      return reply.status(400).send({ error: 'invalid address' });
    }
    if (!CATEGORIES.includes(body.category)) {
      return reply.status(400).send({ error: 'invalid category' });
    }
    const slippage = body.maxSlippageBps ?? 50;
    if (slippage < 0 || slippage > 500) {
      return reply.status(400).send({ error: 'maxSlippageBps must be between 0 and 500' });
    }

    const pref: PaymentPreference = {
      ownerAddress: body.ownerAddress.toLowerCase(),
      receiveTokenAddress: body.receiveTokenAddress.toLowerCase(),
      receiveTokenSymbol: body.receiveTokenSymbol,
      category: body.category,
      maxSlippageBps: slippage,
      updatedAt: Date.now(),
    };
    preferenceRepo.upsert(pref);
    return reply.status(200).send(pref);
  });

  app.get('/preferences', async () => preferenceRepo.listAll());
}
