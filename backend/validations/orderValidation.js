const { z } = require('zod');

const placeOrderSchema = z.object({
  store_id: z.coerce.number().int().positive('Tienda requerida'),
  items: z.array(z.object({
    product_id: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a 0')
  })).min(1, 'Debe incluir al menos un producto'),
  delivery_address: z.string().min(5, 'Dirección requerida').max(500),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  payment_method: z.enum(['CASH', 'TRANSFER'], { errorMap: () => ({ message: 'Método de pago inválido' }) }),
  payment_reference: z.string().max(50).optional().nullable()
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'DISPATCHED', 'DELIVERED', 'CANCELLED']),
  cancel_reason: z.string().max(500).optional(),
  driver_id: z.coerce.number().int().positive().optional()
});

const batchStatusSchema = z.object({
  order_ids: z.array(z.coerce.number().int().positive()).min(1).max(50),
  status: z.enum(['ACCEPTED', 'DISPATCHED', 'DELIVERED', 'CANCELLED']),
  cancel_reason: z.string().max(500).optional()
});

module.exports = { placeOrderSchema, updateOrderStatusSchema, batchStatusSchema };
