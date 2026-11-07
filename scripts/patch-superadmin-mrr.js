const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'SuperAdmin.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = `<p className="text-xs uppercase tracking-wider font-bold opacity-90">MRR Mensual</p>`;
if (content.includes(target)) {
  content = content.replace(
    `<p className="text-xs uppercase tracking-wider font-bold opacity-90">MRR Mensual</p>
                    <h3 className="text-3xl font-black mt-1">\${summary.mrr} <span className="text-xs font-normal opacity-80">USD/mes</span></h3>
                  </div>
                  <div className="p-2.5 bg-white/20 rounded-xl">
                    <DollarSign size={22} />
                  </div>
                </div>
                <p className="text-xs mt-3 opacity-90 font-medium">{summary.activeCount} tiendas activas de pago</p>`,
    `<p className="text-xs uppercase tracking-wider font-bold opacity-90">Tiendas Totales</p>
                    <h3 className="text-3xl font-black mt-1">{stores.length} <span className="text-xs font-normal opacity-80">negocios</span></h3>
                  </div>
                  <div className="p-2.5 bg-white/20 rounded-xl">
                    <Store size={22} />
                  </div>
                </div>
                <p className="text-xs mt-3 opacity-90 font-medium">{stores.filter(s => s.is_active).length} activas en plataforma</p>`
  );
  fs.writeFileSync(file, content, 'utf8');
  console.log('Replaced MRR successfully');
} else {
  console.log('Target not found or already replaced');
}
