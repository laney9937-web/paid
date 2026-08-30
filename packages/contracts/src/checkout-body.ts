import { z } from 'zod';

export const checkoutBodySchema = z
  .object({
    shareId: z.string().trim().min(8).max(128),
  })
  .strict();
