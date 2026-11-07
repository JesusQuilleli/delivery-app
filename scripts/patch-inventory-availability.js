const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Inventory.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add state variables for availability
if (!code.includes('newProductAvailable')) {
  code = code.replace(
    "const [newProductStock, setNewProductStock] = useState('');",
    "const [newProductStock, setNewProductStock] = useState('');\n  const [newProductAvailable, setNewProductAvailable] = useState<boolean>(true);"
  );
}

if (!code.includes('editProductAvailable')) {
  code = code.replace(
    "const [editProductStock, setEditProductStock] = useState('');",
    "const [editProductStock, setEditProductStock] = useState('');\n  const [editProductAvailable, setEditProductAvailable] = useState<boolean>(true);"
  );
}

// 2. In handleAddProduct, set is_available from state
code = code.replace(
  /stock:\s*newProductStock\s*!==\s*''\s*\?\s*parseInt\(newProductStock\)\s*:\s*null,\s*image_url:\s*newProductImage\s*\|\|\s*null,\s*category_id:\s*newProductCategoryId\s*\|\|\s*null,\s*requires_prescription:\s*newPrescriptionType\s*!==\s*'NONE',\s*prescription_type:\s*newPrescriptionType,\s*lot_number:\s*newLotNumber\s*\|\|\s*null,\s*expires_at:\s*newExpiresAt\s*\?\s*new Date\(newExpiresAt\)\.toISOString\(\)\s*:\s*null,\s*is_available:\s*true,/g,
  `stock: null,\n        image_url: newProductImage || null,\n        category_id: newProductCategoryId || null,\n        requires_prescription: newPrescriptionType !== 'NONE',\n        prescription_type: newPrescriptionType,\n        lot_number: newLotNumber || null,\n        expires_at: newExpiresAt ? new Date(newExpiresAt).toISOString() : null,\n        is_available: newProductAvailable,`
);

// Reset availability on add
code = code.replace(
  "setNewProductStock(''); setNewProductImage('');",
  "setNewProductStock(''); setNewProductAvailable(true); setNewProductImage('');"
);

// 3. In openEditModal, populate editProductAvailable
code = code.replace(
  "setEditProductStock(p.stock !== null && p.stock !== undefined ? p.stock.toString() : '');",
  "setEditProductStock(p.stock !== null && p.stock !== undefined ? p.stock.toString() : '');\n    setEditProductAvailable(p.is_available !== false);"
);

// 4. In handleEditProduct, update is_available
code = code.replace(
  /stock:\s*editProductStock\s*!==\s*''\s*\?\s*parseInt\(editProductStock\)\s*:\s*null,/g,
  `stock: null,\n        is_available: editProductAvailable,`
);

// 5. In Add Product Dialog, replace Stock input with Disponibilidad toggle
const targetAddStock = `<div className="space-y-1">
                      <Label className="font-bold text-gray-700">Stock (Uds)</Label>
                      <Input type="number" min="0" step="1" value={newProductStock} onChange={e => setNewProductStock(e.target.value)} placeholder="Ilimitado" className="rounded-xl bg-gray-50 border-gray-200" />
                    </div>`;

const replacementAddStock = `<div className="space-y-1">
                      <Label className="font-bold text-gray-700">Disponibilidad</Label>
                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200 h-10 items-center">
                        <button
                          type="button"
                          onClick={() => setNewProductAvailable(true)}
                          className={\`h-8 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 \${newProductAvailable ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}\`}
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                          Disponible
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewProductAvailable(false)}
                          className={\`h-8 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 \${!newProductAvailable ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}\`}
                        >
                          <span className="w-2 h-2 rounded-full bg-rose-300"></span>
                          Agotado
                        </button>
                      </div>
                    </div>`;

if (code.includes(targetAddStock)) {
  code = code.replace(targetAddStock, replacementAddStock);
} else {
  console.warn('Could not find targetAddStock exactly, trying flexible match');
  code = code.replace(/<div className="space-y-1">\s*<Label className="font-bold text-gray-700">Stock \(Uds\)<\/Label>\s*<Input type="number" min="0" step="1" value=\{newProductStock\}[^>]+>\s*<\/div>/, replacementAddStock);
}

// 6. In Edit Product Dialog, replace Stock input with Disponibilidad toggle
const targetEditStock = `<div className="space-y-1">
                      <Label className="font-bold text-gray-700">Stock (Uds)</Label>
                      <Input type="number" min="0" step="1" value={editProductStock} onChange={e => setEditProductStock(e.target.value)} placeholder="Ilimitado" className="rounded-xl bg-gray-50 border-gray-200" />
                    </div>`;

const replacementEditStock = `<div className="space-y-1">
                      <Label className="font-bold text-gray-700">Disponibilidad</Label>
                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200 h-10 items-center">
                        <button
                          type="button"
                          onClick={() => setEditProductAvailable(true)}
                          className={\`h-8 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 \${editProductAvailable ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}\`}
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                          Disponible
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditProductAvailable(false)}
                          className={\`h-8 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 \${!editProductAvailable ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}\`}
                        >
                          <span className="w-2 h-2 rounded-full bg-rose-300"></span>
                          Agotado
                        </button>
                      </div>
                    </div>`;

if (code.includes(targetEditStock)) {
  code = code.replace(targetEditStock, replacementEditStock);
} else {
  console.warn('Could not find targetEditStock exactly, trying flexible match');
  code = code.replace(/<div className="space-y-1">\s*<Label className="font-bold text-gray-700">Stock \(Uds\)<\/Label>\s*<Input type="number" min="0" step="1" value=\{editProductStock\}[^>]+>\s*<\/div>/, replacementEditStock);
}

// 7. In Mobile List (cards), replace Stock and ACTIVO/INACTIVO
const mobileCardsTarget = `{p.stock === null ? (
                        <span className="text-xs font-semibold text-gray-400">Stock: Ilimitado</span>
                      ) : p.stock <= 0 ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs font-bold">Agotado (0)</Badge>
                      ) : p.stock <= 5 ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-bold">Bajo stock ({p.stock})</Badge>
                      ) : (
                        <span className="text-xs font-semibold text-gray-600">Stock: {p.stock}</span>
                      )}
                      <button
                        onClick={() => toggleAvailability(p.id, p.is_available)}
                        className={\`px-2.5 py-1 text-xs font-bold rounded-full transition-colors \${p.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}
                      >
                        {p.is_available ? 'ACTIVO' : 'INACTIVO'}
                      </button>`;

const mobileCardsReplacement = `<button
                        onClick={() => toggleAvailability(p.id, p.is_available)}
                        className={\`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full transition-all border \${
                          p.is_available 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                        }\`}
                        title="Toca para cambiar disponibilidad"
                      >
                        <span className={\`w-2 h-2 rounded-full \${p.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}\`} />
                        {p.is_available ? 'Disponible' : 'Agotado'}
                      </button>`;

if (code.includes(mobileCardsTarget)) {
  code = code.replace(mobileCardsTarget, mobileCardsReplacement);
} else {
  console.warn('Could not find mobileCardsTarget exactly, using regex');
  code = code.replace(/\{p\.stock === null \?[\s\S]*?\{p\.is_available \? 'ACTIVO' : 'INACTIVO'\}\s*<\/button>/, mobileCardsReplacement);
}

// 8. In Desktop Table: replace Stock & Estado with single Disponibilidad
const tableHeaderTarget = `<TableHead className="font-black text-gray-900">Stock</TableHead>
                  <TableHead className="font-black text-gray-900 text-center">Estado</TableHead>`;
const tableHeaderReplacement = `<TableHead className="font-black text-gray-900 text-center">Disponibilidad</TableHead>`;

code = code.replace(tableHeaderTarget, tableHeaderReplacement);

const tableRowTarget = `<TableCell>
                      {p.stock === null ? (
                        <span className="text-xs font-medium text-gray-400">Ilimitado</span>
                      ) : p.stock <= 0 ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-bold">Agotado (0)</Badge>
                      ) : p.stock <= 5 ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold">Bajo stock ({p.stock})</Badge>
                      ) : (
                        <span className="font-semibold text-gray-700">{p.stock} unid.</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => toggleAvailability(p.id, p.is_available)}
                        className={\`px-3 py-1 text-xs font-bold rounded-full transition-colors \${p.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}
                      >
                        {p.is_available ? 'ACTIVO' : 'INACTIVO'}
                      </button>
                    </TableCell>`;

const tableRowReplacement = `<TableCell className="text-center">
                      <button
                        onClick={() => toggleAvailability(p.id, p.is_available)}
                        className={\`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all border shadow-sm \${
                          p.is_available 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                        }\`}
                        title="Clic para cambiar disponibilidad"
                      >
                        <span className={\`w-2 h-2 rounded-full \${p.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}\`} />
                        {p.is_available ? 'Disponible' : 'Agotado'}
                      </button>
                    </TableCell>`;

if (code.includes(tableRowTarget)) {
  code = code.replace(tableRowTarget, tableRowReplacement);
} else {
  console.warn('Could not find tableRowTarget exactly, using regex');
  code = code.replace(/<TableCell>\s*\{p\.stock === null \?[\s\S]*?\{p\.is_available \? 'ACTIVO' : 'INACTIVO'\}\s*<\/button>\s*<\/TableCell>/, tableRowReplacement);
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully patched Inventory.tsx with Disponibilidad selector and toggles!');
