const { z } = require('zod');

const checkEmailSchema = z.object({
  email: z.string().min(1, 'El correo es requerido').email('Formato de correo inválido'),
  store_id: z.coerce.number().int().positive().optional()
});

const verifyOtpSchema = z.object({
  email: z.string().email('Formato de correo inválido'),
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
  store_id: z.coerce.number().int().positive('Tienda requerida'),
  name: z.string().max(100).optional(),
  phone: z.string().max(20).optional()
});

const adminLoginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido').max(50),
  password: z.string().min(1, 'La contraseña es requerida').max(100)
});

module.exports = { checkEmailSchema, verifyOtpSchema, adminLoginSchema };
