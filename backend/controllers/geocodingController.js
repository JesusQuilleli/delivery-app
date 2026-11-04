const prisma = require('../prismaClient');
const { autocomplete, reverse, DEFAULT_CENTER } = require('../services/geocodingService');
const { autocompleteQuerySchema, reverseQuerySchema } = require('../validations/geocodeValidation');

const autocompleteAddress = async (req, res) => {
  try {
    const parsed = autocompleteQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const issues = parsed.error.issues ?? parsed.error.errors ?? [];
      return res.status(400).json({ error: issues.map((issue) => issue.message).join(', ') });
    }

    const { q, slug } = parsed.data;
    let center = DEFAULT_CENTER;

    if (slug) {
      const store = await prisma.store.findUnique({
        where: { slug },
        select: { is_active: true, latitude: true, longitude: true }
      });
      if (!store || !store.is_active) {
        return res.status(404).json({ error: 'Tienda no disponible' });
      }
      if (store.latitude !== null && store.longitude !== null) {
        center = { latitude: store.latitude, longitude: store.longitude };
      }
    } else if (parsed.data.latitude !== undefined && parsed.data.longitude !== undefined) {
      center = { latitude: parsed.data.latitude, longitude: parsed.data.longitude };
    }

    const payload = await autocomplete(q, center);
    res.json(payload);
  } catch (error) {
    console.error('Error en autocompletado de direcciones:', error);
    res.status(502).json({ error: 'No se pudo buscar la dirección. Intenta de nuevo o ajusta el pin en el mapa.' });
  }
};

const reverseAddress = async (req, res) => {
  try {
    const parsed = reverseQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const issues = parsed.error.issues ?? parsed.error.errors ?? [];
      return res.status(400).json({ error: issues.map((issue) => issue.message).join(', ') });
    }

    const result = await reverse(parsed.data.latitude, parsed.data.longitude);
    res.json(result);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error en geocodificación inversa:', error);
    res.status(502).json({ error: 'No se pudo obtener la dirección. Ajusta el pin manualmente.' });
  }
};

module.exports = { autocompleteAddress, reverseAddress };
