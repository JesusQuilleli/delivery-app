const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Inventory.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const isCrlf = content.includes('\r\n');
let normalized = content.replace(/\r\n/g, '\n');

// 1. Add industry helpers after storeConfig state
const target1 = `  const [storeConfig, setStoreConfig] = useState<any>(null);
  const ITEMS_PER_PAGE = 8;`;

const replace1 = `  const [storeConfig, setStoreConfig] = useState<any>(null);
  const ITEMS_PER_PAGE = 8;

  const isPharmacy = storeConfig?.industry?.toUpperCase() === 'PHARMACY' || storeConfig?.industry?.toUpperCase() === 'FARMACIA';
  const isRestaurant = storeConfig?.industry?.toUpperCase() === 'RESTAURANT' || storeConfig?.industry?.toUpperCase() === 'RESTAURANTE';

  const productNamePlaceholder = isRestaurant
    ? "Ej. Hamburguesa Doble, Pizza Familiar, Pollo Broaster..."
    : isPharmacy
    ? "Ej. Paracetamol 500mg, Ibuprofeno..."
    : "Ej. Harina PAN 1kg, Arroz, Refresco 2L...";

  const productDescPlaceholder = isRestaurant
    ? "Ej. Con carne Angus, queso cheddar fundido, tocineta y papas..."
    : isPharmacy
    ? "Ej. Caja de 20 tabletas, uso bajo indicación médica..."
    : "Detalles y especificaciones del producto...";

  const categoryNamePlaceholder = isRestaurant
    ? "Ej. Hamburguesas, Bebidas, Combos, Postres..."
    : isPharmacy
    ? "Ej. Analgésicos, Vitaminas, Cuidado Personal..."
    : "Ej. Bebidas, Víveres, Charcutería...";`;

if (!normalized.includes(target1)) {
  console.error('Target 1 not found!');
  process.exit(1);
}
normalized = normalized.replace(target1, replace1);

// 2. Update handleAddProduct, handleAddCategory, handleEditCategory
const target2 = `  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: newProductName,
        price: parseFloat(newProductPrice),
        description: newProductDesc,
        stock: newProductStock !== '' ? parseInt(newProductStock) : null,
        image_url: newProductImage,
        is_available: true,
        category_id: newProductCategoryId ? Number(newProductCategoryId) : null
      };
      const res = await api.post(\`/inventory/\${slug}/products\`, payload);
      setProducts([res.data.product, ...products]);
      setIsAddProductOpen(false);
      // Reset
      setNewProductName(''); setNewProductPrice(''); setNewProductDesc(''); setNewProductStock(''); setNewProductImage(''); setNewProductCategoryId('');
      toast.success("Producto creado exitosamente");
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || "Error al crear producto";
      toast.error(msg);
    }
  };`;

const replace2 = `  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: newProductName,
        price: parseFloat(newProductPrice),
        description: newProductDesc,
        stock: newProductStock !== '' ? parseInt(newProductStock) : null,
        image_url: newProductImage,
        is_available: true,
        category_id: newProductCategoryId ? Number(newProductCategoryId) : null
      };
      if (isPharmacy) {
        payload.prescription_type = newPrescriptionType;
        payload.requires_prescription = newPrescriptionType !== 'NONE';
        payload.lot_number = newLotNumber || null;
        payload.expires_at = newExpiresAt || null;
      }
      const res = await api.post(\`/inventory/\${slug}/products\`, payload);
      setProducts([res.data.product, ...products]);
      setIsAddProductOpen(false);
      // Reset
      setNewProductName(''); setNewProductPrice(''); setNewProductDesc(''); setNewProductStock(''); setNewProductImage(''); setNewProductCategoryId('');
      setNewPrescriptionType('NONE'); setNewLotNumber(''); setNewExpiresAt('');
      toast.success("Producto creado exitosamente");
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || "Error al crear producto";
      toast.error(msg);
    }
  };`;

if (!normalized.includes(target2)) {
  console.error('Target 2 not found!');
  process.exit(1);
}
normalized = normalized.replace(target2, replace2);

// 3. Update handleAddCategory and handleEditCategory
const target3 = `  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post(\`/inventory/\${slug}/categories\`, { name: newCategoryName, image_url: newCategoryImage });
      setCategories([...categories, res.data.category]);
      setNewCategoryName('');
      setNewCategoryImage('');
      toast.success("Categoría creada exitosamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al crear categoría");
    }
  };

  const openEditCategoryModal = (c: Category) => {
    setEditingCategory(c);
    setEditCategoryName(c.name);
    setEditCategoryImage(c.image_url || '');
    setIsEditCategoryOpen(true);
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      const res = await api.put(\`/inventory/categories/\${editingCategory.id}\`, { name: editCategoryName, image_url: editCategoryImage });
      setCategories(categories.map(c => c.id === editingCategory.id ? res.data.category : c));
      setIsEditCategoryOpen(false);
      toast.success("Categoría actualizada");
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar categoría");
    }
  };`;

const replace3 = `  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error("Por favor ingresa un nombre para la categoría");
      return;
    }

    const exists = allCategories.some(c => c.name.trim().toLowerCase() === trimmed.toLowerCase()) ||
                   categories.some(c => c.name.trim().toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      toast.error(\`La categoría "\${trimmed}" ya existe en tu tienda.\`);
      return;
    }

    try {
      const res = await api.post(\`/inventory/\${slug}/categories\`, { name: trimmed, image_url: newCategoryImage });
      const createdCategory = res.data.category;
      setCategories(prev => [...prev, createdCategory]);
      setAllCategories(prev => [...prev, createdCategory]);
      setNewCategoryName('');
      setNewCategoryImage('');
      toast.success(\`Categoría "\${createdCategory.name}" creada exitosamente\`, {
        action: {
          label: "+ Agregar producto",
          onClick: () => {
            setNewProductCategoryId(createdCategory.id);
            setActiveTab("products");
            setIsAddProductOpen(true);
          }
        }
      });
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || "Error al crear categoría";
      toast.error(msg);
    }
  };

  const openEditCategoryModal = (c: Category) => {
    setEditingCategory(c);
    setEditCategoryName(c.name);
    setEditCategoryImage(c.image_url || '');
    setIsEditCategoryOpen(true);
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const trimmed = editCategoryName.trim();
    if (!trimmed) {
      toast.error("Por favor ingresa un nombre para la categoría");
      return;
    }

    const exists = allCategories.some(c => c.id !== editingCategory.id && c.name.trim().toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      toast.error(\`La categoría "\${trimmed}" ya existe en tu tienda.\`);
      return;
    }

    try {
      const res = await api.put(\`/inventory/categories/\${editingCategory.id}\`, { name: trimmed, image_url: editCategoryImage });
      const updated = res.data.category;
      setCategories(categories.map(c => c.id === editingCategory.id ? updated : c));
      setAllCategories(allCategories.map(c => c.id === editingCategory.id ? updated : c));
      setIsEditCategoryOpen(false);
      toast.success("Categoría actualizada");
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || "Error al actualizar categoría";
      toast.error(msg);
    }
  };`;

if (!normalized.includes(target3)) {
  console.error('Target 3 not found!');
  process.exit(1);
}
normalized = normalized.replace(target3, replace3);

// 4. Update Category Input placeholder
const target4 = `<Input required value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Ej. Bebidas..." className="rounded-xl bg-gray-50 border-gray-200" />`;
const replace4 = `<Input required value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder={categoryNamePlaceholder} className="rounded-xl bg-gray-50 border-gray-200" />`;

if (!normalized.includes(target4)) {
  console.error('Target 4 not found!');
  process.exit(1);
}
normalized = normalized.replace(target4, replace4);

// 5. Update Categories Table with "+ Agregar producto" action button
const target5 = `<TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditCategoryModal(c)} className="text-blue-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg">
                          <Pencil size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCategory(c.id)} className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg">
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </TableCell>`;

const replace5 = `<TableCell className="text-right">
                      <div className="flex justify-end gap-1.5 items-center">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setNewProductCategoryId(c.id);
                            setActiveTab("products");
                            setIsAddProductOpen(true);
                          }} 
                          className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200 rounded-lg flex items-center gap-1.5 h-8 px-2.5 mr-1"
                          title={\`Agregar producto a la categoría \${c.name}\`}
                        >
                          <Plus size={14} /> <span className="hidden sm:inline">Agregar producto</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditCategoryModal(c)} className="text-blue-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg">
                          <Pencil size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCategory(c.id)} className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg">
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </TableCell>`;

if (!normalized.includes(target5)) {
  console.error('Target 5 not found!');
  process.exit(1);
}
normalized = normalized.replace(target5, replace5);

// 6. Update Product Name placeholder, Description placeholder, and Pharmacy conditional fields in Create Product Modal
const target6 = `                  <div className="space-y-1">
                    <Label className="font-bold text-gray-700">Nombre del Producto</Label>
                    <Input required value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="Ej. Paracetamol 500mg" className="rounded-xl bg-gray-50 border-gray-200" />
                  </div>`;

const replace6 = `                  <div className="space-y-1">
                    <Label className="font-bold text-gray-700">Nombre del Producto</Label>
                    <Input required value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder={productNamePlaceholder} className="rounded-xl bg-gray-50 border-gray-200" />
                  </div>`;

if (!normalized.includes(target6)) {
  console.error('Target 6 not found!');
  process.exit(1);
}
normalized = normalized.replace(target6, replace6);

const target7 = `                  <div className="space-y-1">
                    <Label className="font-bold text-gray-700">Descripción (Opcional)</Label>
                    <Input value={newProductDesc} onChange={e => setNewProductDesc(e.target.value)} placeholder="Detalles del producto..." className="rounded-xl bg-gray-50 border-gray-200" />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-bold text-gray-700">Tipo de Récipe Médico (Farmacias)</Label>
                    <select
                      value={newPrescriptionType}
                      onChange={e => setNewPrescriptionType(e.target.value as any)}
                      className="flex h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                    >
                      <option value="NONE">Venta Libre (Sin récipe)</option>
                      <option value="SHOW_ONLY">Requiere Récipe (Solo mostrar al motorizado)</option>
                      <option value="RETAIN_ORIGINAL">Retención Obligatoria (Motorizado debe retenerlo para archivo)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="font-bold text-gray-700 text-xs">Nº Lote (Opcional)</Label>
                      <Input value={newLotNumber} onChange={e => setNewLotNumber(e.target.value)} placeholder="Ej. L-2026A" className="rounded-xl bg-gray-50 border-gray-200 h-10 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-bold text-gray-700 text-xs">Vencimiento</Label>
                      <Input type="date" value={newExpiresAt} onChange={e => setNewExpiresAt(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200 h-10 text-xs" />
                    </div>
                  </div>`;

const replace7 = `                  <div className="space-y-1">
                    <Label className="font-bold text-gray-700">Descripción (Opcional)</Label>
                    <Input value={newProductDesc} onChange={e => setNewProductDesc(e.target.value)} placeholder={productDescPlaceholder} className="rounded-xl bg-gray-50 border-gray-200" />
                  </div>
                  {isPharmacy && (
                    <>
                      <div className="space-y-1">
                        <Label className="font-bold text-gray-700">Tipo de Récipe Médico (Farmacias)</Label>
                        <select
                          value={newPrescriptionType}
                          onChange={e => setNewPrescriptionType(e.target.value as any)}
                          className="flex h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                        >
                          <option value="NONE">Venta Libre (Sin récipe)</option>
                          <option value="SHOW_ONLY">Requiere Récipe (Solo mostrar al motorizado)</option>
                          <option value="RETAIN_ORIGINAL">Retención Obligatoria (Motorizado debe retenerlo para archivo)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="font-bold text-gray-700 text-xs">Nº Lote (Opcional)</Label>
                          <Input value={newLotNumber} onChange={e => setNewLotNumber(e.target.value)} placeholder="Ej. L-2026A" className="rounded-xl bg-gray-50 border-gray-200 h-10 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-bold text-gray-700 text-xs">Vencimiento</Label>
                          <Input type="date" value={newExpiresAt} onChange={e => setNewExpiresAt(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200 h-10 text-xs" />
                        </div>
                      </div>
                    </>
                  )}`;

if (!normalized.includes(target7)) {
  console.error('Target 7 not found!');
  process.exit(1);
}
normalized = normalized.replace(target7, replace7);

// 8. Update Edit Product Modal placeholders
const target8 = `                  <div className="space-y-1">
                    <Label className="font-bold text-gray-700">Descripción (Opcional)</Label>
                    <Input value={editProductDesc} onChange={e => setEditProductDesc(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200" />
                  </div>
                  {(storeConfig?.industry?.toUpperCase() === 'PHARMACY' || storeConfig?.industry?.toUpperCase() === 'FARMACIA') && (`;

const replace8 = `                  <div className="space-y-1">
                    <Label className="font-bold text-gray-700">Descripción (Opcional)</Label>
                    <Input value={editProductDesc} onChange={e => setEditProductDesc(e.target.value)} placeholder={productDescPlaceholder} className="rounded-xl bg-gray-50 border-gray-200" />
                  </div>
                  {isPharmacy && (`;

if (!normalized.includes(target8)) {
  console.error('Target 8 not found!');
  process.exit(1);
}
normalized = normalized.replace(target8, replace8);

const finalContent = isCrlf ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('Successfully updated frontend/src/pages/Inventory.tsx!');
