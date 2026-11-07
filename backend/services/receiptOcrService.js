const { createWorker } = require('tesseract.js');

/**
 * Parsea el texto extraído de un capture de pago móvil bancario venezolano
 * (Banesco, BDV, Mercantil, Bancamiga, Provincial / BBVA, BNC, Bancaribe, etc.)
 */
function parseReceiptText(text) {
  if (!text || typeof text !== 'string') {
    return { reference: null, amount: null, rawText: '' };
  }

  const clean = text.replace(/[\r\t]/g, ' ');

  // 1. Extraer Número de Referencia (4 a 10 dígitos)
  let reference = null;

  const explicitPatterns = [
    /(?:ref(?:erencia)?|nro\.?\s*ref|n[úu]mero\s*de\s*referencia|n[ºo]\.?\s*ref|operaci[óo]n|aprobaci[óo]n|control|recibo)[:\s#.-]*([0-9]{4,10})\b/i,
    /(?:ref|referencia)[:\s#.-]*([0-9]{4,10})/i,
    /\b(?:nro|n[úu]m|no)\.?\s*([0-9]{6,10})\b/i
  ];

  for (const pat of explicitPatterns) {
    const match = clean.match(pat);
    if (match && match[1]) {
      reference = match[1];
      break;
    }
  }

  // Si no hubo coincidencia explícita, buscar candidato numérico de 6 a 8 dígitos
  if (!reference) {
    const candidateNumbers = clean.match(/\b([0-9]{6,8})\b/g) || [];
    for (const num of candidateNumbers) {
      if (/^(0412|0414|0424|0416|0426|0248|5841)/.test(num)) continue;
      if (/^202[4-9]/.test(num)) continue; // Evitar años
      reference = num;
      break;
    }
  }

  // 2. Extraer Monto en Bolívares
  let amount = null;
  const amountPatterns = [
    /(?:monto|importe|total|pagado|por\s*un\s*monto\s*de)[:\s]*(?:bs\.?|ves)?\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{1,2})|[0-9]+(?:[.,][0-9]{1,2})?)/i,
    /(?:bs\.?|ves)\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{1,2})|[0-9]+(?:[.,][0-9]{1,2})?)/i
  ];

  for (const pat of amountPatterns) {
    const match = clean.match(pat);
    if (match && match[1]) {
      let raw = match[1].trim();
      if (raw.includes('.') && raw.includes(',')) {
        raw = raw.replace(/\./g, '').replace(',', '.');
      } else if (raw.includes(',')) {
        raw = raw.replace(',', '.');
      }
      const parsed = parseFloat(raw);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        break;
      }
    }
  }

  return {
    reference,
    amount,
    rawText: clean.slice(0, 500)
  };
}

/**
 * Ejecuta OCR sobre una imagen (URL o Buffer) con timeout de seguridad
 */
async function extractReceiptData(imageSource, timeoutMs = 12000) {
  let worker = null;
  try {
    const ocrPromise = (async () => {
      worker = await createWorker('spa');
      const ret = await worker.recognize(imageSource);
      return ret.data.text;
    })();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tiempo de espera de OCR excedido')), timeoutMs)
    );

    const text = await Promise.race([ocrPromise, timeoutPromise]);
    return parseReceiptText(text);
  } catch (err) {
    console.warn('[ReceiptOCR] Fallback silencioso ante error de OCR:', err.message);
    return {
      reference: null,
      amount: null,
      rawText: '',
      ocr_error: err.message
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (_) {}
    }
  }
}

module.exports = {
  parseReceiptText,
  extractReceiptData
};
