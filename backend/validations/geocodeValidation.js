const { z } = require('zod');

const autocompleteQuerySchema = z.object({
  q: z.string().trim().min(3, 'Escribe al menos 3 caracteres').max(160),
  slug: z.string().trim().min(1).max(80).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional()
});

const reverseQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180)
});

module.exports = { autocompleteQuerySchema, reverseQuerySchema };
