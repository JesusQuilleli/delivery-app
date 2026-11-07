const fs = require('fs');

const path = 'backend/controllers/orderController.js';
let content = fs.readFileSync(path, 'utf8');

const target = '    console.error(\'Error al procesar pedido:\', error);\r\n    res.status(500).json({ error: \'Error interno al procesar el pedido\' });';

const replacement = `    console.error('Error al procesar pedido:', error);
    const clientMsg = error.message && !error.message.includes('\\n') && !error.message.toLowerCase().includes('prisma')
      ? error.message
      : 'Error interno al procesar el pedido. Por favor verifica los datos ingresados o el comprobante.';
    res.status(500).json({ error: clientMsg });`.replace(/\n/g, '\r\n');

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully patched orderController.js');
} else {
  console.log('Target not found in orderController.js');
}
