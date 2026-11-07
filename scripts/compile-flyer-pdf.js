const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

const edge = edgePaths.find(p => fs.existsSync(p));
if (!edge) {
  console.error('Edge not found');
  process.exit(1);
}

const htmlPath = path.resolve('docs/marketing/Flyer_Promocional_TiendaFast.html');
const pdfPath = path.resolve('Flyer_Promocional_TiendaFast.pdf');

const cmd = `"${edge}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "file:///${htmlPath.replace(/\\/g, '/')}"`;
console.log('Running:', cmd);
execSync(cmd, { stdio: 'inherit' });

if (fs.existsSync(pdfPath)) {
  console.log(`✅ PDF generado exitosamente: ${pdfPath} (${fs.statSync(pdfPath).size} bytes)`);
} else {
  console.error('❌ No se encontró el PDF generado.');
}
