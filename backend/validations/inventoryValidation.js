const { z } = require('zod');

const imageUrl = z.string().max(1000).optional().nullable();

const productFields = {
  name: z.string().min(1, 'El nombre es requerido').max(200),
  price: z.coerce.number('El precio debe ser un número').nonnegative('El precio no puede ser negativo'),
  description: z.string().max(2000).optional().nullable(),
  stock: z.union([z.null(), z.coerce.number().int().nonnegative('El stock no puede ser negativo')]).optional(),
  image_url: imageUrl,
  is_available: z.boolean().optional(),
  category_id: z.union([z.null(), z.coerce.number().int().positive()]).optional()
};

const createProductSchema = z.object(productFields);

const updateProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200).optional(),
  price: z.coerce.number('El precio debe ser un número').nonnegative('El precio no puede ser negativo').optional(),
  description: z.string().max(2000).optional().nullable(),
  stock: z.union([z.null(), z.coerce.number().int().nonnegative('El stock no puede ser negativo')]).optional(),
  image_url: imageUrl,
  is_available: z.boolean().optional(),
  category_id: z.union([z.null(), z.coerce.number().int().positive()]).optional()
});

const createComboSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  price: z.coerce.number('El precio debe ser un número').nonnegative('El precio no puede ser negativo'),
  description: z.string().max(2000).optional().nullable(),
  image_url: imageUrl,
  is_available: z.boolean().optional(),
  combo_items: z.array(z.object({
    product_id: z.coerce.number().int().positive('Producto inválido'),
    quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a 0').optional()
  })).min(1, 'Un combo debe tener al menos un producto')
});

const csvAvailability = z.union([z.boolean(), z.enum(['true', 'false'])]).optional();

const createProductsBulkSchema = z.object({
  products: z.array(z.object({
    name: z.string().min(1, 'El nombre es requerido').max(200),
    price: z.coerce.number('El precio debe ser un número').nonnegative('El precio no puede ser negativo'),
    description: z.string().max(2000).optional().nullable(),
    stock: z.union([z.null(), z.literal(''), z.coerce.number().int().nonnegative('El stock no puede ser negativo')]).optional(),
    is_available: csvAvailability,
    category_id: z.union([z.null(), z.coerce.number().int().positive()]).optional()
  })).min(1, 'No se enviaron productos válidos')
});

const createCategorySchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').max(100),
  image_url: imageUrl
});

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').max(100),
  image_url: imageUrl
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  createComboSchema,
  createProductsBulkSchema,
  createCategorySchema,
  updateCategorySchema
};