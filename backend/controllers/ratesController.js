const { getBcvRate } = require('../services/ratesService');

const shape = (rate) => ({
  source: rate.source,
  currency: rate.currency,
  ves_rate: rate.ves_rate,
  fetched_at: new Date(rate.fetched_at).toISOString(),
  cached: rate.cached,
  stale: rate.stale || false
});

const getBcvRateHandler = async (req, res) => {
  try {
    const force = req.query.refresh === '1' || req.query.refresh === 'true';
    const rate = await getBcvRate({ force });
    res.json(shape(rate));
  } catch (error) {
    console.error('Error obteniendo tasa BCV:', error.message);
    res.status(502).json({ error: 'No se pudo obtener la tasa BCV. Puedes ingresarla manualmente.' });
  }
};

module.exports = { getBcvRateHandler, shape };
