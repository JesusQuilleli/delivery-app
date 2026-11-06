const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuración de Cloudinary usando variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de Multer Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'delivery_app',
    allowed_formats: ['jpg', 'png', 'webp', 'jpeg'], // F3-25: Se excluye SVG para prevenir XSS
    format: async () => 'webp' // Convertir siempre a webp para optimizar ancho de banda
  }
});

// F3-24 & F3-25: Validación estricta de MIME y bloqueo de SVG
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (file.mimetype === 'image/svg+xml' || file.originalname.toLowerCase().endsWith('.svg')) {
    return cb(new Error('Archivos SVG no están permitidos por motivos de seguridad'), false);
  }
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Tipo de archivo no permitido. Solo se aceptan JPEG, PNG y WEBP'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // F3-24: Máximo 5 MB por archivo
  fileFilter
});

module.exports = { cloudinary, upload };
