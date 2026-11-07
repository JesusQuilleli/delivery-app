const fs = require('fs');
const path = require('path');

// 1. Patch Propuesta_Comercial_TiendaFast_Socio.html
const socioPath = path.join(__dirname, '..', 'docs', 'Propuesta_Comercial_TiendaFast_Socio.html');
let socioHtml = fs.readFileSync(socioPath, 'utf8');

socioHtml = socioHtml.replace(
  '<div class="plan-price">$9 <span>/ mes</span></div>',
  '<div class="plan-price">Inicial <span>/ A tu medida</span></div>'
);
socioHtml = socioHtml.replace(
  '<div class="plan-price">$19 <span>/ mes</span></div>',
  '<div class="plan-price">Crecimiento <span>/ Recomendado</span></div>'
);
socioHtml = socioHtml.replace(
  '<div class="plan-price">$35 <span>/ mes</span></div>',
  '<div class="plan-price">Corporativo <span>/ Alto Volumen</span></div>'
);

socioHtml = socioHtml.replace(
  'Por menos de lo que gastas en una cena o una recarga de teléfono al mes ($9 a $19), tu negocio tiene su propia página web profesional',
  'Por una inversión mensual accesible y adaptada a tu escala, tu negocio tiene su propia página web profesional'
);

fs.writeFileSync(socioPath, socioHtml, 'utf8');
console.log('Successfully patched Propuesta_Comercial_TiendaFast_Socio.html!');

// 2. Patch Guia_Maestra_TiendaFast_Dueno.html
const duenoPath = path.join(__dirname, '..', 'docs', 'Guia_Maestra_TiendaFast_Dueno.html');
let duenoHtml = fs.readFileSync(duenoPath, 'utf8');

duenoHtml = duenoHtml.replace(
  'Asigna Plan Emprendedor ($9), Negocio ($19) o Pro ($35), con 30 días de prueba gratuita.',
  'Asigna Plan Emprendedor, Negocio o Pro, con días de prueba gratuita y planes a la medida del comercio.'
);

duenoHtml = duenoHtml.replace(
  '<th>Precio / Mes</th>',
  '<th>Nivel / Escala</th>'
);

duenoHtml = duenoHtml.replace('<td>$9 USD</td>', '<td><span style="color:#059669; font-weight:700;">Plan Inicial</span></td>');
duenoHtml = duenoHtml.replace('<td>$19 USD</td>', '<td><span style="color:#2563eb; font-weight:700;">Más Popular</span></td>');
duenoHtml = duenoHtml.replace('<td>$35 USD</td>', '<td><span style="color:#7c3aed; font-weight:700;">Corporativo</span></td>');

fs.writeFileSync(duenoPath, duenoHtml, 'utf8');
console.log('Successfully patched Guia_Maestra_TiendaFast_Dueno.html!');
