import { z } from 'zod';

export const readingPayloadSchema = z.object({
  deviceId: z.string().min(1),
  wattsH: z.number(),
  timestamp: z.number().int().positive(),
  nonce: z.number().int().nonnegative(),
  signature: z.object({
    r: z.string().regex(/^[0-9a-fA-F]{64}$/, 'Signature r must be 32-byte hex'),
    s: z.string().regex(/^[0-9a-fA-F]{64}$/, 'Signature s must be 32-byte hex'),
  }),
});

export type ReadingPayloadInput = z.infer<typeof readingPayloadSchema>;
