const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { cloudinary } = require('../config/cloudinary');

// Función auxiliar para extraer el public_id de una URL de Cloudinary
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary')) return null;
  try {
    const parts = url.split('/');
    const file = parts.pop();
    const folder = parts.pop();
    const publicId = file.split('.')[0];
    return `${folder}/${publicId}`;
  } catch (error) {
    return null;
  }
};

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

    res.json({ 
      products, 
      categories, 
      pagination: { currentPage, totalPages, totalItems } 
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
    const { name, price, description, stock, image_url, is_available, category_id } = req.body;
    
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

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
        category_id: category_id ? Number(category_id) : null
      },
      include: { category: true }
    });

    res.json({ message: 'Producto creado exitosamente', product });
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({ error: 'Error interno creando producto' });
  }
};

// Actualizar producto (sirve para editar detalles, toggle is_available o stock)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, stock, image_url, is_available, category_id } = req.body;

    const oldProduct = await prisma.product.findUnique({ where: { id: Number(id) } });

    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (price !== undefined) dataToUpdate.price = Number(price);
    if (description !== undefined) dataToUpdate.description = description;
    if (stock !== undefined) dataToUpdate.stock = stock === null ? null : Number(stock);
    if (image_url !== undefined) dataToUpdate.image_url = image_url;
    if (is_available !== undefined) dataToUpdate.is_available = is_available;
    if (category_id !== undefined) dataToUpdate.category_id = category_id === null ? null : Number(category_id);

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

    res.json({ message: 'Producto actualizado exitosamente', product: updatedProduct });
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

    res.json({ message: 'Combo creado exitosamente', product: comboProduct });
  } catch (error) {
    console.error('Error creando combo:', error);
    res.status(500).json({ error: 'Error interno creando combo' });
  }
};

// Eliminar producto o combo
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener producto para borrar su imagen de Cloudinary
    const product = await prisma.product.findUnique({ where: { id: Number(id) } });

    // Primero eliminar comboItems relacionados si es un combo (o si es parte de un combo)
    await prisma.comboItem.deleteMany({
      where: {
        OR: [
          { combo_id: Number(id) },
          { product_id: Number(id) }
        ]
      }
    });

    // Luego borrar el producto
    await prisma.product.delete({
      where: { id: Number(id) }
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
  updateProduct,
  createCombo,
  deleteProduct,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
