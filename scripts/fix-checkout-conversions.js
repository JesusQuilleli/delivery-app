const fs = require('fs');

const path = 'frontend/src/pages/Checkout.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add expectedVes definition after grandTotal
const grandTotalLine = '  const grandTotal = total + deliveryFee;\n  const isTransferReferenceValid = /^\\d{4,10}$/.test(paymentReference);';
const grandTotalLineCRLF = '  const grandTotal = total + deliveryFee;\r\n  const isTransferReferenceValid = /^\\d{4,10}$/.test(paymentReference);';

const expectedVesBlock = `  const grandTotal = total + deliveryFee;
  const expectedVes = (() => {
    if (!storeConfig) return 0;
    const vesRate = Number(storeConfig.ves_rate) || 36.5;
    const base = storeConfig.currency || 'USD';
    if (base === 'VES') return grandTotal;
    const usdRate = Number(storeConfig.usd_rate) || 1.0;
    return (grandTotal / usdRate) * vesRate;
  })();
  const isTransferReferenceValid = /^\\d{4,10}$/.test(paymentReference);`;

if (content.includes(grandTotalLineCRLF)) {
  content = content.replace(grandTotalLineCRLF, expectedVesBlock.replace(/\n/g, '\r\n'));
  console.log('Added expectedVes definition (CRLF)');
} else if (content.includes(grandTotalLine)) {
  content = content.replace(grandTotalLine, expectedVesBlock);
  console.log('Added expectedVes definition (LF)');
} else {
  console.warn('grandTotalLine not found');
}

// 2. Replace all conversions.ves with expectedVes
content = content.replace(/\(conversions\.ves \|\| 0\)/g, 'expectedVes');
content = content.replace(/conversions\.ves/g, 'expectedVes');

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully patched Checkout.tsx');
