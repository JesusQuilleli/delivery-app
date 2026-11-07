const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { cloudinary } = require('../config/cloudinary');
const { formatProductWithStock } = require('../utils/inventory');
const { getPlan } = require('../config/plans');

const { getPublicIdFromUrl, deleteFromCloudinary } = require('../utils/cloudinaryCleaner');

// Obtener inventario de una tienda (productos y combos)
const getInventory = async (req, res) => {
  try {
    const { slug } = req.params;
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const { search, page, limit, tab } = req.query;

    let totalPages = 1;
    let currentPage = 1;
    let totalItems = 0;
    
    let products = [];
    let categories = [];

    if (page && limit) {
      currentPage = Number(page);
      const parsedLimit = Number(limit);
      const skip = (currentPage - 1) * parsedLimit;

      if (tab === 'categories') {
        let whereClause = { store_id: store.id };
        if (search) {
          whereClause.name = { contains: search, mode: 'insensitive' };
        }
        const [count, paginatedCategories] = await prisma.$transaction([
          prisma.category.count({ where: whereClause }),
          prisma.category.findMany({
            where: whereClause,
            skip,
            take: parsedLimit,
            orderBy: { id: 'asc' }
          })
        ]);
        categories = paginatedCategories;
        totalItems = count;
        totalPages = Math.ceil(count / parsedLimit);
      } else {
        let whereClause = { store_id: store.id };
        if (tab === 'combos') {
          whereClause.is_combo = true;
        } else if (tab === 'products') {
          whereClause.is_combo = false;
        }

        if (search) {
          whereClause.name = { contains: search, mode: 'insensitive' };
        }

        const [count, paginatedProducts] = await prisma.$transaction([
          prisma.product.count({ where: whereClause }),
          prisma.product.findMany({
            where: whereClause,
            include: {
              comboItems: { include: { product: true } },
              category: true
            },
            skip,
            take: parsedLimit,
            orderBy: { id: 'desc' }
          })
        ]);
        products = paginatedProducts;
        totalItems = count;
        totalPages = Math.ceil(count / parsedLimit);
      }
    } else {
      // Fallback si no hay paginación
      products = await prisma.product.findMany({
        where: { store_id: store.id },
        include: {
          comboItems: { include: { product: true } },
          category: true
        },
        orderBy: { id: 'desc' }
      });
      categories = await prisma.category.findMany({
        where: { store_id: store.id },
        orderBy: { id: 'asc' }
      });
    }

    const formattedProducts = products.map(formatProductWithStock);
    const lowStockCount = formattedProducts.filter(p => p.is_low_stock).length;

    res.json({ 
      products: formattedProducts, 
      categories, 
      pagination: { currentPage, totalPages, totalItems, lowStockCount } 
    });
  } catch (error) {
    console.error('Error obteniendo inventario:', error);
    res.status(500).json({ error: 'Error interno obteniendo inventario' });
  }
};

// Crear producto individual
const createProduct = async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, price, description, stock, image_url, is_available, category_id, requires_prescription, prescription_type, lot_number, expires_at } = req.body;
    
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    // F2B-05: Límite de productos por plan SaaS
    const plan = getPlan(store.plan);
    const productCount = await prisma.product.count({ where: { store_id: store.id } });
    if (productCount >= plan.maxProducts) {
      return res.status(403).json({
        error: `Has alcanzado el límite de productos de tu plan (${plan.name}: máximo ${plan.maxProducts} productos). Actualiza tu plan para agregar más productos.`
      });
    }

    if (stock !== undefined && stock !== null && Number(stock) < 0) {
      return res.status(400).json({ error: 'El stock no puede ser negativo.' });
    }

    if (category_id !== undefined && category_id !== null && category_id !== '') {
      const cat = await prisma.category.findFirst({
        where: { id: Number(category_id), store_id: store.id }
      });
      if (!cat) {
        return res.status(400).json({ error: 'La categoría no existe o no pertenece a esta tienda.' });
      }
    }

    let resolvedPrescriptionType = prescription_type || (requires_prescription ? 'RETAIN_ORIGINAL' : 'NONE');
    if (!['NONE', 'SHOW_ONLY', 'RETAIN_ORIGINAL'].includes(resolvedPrescriptionType)) {
      resolvedPrescriptionType = 'NONE';
    }
    const resolvedRequiresPrescription = resolvedPrescriptionType !== 'NONE';

    const product = await prisma.product.create({
      data: {
        store_id: store.id,
        name,
        price: Number(price),
        description: description || null,
        stock: stock !== undefined && stock !== null ? Number(stock) : null,
        image_url: image_url || null,
        is_available: is_available !== undefined ? is_available : true,
        is_combo: false,
        category_id: category_id ? Number(category_id) : null,
        requires_prescription: resolvedRequiresPrescription,
        prescription_type: resolvedPrescriptionType,
        lot_number: lot_number ? String(lot_number).trim() : null,
        expires_at: expires_at ? new Date(expires_at) : null
      },
      include: { category: true }
    });

    res.json({ message: 'Producto creado exitosamente', product: formatProductWithStock(product) });
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({ error: 'Error interno creando producto' });
  }
};

// Crear productos masivamente
const createProductsBulk = async (req, res) => {
  try {
    const { slug } = req.params;
    const { products } = req.body; // array de objetos product
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'No se enviaron productos válidos' });
    }

    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    // F2B-05: Límite de productos por plan SaaS
    const plan = getPlan(store.plan);
    const productCount = await prisma.product.count({ where: { store_id: store.id } });
    if (productCount + products.length > plan.maxProducts) {
      return res.status(403).json({
        error: `Esta importación (${products.length} productos) excede el límite de tu plan (${plan.name}: máximo ${plan.maxProducts}, existentes: ${productCount}).`
      });
    }

    // F2-14: Validar categorías si se especificaron
    const categoryIds = [...new Set(products.map(p => p.category_id).filter(id => id !== undefined && id !== null && id !== ''))].map(Number);
    if (categoryIds.length > 0) {
      const existingCategories = await prisma.category.findMany({
        where: { id: { in: categoryIds }, store_id: store.id },
        select: { id: true }
      });
      if (existingCategories.length !== categoryIds.length) {
        return res.status(400).json({ error: 'Una o más categorías no existen o no pertenecen a esta tienda.' });
      }
    }

    // F2-18: Validar que no haya stocks negativos
    for (const p of products) {
      if (p.stock !== undefined && p.stock !== null && p.stock !== '' && Number(p.stock) < 0) {
        return res.status(400).json({ error: `El producto "${p.name}" tiene un stock negativo inválido.` });
      }
    }

    // Mapear los productos
    const dataToInsert = products.map(p => ({
      store_id: store.id,
      name: p.name,
      price: Number(p.price) || 0,
      description: p.description || null,
      stock: p.stock !== undefined && p.stock !== null && p.stock !== '' ? Number(p.stock) : null,
      is_available: p.is_available !== undefined ? Boolean(p.is_available) : true,
      is_combo: false,
      category_id: p.category_id ? Number(p.category_id) : null
    }));

    const result = await prisma.product.createMany({
      data: dataToInsert,
      skipDuplicates: true
    });

    res.json({ message: 'Productos creados masivamente', count: result.count });
  } catch (error) {
    console.error('Error creando productos masivamente:', error);
    res.status(500).json({ error: 'Error interno creando productos' });
  }
};

// Actualizar producto (sirve para editar detalles, toggle is_available o stock)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, stock, image_url, is_available, category_id, requires_prescription, prescription_type, lot_number, expires_at } = req.body;

    const oldProduct = await prisma.product.findUnique({ where: { id: Number(id) } });
    if (!oldProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // F2-18: Evitar stock negativo
    if (stock !== undefined && stock !== null && Number(stock) < 0) {
      return res.status(400).json({ error: 'El stock no puede ser negativo.' });
    }

    // F2-14: Validar pertenencia de categoría a la tienda
    if (category_id !== undefined && category_id !== null && category_id !== '') {
      const cat = await prisma.category.findFirst({
        where: { id: Number(category_id), store_id: oldProduct.store_id }
      });
      if (!cat) {
        return res.status(400).json({ error: 'La categoría especificada no existe o no pertenece a esta tienda.' });
      }
    }

    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (price !== undefined) dataToUpdate.price = Number(price);
    if (description !== undefined) dataToUpdate.description = description;
    if (stock !== undefined) dataToUpdate.stock = stock === null ? null : Number(stock);
    if (image_url !== undefined) dataToUpdate.image_url = image_url;
    if (is_available !== undefined) dataToUpdate.is_available = is_available;
    if (category_id !== undefined) dataToUpdate.category_id = category_id === null ? null : Number(category_id);
    if (prescription_type !== undefined) {
      const validTypes = ['NONE', 'SHOW_ONLY', 'RETAIN_ORIGINAL'];
      const pType = validTypes.includes(prescription_type) ? prescription_type : 'NONE';
      dataToUpdate.prescription_type = pType;
      dataToUpdate.requires_prescription = pType !== 'NONE';
    } else if (requires_prescription !== undefined) {
      const isReq = Boolean(requires_prescription);
      dataToUpdate.requires_prescription = isReq;
      if (!isReq) dataToUpdate.prescription_type = 'NONE';
      else if (oldProduct.prescription_type === 'NONE') dataToUpdate.prescription_type = 'RETAIN_ORIGINAL';
    }
    if (lot_number !== undefined) dataToUpdate.lot_number = lot_number ? String(lot_number).trim() : null;
    if (expires_at !== undefined) dataToUpdate.expires_at = expires_at ? new Date(expires_at) : null;

    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: dataToUpdate,
      include: {
        comboItems: { include: { product: true } },
        category: true
      }
    });

    // Si la imagen cambió, borrar la anterior
    if (oldProduct && oldProduct.image_url && image_url !== undefined && image_url !== oldProduct.image_url) {
      const publicId = getPublicIdFromUrl(oldProduct.image_url);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId).catch(e => console.error('Error borrando imagen anterior (producto):', e));
      }
    }

    res.json({ message: 'Producto actualizado exitosamente', product: formatProductWithStock(updatedProduct) });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({ error: 'Error interno actualizando producto' });
  }
};

// Crear combo (producto que agrupa a otros)
const createCombo = async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, price, description, image_url, is_available, combo_items } = req.body;
    
    // combo_items debe ser un array de { product_id, quantity }
    if (!combo_items || !Array.isArray(combo_items) || combo_items.length === 0) {
      return res.status(400).json({ error: 'Un combo debe tener al menos un producto.' });
    }

    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    // F2B-05: Límite de productos por plan SaaS (los combos cuentan como producto)
    const plan = getPlan(store.plan);
    const productCount = await prisma.product.count({ where: { store_id: store.id } });
    if (productCount >= plan.maxProducts) {
      return res.status(403).json({
        error: `Has alcanzado el límite de productos de tu plan (${plan.name}: máximo ${plan.maxProducts} productos). Actualiza tu plan para agregar más combos.`
      });
    }

    // F2-15: Validar que todos los componentes pertenezcan a la tienda y no sean combos
    const componentIds = combo_items.map(item => Number(item.product_id));
    const uniqueComponentIds = [...new Set(componentIds)];
    const components = await prisma.product.findMany({
      where: {
        id: { in: uniqueComponentIds },
        store_id: store.id
      }
    });

    if (components.length !== uniqueComponentIds.length) {
      return res.status(400).json({ error: 'Uno o más componentes del combo no existen o no pertenecen a esta tienda.' });
    }

    if (components.some(c => c.is_combo)) {
      return res.status(400).json({ error: 'Un combo no puede contener otro combo como componente.' });
    }

    // Se crea el producto padre con is_combo = true
    const comboProduct = await prisma.product.create({
      data: {
        store_id: store.id,
        name,
        price: Number(price),
        description: description || null,
        image_url: image_url || null,
        is_available: is_available !== undefined ? is_available : true,
        is_combo: true,
        comboItems: {
          create: combo_items.map(item => ({
            product_id: Number(item.product_id),
            quantity: item.quantity ? Number(item.quantity) : 1
          }))
        }
      },
      include: {
        comboItems: { include: { product: true } }
      }
    });

    res.json({ message: 'Combo creado exitosamente', product: formatProductWithStock(comboProduct) });
  } catch (error) {
    console.error('Error creando combo:', error);
    res.status(500).json({ error: 'Error interno creando combo' });
  }
};

// Eliminar producto o combo
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productId = Number(id);
    
    // Obtener producto para borrar su imagen de Cloudinary
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // F2-19: Si es un producto normal y forma parte de un combo activo, bloquear eliminación
    if (!product.is_combo) {
      const usedInCombos = await prisma.comboItem.findMany({
        where: { product_id: productId },
        include: { combo: true }
      });
      if (usedInCombos.length > 0) {
        const comboNames = usedInCombos.map(ci => ci.combo?.name || `#${ci.combo_id}`).join(', ');
        return res.status(400).json({
          error: `No se puede eliminar el producto porque forma parte de los combos: ${comboNames}. Elimina o edita los combos primero.`
        });
      }
    }

    // Si es un combo, eliminar comboItems relacionados
    if (product.is_combo) {
      await prisma.comboItem.deleteMany({
        where: { combo_id: productId }
      });
    }

    // Luego borrar el producto
    await prisma.product.delete({
      where: { id: productId }
    });

    // Borrar imagen de Cloudinary
    if (product && product.image_url) {
      const publicId = getPublicIdFromUrl(product.image_url);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId).catch(e => console.error('Error eliminando imagen de Cloudinary:', e));
      }
    }

    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ error: 'No se pudo eliminar el producto porque está siendo referenciado en órdenes existentes u otro error ocurrió.' });
  }
};

// ================= CATEGORÍAS ================= //

const getCategories = async (req, res) => {
  try {
    const { slug } = req.params;
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const categories = await prisma.category.findMany({
      where: { store_id: store.id },
      orderBy: { id: 'asc' }
    });
    res.json({ categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo categorías' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, image_url } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre es requerido' });

    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const category = await prisma.category.create({
      data: {
        store_id: store.id,
        name,
        image_url: image_url || null
      }
    });
    res.json({ category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando categoría' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image_url } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre es requerido' });

    const oldCategory = await prisma.category.findUnique({ where: { id: Number(id) } });

    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: { 
        name,
        image_url: image_url !== undefined ? image_url : undefined
      }
    });

    // Si la imagen cambió, borrar la anterior
    if (oldCategory && oldCategory.image_url && image_url !== undefined && image_url !== oldCategory.image_url) {
      const publicId = getPublicIdFromUrl(oldCategory.image_url);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId).catch(e => console.error('Error borrando imagen anterior (categoría):', e));
      }
    }

    res.json({ category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error actualizando categoría' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener categoría y sus productos para borrar imágenes
    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
      include: { products: true }
    });

    await prisma.category.delete({
      where: { id: Number(id) }
    });

    // Los productos se eliminan en cascada gracias a onDelete: Cascade en Prisma
    // Ahora borramos las imágenes de Cloudinary
    if (category) {
      if (category.image_url) {
        const publicId = getPublicIdFromUrl(category.image_url);
        if (publicId) await cloudinary.uploader.destroy(publicId).catch(e => console.error(e));
      }
      for (const prod of category.products) {
        if (prod.image_url) {
          const publicId = getPublicIdFromUrl(prod.image_url);
          if (publicId) await cloudinary.uploader.destroy(publicId).catch(e => console.error(e));
        }
      }
    }

    res.json({ message: 'Categoría y sus productos eliminados exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error eliminando categoría' });
  }
};

module.exports = {
  getInventory,
  createProduct,
  createProductsBulk,
  updateProduct,
  createCombo,
  deleteProduct,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
