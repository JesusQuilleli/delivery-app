export const formatPrice = (price: number, currency: string = 'USD') => {
  if (currency === 'USD') return `$${price.toFixed(2)}`;
  if (currency === 'VES') return `Bs. ${price.toFixed(2)}`;
  if (currency === 'COP') return `$${price.toLocaleString('es-CO')} COP`;
  return `$${price.toFixed(2)}`;
};

export const getConversions = (price: number, store: any) => {
  if (!store) return null;
  
  const base = store.currency || 'USD';
  const usdRate = store.usd_rate || 1;
  const vesRate = store.ves_rate || 36.5;
  const copRate = store.cop_rate || 4000;

  const conversions: Record<string, string> = {};

  if (base !== 'USD') conversions['USD'] = formatPrice(price * usdRate, 'USD');
  if (base !== 'VES') conversions['VES'] = formatPrice(price * vesRate, 'VES');
  if (base !== 'COP') conversions['COP'] = formatPrice(price * copRate, 'COP');

  return conversions;
};
