const { z } = require('zod');

const storeSettingsSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  industry: z.enum(['RESTAURANT', 'SUPERMARKET', 'PHARMACY']).optional(),
  theme_color: z.string().trim().max(30).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  currency: z.enum(['USD', 'VES', 'COP']).optional(),
  usd_rate: z.number().positive().optional(),
  ves_rate: z.number().positive().optional(),
  cop_rate: z.number().positive().optional(),
  delivery_fee: z.number().min(0).optional(),
  bank_name: z.string().trim().max(100).nullable().optional(),
  bank_code: z.string().trim().max(20).nullable().optional(),
  bank_phone: z.string().trim().max(30).nullable().optional(),
  bank_id_number: z.string().trim().max(30).nullable().optional(),
  bank_holder: z.string().trim().max(100).nullable().optional(),
  payment_note: z.string().trim().max(300).nullable().optional()
});

const driverSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  phone: z.string().trim().min(7, 'El teléfono debe ser válido').max(30),
  vehicle_plate: z.string().trim().max(20).nullable().optional(),
  is_active: z.boolean().optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
});

const superadminStoreSchema = z.object({
  storeName: z.string().trim().min(2, 'Nombre de tienda requerido').max(100),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, 'El slug solo permite minúsculas, números y guiones'),
  adminUsername: z.string().trim().min(3, 'Usuario administrador requerido').max(50),
  adminPassword: z.string().min(6, 'Contraseña de al menos 6 caracteres'),
  adminPhone: z.string().trim().min(7, 'Teléfono requerido'),
  industry: z.enum(['RESTAURANT', 'SUPERMARKET', 'PHARMACY']).optional(),
  theme_color: z.string().trim().max(30).optional(),
  plan: z.enum(['EMPRENDEDOR', 'NEGOCIO', 'PRO']).optional(),
  trialDays: z.number().int().min(1).max(365).optional()
});

module.exports = {
  storeSettingsSchema,
  driverSchema,
  changePasswordSchema,
  superadminStoreSchema
};
