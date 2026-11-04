const toNumber = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatPrice = (price: number | string, currency: string = 'USD') => {
  const amount = toNumber(price);

  if (currency === 'VES') {
    return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === 'COP') {
    return `$${Math.round(amount).toLocaleString('es-CO')} COP`;
  }
  return `$${amount.toFixed(2)}`;
};

interface StoreRates {
  currency?: string;
  usd_rate?: number | string;
  ves_rate?: number | string;
  cop_rate?: number | string;
}

export const getConversions = (price: number | string, store: StoreRates | null | undefined) => {
  if (!store) return null;

  const base = store.currency || 'USD';
  const amount = toNumber(price);
  const rates: Record<string, number> = {
    USD: 1,
    VES: toNumber(store.ves_rate) || 36.5,
    COP: toNumber(store.cop_rate) || 4000
  };

  const baseRate = rates[base] || 1;
  const amountInUsd = amount / baseRate;

  const conversions: Record<string, string> = {};
  for (const target of ['USD', 'VES', 'COP']) {
    if (target === base) continue;
    conversions[target] = formatPrice(amountInUsd * rates[target], target);
  }

  return conversions;
};
