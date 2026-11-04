const BCV_URL = process.env.BCV_RATE_URL || 'https://ve.dolarapi.com/v1/dolares/oficial';
const CACHE_TTL_MS = Number(process.env.BCV_CACHE_TTL_MS) || 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = Number(process.env.BCV_FETCH_TIMEOUT_MS) || 8000;

let cache = null;
let inflight = null;

const isFresh = (entry) => Boolean(entry) && Date.now() - entry.fetched_at < CACHE_TTL_MS;

async function fetchBcvRate() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(BCV_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`BCV respondió ${response.status}`);
    }

    const data = await response.json();
    const rate = Number(data?.promedio);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error('Tasa BCV inválida');
    }

    return { source: 'dolarapi', currency: 'VES', ves_rate: rate };
  } finally {
    clearTimeout(timer);
  }
}

async function getBcvRate({ force = false } = {}) {
  if (!force && isFresh(cache)) {
    return { ...cache, cached: true };
  }

  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const fresh = await fetchBcvRate();
      cache = { ...fresh, fetched_at: Date.now() };
      return { ...cache, cached: false };
    } catch (error) {
      if (cache) {
        return { ...cache, cached: true, stale: true, error: error.message };
      }
      throw error;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

const clearCache = () => {
  cache = null;
  inflight = null;
};

module.exports = { getBcvRate, clearCache, CACHE_TTL_MS };
