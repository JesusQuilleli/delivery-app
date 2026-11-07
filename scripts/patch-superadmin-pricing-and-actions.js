const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'SuperAdmin.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Import Trash2
if (!code.includes('Trash2,')) {
  code = code.replace('KeyRound,', 'KeyRound,\n  Trash2,');
}

// 2. Add handleDeleteStore function
if (!code.includes('handleDeleteStore')) {
  const insertAfter = 'const toggleStatus = async (id: number) => {';
  const deleteFunction = `const handleDeleteStore = async (store: StoreItem) => {
    const confirmMsg = \`¿ESTÁS SEGURO de eliminar permanentemente la tienda "\${store.name}"?\\n\\nEsta acción borrará:\\n- Todo su catálogo y categorías\\n- Todos sus pedidos y cotizaciones\\n- Suscriptores, repartidores y usuarios\\n\\nEscribe el slug "\${store.slug}" para confirmar la eliminación:\`;
    const input = window.prompt(confirmMsg);
    if (!input) return;
    if (input.trim() !== store.slug.trim()) {
      toast.error('El slug no coincide. Eliminación cancelada.');
      return;
    }
    try {
      await api.delete(\`/superadmin/stores/\${store.id}\`);
      toast.success(\`Tienda "\${store.name}" eliminada permanentemente\`);
      fetchSubscriptions();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Error al eliminar la tienda');
    }
  };

  const toggleStatus = async (id: number) => {`;
  code = code.replace(insertAfter, deleteFunction);
}

// 3. Update top summary card (replace MRR with Total Tiendas)
const targetMRRCard = `<div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs uppercase tracking-wider font-bold opacity-90">MRR Mensual</p>
                      <h3 className="text-3xl font-black mt-1">\${summary.mrr} <span className="text-xs font-normal opacity-80">USD/mes</span></h3>
                      <p className="text-xs mt-1 opacity-80">{summary.paid_stores} tiendas activas de pago</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <DollarSign size={24} />
                    </div>
                  </div>`;

const replacementTotalStoresCard = `<div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs uppercase tracking-wider font-bold opacity-90">Total Tiendas</p>
                      <h3 className="text-3xl font-black mt-1">{stores.length} <span className="text-xs font-normal opacity-80">negocios</span></h3>
                      <p className="text-xs mt-1 opacity-80">{stores.filter(s => s.is_active).length} activas en plataforma</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <Store size={24} />
                    </div>
                  </div>`;

if (code.includes(targetMRRCard)) {
  code = code.replace(targetMRRCard, replacementTotalStoresCard);
} else {
  console.warn('Could not find targetMRRCard directly, using regex');
  code = code.replace(/<p className="text-xs uppercase tracking-wider font-bold opacity-90">MRR Mensual<\/p>[\s\S]*?<DollarSign size=\{24\} \/>\s*<\/div>\s*<\/div>/, `<p className="text-xs uppercase tracking-wider font-bold opacity-90">Total Tiendas</p>
                      <h3 className="text-3xl font-black mt-1">{stores.length} <span className="text-xs font-normal opacity-80">negocios</span></h3>
                      <p className="text-xs mt-1 opacity-80">{stores.filter(s => s.is_active).length} activas en plataforma</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <Store size={24} />
                    </div>
                  </div>`);
}

// 4. Remove prices from Plan Select in Create Form
code = code.replace(
  '<option value="EMPRENDEDOR">Emprendedor ($9)</option>\n                        <option value="NEGOCIO">Negocio ($19)</option>\n                        <option value="PRO">Pro / Cadena ($35)</option>',
  '<option value="EMPRENDEDOR">Emprendedor</option>\n                        <option value="NEGOCIO">Negocio</option>\n                        <option value="PRO">Pro / Cadena</option>'
);

// 5. Remove price from table row: {store.plan} (${store.plan_price}/m)
code = code.replace(
  '{store.plan} (${store.plan_price}/m)',
  '{store.plan}'
);

// 6. Remove prices from Plan Modal Select
code = code.replace(
  '<option value="EMPRENDEDOR">Emprendedor (Hasta 50 prods, $9/m)</option>\n                    <option value="NEGOCIO">Negocio (Hasta 250 prods, $19/m)</option>\n                    <option value="PRO">Pro / Cadena (Hasta 1000 prods, $35/m)</option>',
  '<option value="EMPRENDEDOR">Emprendedor (Hasta 50 productos)</option>\n                    <option value="NEGOCIO">Negocio (Hasta 250 productos)</option>\n                    <option value="PRO">Pro / Cadena (Hasta 1000 productos)</option>'
);

// 7. Update actions cell to have Suspender/Reactivar + Eliminar
const targetActionButtons = `<Button 
                                  variant={store.is_active ? "destructive" : "default"} 
                                  size="sm" 
                                  onClick={() => toggleStatus(store.id)}
                                  className="h-8 px-2 text-xs font-bold"
                                >
                                  <Power size={12} className="mr-1" />
                                  {store.is_active ? 'Pausar' : 'Activar'}
                                </Button>`;

const replacementActionButtons = `<Button 
                                  variant={store.is_active ? "destructive" : "default"} 
                                  size="sm" 
                                  onClick={() => toggleStatus(store.id)}
                                  className={\`h-8 px-2 text-xs font-bold \${!store.is_active ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}\`}
                                  title={store.is_active ? 'Suspender tienda' : 'Reactivar tienda'}
                                >
                                  <Power size={12} className="mr-1" />
                                  {store.is_active ? 'Suspender' : 'Reactivar'}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDeleteStore(store)}
                                  className="h-8 px-2 text-xs font-bold border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                  title="Eliminar tienda permanentemente"
                                >
                                  <Trash2 size={12} className="mr-1" />
                                  Eliminar
                                </Button>`;

if (code.includes(targetActionButtons)) {
  code = code.replace(targetActionButtons, replacementActionButtons);
} else {
  console.warn('Could not find targetActionButtons directly, using regex');
  code = code.replace(/<Button\s+variant=\{store\.is_active \? "destructive" : "default"\}[\s\S]*?\{store\.is_active \? 'Pausar' : 'Activar'\}\s*<\/Button>/, replacementActionButtons);
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully patched SuperAdmin.tsx!');
