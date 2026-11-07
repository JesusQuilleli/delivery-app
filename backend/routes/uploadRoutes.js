const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { requireAuth } = require('../middleware/authMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { extractReceiptData } = require('../services/receiptOcrService');

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

// F2G-04 y F2G-05: Subida de capture de Pago Móvil con extracción OCR asistida
router.post('/receipt', requireAuth, uploadLimiter, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Error en la subida del comprobante' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún comprobante' });
    }

    const imageUrl = req.file.path;
    let extracted = { reference: null, amount: null };

    try {
      extracted = await extractReceiptData(imageUrl);
    } catch (ocrErr) {
      console.warn('Error en OCR de recibo:', ocrErr.message);
    }

    res.json({
      imageUrl,
      extracted
    });
  });
});

module.exports = router;
