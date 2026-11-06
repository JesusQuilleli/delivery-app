const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { requireAuth } = require('../middleware/authMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');

// F2C-02: Permitir subida a usuarios autenticados (clientes para récipes médicos y administradores para catálogo)
router.post('/', requireAuth, uploadLimiter, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Error en la subida de imagen' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ninguna imagen' });
    }
    res.json({ imageUrl: req.file.path });
  });
});

module.exports = router;
