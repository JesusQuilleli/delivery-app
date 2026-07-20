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
    folder: 'delivery_app', // Carpeta en Cloudinary
    allowed_formats: ['jpg', 'png', 'webp', 'jpeg', 'gif', 'svg'], // Formatos permitidos
    format: async (req, file) => 'webp', // Convertir siempre a webp
    // Podemos usar un identificador único para cada archivo, pero Cloudinary lo genera automáticamente
  },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
