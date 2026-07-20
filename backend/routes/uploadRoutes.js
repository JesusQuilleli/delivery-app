const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { requireAdmin } = require('../middleware/authMiddleware');

// Endpoint para subir una imagen (solo accesible para admins)
// Retorna la URL pública de la imagen en Cloudinary
router.post('/', requireAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ninguna imagen' });
    }
    // req.file.path contiene la URL pública generada por Cloudinary (formato WebP)
    res.json({ imageUrl: req.file.path });
  } catch (error) {
    console.error('Error en la subida de imagen:', error);
    res.status(500).json({ error: 'Error interno subiendo la imagen' });
  }
});

module.exports = router;
