const test = require('node:test');
const assert = require('node:assert/strict');
const { parseReceiptText } = require('../services/receiptOcrService');

test('Receipt OCR Parser (Unit)', async (t) => {
  await t.test('extrae referencia y monto de comprobante Banesco', () => {
    const text = `
      BANESCO BANCO UNIVERSAL
      PAGO MOVIL BANESCO
      Operación Exitosa
      Nro. de Referencia: 00481927
      Monto: Bs. 1.250,50
      Teléfono Destino: 04141234567
    `;
    const res = parseReceiptText(text);
    assert.equal(res.reference, '00481927');
    assert.equal(res.amount, 1250.5);
  });

  await t.test('extrae referencia y monto de comprobante Banco de Venezuela (BDV)', () => {
    const text = `
      BANCO DE VENEZUELA
      PAGOMOVILBDV
      Comprobante de Pago
      Referencia: 981274
      Monto: Bs 750,00
      Fecha: 06/11/2026
    `;
    const res = parseReceiptText(text);
    assert.equal(res.reference, '981274');
    assert.equal(res.amount, 750);
  });

  await t.test('extrae referencia y monto de comprobante Mercantil con aprobación y VES', () => {
    const text = `
      MERCANTIL BANCO
      Tpago
      Aprobación: 384729
      Importe: 450.00 VES
    `;
    const res = parseReceiptText(text);
    assert.equal(res.reference, '384729');
    assert.equal(res.amount, 450);
  });

  await t.test('extrae referencia de 6 dígitos candidata ignorando teléfonos', () => {
    const text = `
      COMPROBANTE TRANSFERENCIA
      Celular: 04121234567
      Destino: 04147654321
      Operación: 654321
      Total: Bs. 80,00
    `;
    const res = parseReceiptText(text);
    assert.equal(res.reference, '654321');
    assert.equal(res.amount, 80);
  });

  await t.test('maneja texto vacío o nulo de forma segura sin excepciones', () => {
    assert.deepEqual(parseReceiptText(null), { reference: null, amount: null, rawText: '' });
    assert.deepEqual(parseReceiptText(''), { reference: null, amount: null, rawText: '' });
    assert.deepEqual(parseReceiptText('Texto sin referencias bancarias'), { reference: null, amount: null, rawText: 'Texto sin referencias bancarias' });
  });
});
