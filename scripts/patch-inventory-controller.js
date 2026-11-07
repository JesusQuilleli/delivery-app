const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/controllers/inventoryController.js');
let content = fs.readFileSync(filePath, 'utf8');

const target = `const createCategory = async (req, res) => {
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
    });`;

const replacement = `const createCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, image_url } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nombre de la categoría es requerido' });

    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const trimmedName = name.trim();

    // Validar categoría duplicada (case-insensitive) para esta tienda
    const existing = await prisma.category.findFirst({
      where: {
        store_id: store.id,
        name: { equals: trimmedName, mode: 'insensitive' }
      }
    });

    if (existing) {
      return res.status(400).json({ error: \`La categoría "\${trimmedName}" ya existe en esta tienda.\` });
    }

    const category = await prisma.category.create({
      data: {
        store_id: store.id,
        name: trimmedName,
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
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nombre es requerido' });

    const oldCategory = await prisma.category.findUnique({ where: { id: Number(id) } });
    if (!oldCategory) return res.status(404).json({ error: 'Categoría no encontrada' });

    const trimmedName = name.trim();

    // Validar categoría duplicada si cambia el nombre
    const existing = await prisma.category.findFirst({
      where: {
        store_id: oldCategory.store_id,
        name: { equals: trimmedName, mode: 'insensitive' },
        id: { not: Number(id) }
      }
    });

    if (existing) {
      return res.status(400).json({ error: \`La categoría "\${trimmedName}" ya existe en esta tienda.\` });
    }

    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: { 
        name: trimmedName,
        image_url: image_url !== undefined ? image_url : undefined
      }
    });`;

const isCrlf = content.includes('\r\n');
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');

if (!normalizedContent.includes(normalizedTarget)) {
  console.error('Target not found in inventoryController.js!');
  process.exit(1);
}

const newNormalized = normalizedContent.replace(normalizedTarget, replacement);
const finalContent = isCrlf ? newNormalized.replace(/\n/g, '\r\n') : newNormalized;

fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('Successfully updated backend/controllers/inventoryController.js!');
