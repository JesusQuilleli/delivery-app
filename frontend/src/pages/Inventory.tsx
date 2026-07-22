import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { Plus, Trash2, Layers, Image as ImageIcon, Tags, Pencil, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import Papa from 'papaparse';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
  image_url: string | null;
}

interface Product {
  id: number;
  name: string;
  price: number;
  description: string | null;
  stock: number | null;
  image_url: string | null;
  is_available: boolean;
  is_combo: boolean;
  category_id?: number | null;
  category?: Category;
  comboItems?: { product_id: number; product: Product; quantity: number }[];
}

export default function Inventory() {
  const { slug } = useParams<{ slug: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.imageUrl;
    } catch (error) {
      console.error('Error uploading image', error);
      toast.error('Error al subir la imagen a la nube');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Formularios
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductStock, setNewProductStock] = useState('');
  const [newProductImage, setNewProductImage] = useState('');
  const [newProductCategoryId, setNewProductCategoryId] = useState<number | ''>('');
  
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Formulario Combos
  const [newComboName, setNewComboName] = useState('');
  const [newComboPrice, setNewComboPrice] = useState('');
  const [newComboDesc, setNewComboDesc] = useState('');
  const [newComboImage, setNewComboImage] = useState('');
  const [selectedComboItems, setSelectedComboItems] = useState<{product_id: number, quantity: number}[]>([]);
  const [isAddComboOpen, setIsAddComboOpen] = useState(false);

  // Formulario Edición
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductPrice, setEditProductPrice] = useState('');
  const [editProductDesc, setEditProductDesc] = useState('');
  const [editProductStock, setEditProductStock] = useState('');
  const [editProductImage, setEditProductImage] = useState('');
  const [editProductCategoryId, setEditProductCategoryId] = useState<number | ''>('');
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);

  // Formulario Categorías
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState('');
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryImage, setEditCategoryImage] = useState('');
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        tab: activeTab
      });
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      const res = await api.get(`/inventory/${slug}/inventory?${params.toString()}`);
      
      if (activeTab === 'categories') {
        setCategories(res.data.categories || []);
      } else {
        setProducts(res.data.products || []);
      }
      
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.totalPages);
      } else {
        setTotalPages(1);
      }

      // Always update categories if provided so dropdowns have all data
      // Actually, if we paginate categories, we shouldn't overwrite the full list used for the dropdowns.
      // But let's assume we fetch categories properly.
      // To not break the "Crear Producto" dropdown, we need the full categories list.
      // We will handle this by fetching all categories once on mount.
    } catch (error) {
      console.error("Error fetching inventory", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data;
        if (data.length === 0) {
          toast.error('El archivo está vacío');
          return;
        }
        
        const confirm = window.confirm(`Se importarán ${data.length} productos. ¿Deseas continuar?`);
        if (!confirm) return;

        try {
          setLoading(true);
          const formatted = data.map((item: any) => ({
            name: item.name || item.Nombre || item.NAME || 'Sin nombre',
            price: parseFloat(item.price || item.Precio || item.PRICE) || 0,
            description: item.description || item.Descripcion || item.DESCRIPTION || '',
            stock: item.stock || item.Stock || item.STOCK || null,
            category_id: null,
            is_available: true
          }));

          const res = await api.post(`/inventory/${slug}/products/bulk`, { products: formatted });
          toast.success(`Éxito: ${res.data.count} productos creados masivamente.`);
          fetchInventory();
        } catch (err) {
          console.error(err);
          toast.error('Error al importar productos masivamente');
          setLoading(false);
        }
      },
      error: (error: any) => {
        toast.error(`Error leyendo archivo CSV: ${error.message}`);
      }
    });
    // Reset file input
    e.target.value = '';
  };

  useEffect(() => {
    fetchInventory();
  }, [slug, activeTab, currentPage, debouncedSearchTerm]);

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allIndividualProducts, setAllIndividualProducts] = useState<Product[]>([]);
  useEffect(() => {
    api.get(`/inventory/${slug}/categories`).then(res => setAllCategories(res.data.categories)).catch(e => console.error(e));
    api.get(`/inventory/${slug}/inventory`).then(res => {
      setAllIndividualProducts(res.data.products?.filter((p: Product) => !p.is_combo) || []);
    }).catch(e => console.error(e));
  }, [slug]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, debouncedSearchTerm]);

  const toggleAvailability = async (id: number, currentStatus: boolean) => {
    try {
      await api.put(`/inventory/products/${id}`, { is_available: !currentStatus });
      setProducts(products.map(p => p.id === id ? { ...p, is_available: !currentStatus } : p));
    } catch (e) {
      console.error(e);
      toast.error("Error al actualizar");
    }
  };

  const deleteProduct = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar este ítem?")) return;
    try {
      await api.delete(`/inventory/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
      toast.success("Producto eliminado exitosamente");
    } catch (e) {
      toast.error("No se puede eliminar porque está asociado a pedidos.");
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: newProductName,
        price: parseFloat(newProductPrice),
        description: newProductDesc,
        stock: newProductStock ? parseInt(newProductStock) : null,
        image_url: newProductImage,
        is_available: true,
        category_id: newProductCategoryId ? Number(newProductCategoryId) : null
      };
      const res = await api.post(`/inventory/${slug}/products`, payload);
      setProducts([res.data.product, ...products]);
      setIsAddProductOpen(false);
      // Reset
      setNewProductName(''); setNewProductPrice(''); setNewProductDesc(''); setNewProductStock(''); setNewProductImage(''); setNewProductCategoryId('');
      toast.success("Producto creado exitosamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al crear producto");
    }
  };

  const handleAddCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedComboItems.length === 0) {
      toast.error("Selecciona al menos un producto para el combo");
      return;
    }
    try {
      const payload = {
        name: newComboName,
        price: parseFloat(newComboPrice),
        description: newComboDesc,
        image_url: newComboImage,
        is_available: true,
        combo_items: selectedComboItems
      };
      const res = await api.post(`/inventory/${slug}/combos`, payload);
      setProducts([res.data.product, ...products]);
      setIsAddComboOpen(false);
      // Reset
      setNewComboName(''); setNewComboPrice(''); setNewComboDesc(''); setNewComboImage(''); setSelectedComboItems([]);
      toast.success("Combo creado exitosamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al crear combo");
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post(`/inventory/${slug}/categories`, { name: newCategoryName, image_url: newCategoryImage });
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
      const res = await api.put(`/inventory/categories/${editingCategory.id}`, { name: editCategoryName, image_url: editCategoryImage });
      setCategories(categories.map(c => c.id === editingCategory.id ? res.data.category : c));
      setIsEditCategoryOpen(false);
      toast.success("Categoría actualizada");
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar categoría");
    }
  };

  const deleteCategory = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta categoría? ATENCIÓN: Se eliminarán TODOS los productos que pertenezcan a ella.")) return;
    try {
      await api.delete(`/inventory/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
      setProducts(products.filter(p => p.category_id !== id));
      toast.success("Categoría eliminada exitosamente");
    } catch (e) {
      toast.error("Error al eliminar categoría.");
    }
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditProductName(p.name);
    setEditProductPrice(p.price.toString());
    setEditProductDesc(p.description || '');
    setEditProductStock(p.stock !== null ? p.stock.toString() : '');
    setEditProductImage(p.image_url || '');
    setEditProductCategoryId(p.category_id || '');
    setIsEditProductOpen(true);
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const payload = {
        name: editProductName,
        price: parseFloat(editProductPrice),
        description: editProductDesc,
        stock: editProductStock ? parseInt(editProductStock) : null,
        image_url: editProductImage,
        category_id: editProductCategoryId ? Number(editProductCategoryId) : null
      };
      const res = await api.put(`/inventory/products/${editingProduct.id}`, payload);
      setProducts(products.map(p => p.id === editingProduct.id ? res.data.product : p));
      setIsEditProductOpen(false);
      toast.success("Producto actualizado exitosamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar producto");
    }
  };

  const toggleProductInCombo = (productId: number) => {
    if (selectedComboItems.find(item => item.product_id === productId)) {
      setSelectedComboItems(selectedComboItems.filter(item => item.product_id !== productId));
    } else {
      setSelectedComboItems([...selectedComboItems, { product_id: productId, quantity: 1 }]);
    }
  };

  const updateComboItemQuantity = (productId: number, qty: number) => {
    if (qty < 1) return;
    setSelectedComboItems(selectedComboItems.map(item => item.product_id === productId ? { ...item, quantity: qty } : item));
  };

  if (loading && products.length === 0 && categories.length === 0) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">Cargando Inventario...</div>;
  }

  return (
    <AdminLayout title="Gestión de Inventario">

        <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setCurrentPage(1); setSearchTerm(''); }} className="w-full">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <TabsList className="grid w-full md:w-auto md:min-w-[400px] grid-cols-3 h-12 bg-white rounded-xl shadow-sm border border-gray-100 p-1">
              <TabsTrigger value="categories" className="rounded-lg font-bold text-sm data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all">Categorías</TabsTrigger>
              <TabsTrigger value="products" className="rounded-lg font-bold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">Productos</TabsTrigger>
              <TabsTrigger value="combos" className="rounded-lg font-bold text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all">Combos</TabsTrigger>
            </TabsList>
            
            <div className="w-full md:w-80 relative">
              <input 
                type="text" 
                placeholder="Buscar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <TabsContent value="categories" className="mt-6 space-y-4 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
               <h3 className="text-lg font-black mb-4 flex items-center gap-2"><Tags className="text-amber-500"/> Crear Categoría</h3>
               <form onSubmit={handleAddCategory} className="flex gap-4 items-end flex-wrap">
                  <div className="space-y-1 flex-grow max-w-[200px]">
                     <Label className="font-bold text-gray-700">Nombre de la Categoría</Label>
                     <Input required value={newCategoryName} onChange={e=>setNewCategoryName(e.target.value)} placeholder="Ej. Bebidas..." className="rounded-xl bg-gray-50 border-gray-200" />
                  </div>
                  <div className="space-y-1 flex-grow max-w-[300px]">
                     <Label className="font-bold text-gray-700">Subir Imagen (Opcional)</Label>
                     <div className="flex gap-2 items-center">
                       <Input 
                         type="file" 
                         accept="image/*"
                         disabled={isUploading}
                         onChange={async (e) => {
                           if (e.target.files && e.target.files[0]) {
                             const url = await uploadImage(e.target.files[0]);
                             if (url) setNewCategoryImage(url);
                           }
                         }} 
                         className="rounded-xl bg-gray-50 border-gray-200 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" 
                       />
                       {newCategoryImage && <img src={newCategoryImage} alt="preview" className="h-10 w-10 object-cover rounded-md" />}
                     </div>
                  </div>
                  <Button type="submit" disabled={isUploading} className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 px-6 h-10">
                    <Plus className="mr-2" size={18}/> {isUploading ? 'Subiendo...' : 'Añadir'}
                  </Button>
               </form>
            </div>

            {/* Edit Category Dialog */}
            <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-black text-xl">Editar Categoría</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEditCategory} className="space-y-4 mt-4">
                  <div className="space-y-1">
                    <Label className="font-bold text-gray-700">Nombre de la Categoría</Label>
                    <Input required value={editCategoryName} onChange={e=>setEditCategoryName(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200" />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-bold text-gray-700">Subir Imagen (Opcional)</Label>
                    <div className="flex gap-2 items-center">
                       <Input 
                         type="file" 
                         accept="image/*"
                         disabled={isUploading}
                         onChange={async (e) => {
                           if (e.target.files && e.target.files[0]) {
                             const url = await uploadImage(e.target.files[0]);
                             if (url) setEditCategoryImage(url);
                           }
                         }} 
                         className="rounded-xl bg-gray-50 border-gray-200 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" 
                       />
                       {editCategoryImage && <img src={editCategoryImage} alt="preview" className="h-10 w-10 object-cover rounded-md" />}
                     </div>
                  </div>
                  <Button type="submit" disabled={isUploading} className="w-full font-black text-lg h-12 bg-amber-500 hover:bg-amber-600 rounded-xl mt-4 text-white">
                    {isUploading ? 'Subiendo...' : 'Actualizar Categoría'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="font-black text-gray-900 w-[80px]">Img</TableHead>
                    <TableHead className="font-black text-gray-900 w-full">Nombre de la Categoría</TableHead>
                    <TableHead className="font-black text-gray-900 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-gray-500 font-bold">Cargando...</TableCell></TableRow>
                  ) : categories.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>
                        {c.image_url ? (
                           <img src={c.image_url} alt={c.name} className="w-10 h-10 object-cover rounded-lg bg-gray-100 border border-gray-200" />
                        ) : (
                           <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center"><ImageIcon size={16} className="text-gray-400"/></div>
                        )}
                      </TableCell>
                      <TableCell className="font-black text-gray-900 text-lg">{c.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditCategoryModal(c)} className="text-blue-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg">
                            <Pencil size={18} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteCategory(c.id)} className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg">
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categories.length === 0 && !loading && (
                     <TableRow><TableCell colSpan={3} className="text-center py-8 text-gray-500 font-bold">No hay categorías. Crea una arriba.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl border-gray-200">
                  <ChevronLeft size={20} />
                </Button>
                <span className="font-bold text-gray-600 text-sm">Página {currentPage} de {totalPages}</span>
                <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-xl border-gray-200">
                  <ChevronRight size={20} />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="mt-6 space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-end gap-3">
              <input 
                type="file" 
                id="csv-upload" 
                accept=".csv" 
                style={{ display: 'none' }} 
                onChange={handleFileUpload} 
              />
              <Button 
                variant="outline" 
                className="border-gray-200 font-bold rounded-xl h-10 px-4"
                onClick={() => document.getElementById('csv-upload')?.click()}
              >
                <Upload className="mr-2" size={18}/> Importar CSV
              </Button>
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 px-6">
                    <Plus className="mr-2" size={18}/> Nuevo Producto
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-black text-xl">Crear Nuevo Producto</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddProduct} className="space-y-4 mt-4">
                    <div className="space-y-1">
                      <Label className="font-bold text-gray-700">Nombre del Producto</Label>
                      <Input required value={newProductName} onChange={e=>setNewProductName(e.target.value)} placeholder="Ej. Paracetamol 500mg" className="rounded-xl bg-gray-50 border-gray-200" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="font-bold text-gray-700">Precio ($)</Label>
                          <Input required type="number" step="0.01" value={newProductPrice} onChange={e=>setNewProductPrice(e.target.value)} placeholder="Ej. 2.50" className="rounded-xl bg-gray-50 border-gray-200" />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-bold text-gray-700">Categoría</Label>
                          <select 
                            value={newProductCategoryId} 
                            onChange={e => setNewProductCategoryId(e.target.value ? Number(e.target.value) : '')}
                            className="flex h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Sin categoría</option>
                            {allCategories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="font-bold text-gray-700">Descripción (Opcional)</Label>
                      <Input value={newProductDesc} onChange={e=>setNewProductDesc(e.target.value)} placeholder="Detalles del producto..." className="rounded-xl bg-gray-50 border-gray-200" />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-bold text-gray-700">Stock (Opcional)</Label>
                      <Input type="number" value={newProductStock} onChange={e=>setNewProductStock(e.target.value)} placeholder="Dejar vacío si es ilimitado" className="rounded-xl bg-gray-50 border-gray-200" />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-bold text-gray-700">Subir Imagen (Opcional)</Label>
                      <div className="flex gap-2 items-center">
                       <Input 
                         type="file" 
                         accept="image/*"
                         disabled={isUploading}
                         onChange={async (e) => {
                           if (e.target.files && e.target.files[0]) {
                             const url = await uploadImage(e.target.files[0]);
                             if (url) setNewProductImage(url);
                           }
                         }} 
                         className="rounded-xl bg-gray-50 border-gray-200 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                       />
                       {newProductImage && <img src={newProductImage} alt="preview" className="h-10 w-10 object-cover rounded-md" />}
                     </div>
                    </div>
                    <Button type="submit" disabled={isUploading} className="w-full font-black text-lg h-12 bg-blue-600 hover:bg-blue-700 rounded-xl mt-4 text-white">
                      {isUploading ? 'Subiendo...' : 'Guardar Producto'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Edit Dialog */}
              <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-black text-xl">Editar Producto</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleEditProduct} className="space-y-4 mt-4">
                    <div className="space-y-1">
                      <Label className="font-bold text-gray-700">Nombre del Producto</Label>
                      <Input required value={editProductName} onChange={e=>setEditProductName(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="font-bold text-gray-700">Precio ($)</Label>
                          <Input required type="number" step="0.01" value={editProductPrice} onChange={e=>setEditProductPrice(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200" />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-bold text-gray-700">Categoría</Label>
                          <select 
                            value={editProductCategoryId} 
                            onChange={e => setEditProductCategoryId(e.target.value ? Number(e.target.value) : '')}
                            className="flex h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Sin categoría</option>
                            {allCategories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="font-bold text-gray-700">Descripción (Opcional)</Label>
                      <Input value={editProductDesc} onChange={e=>setEditProductDesc(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200" />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-bold text-gray-700">Stock (Opcional)</Label>
                      <Input type="number" value={editProductStock} onChange={e=>setEditProductStock(e.target.value)} placeholder="Dejar vacío si es ilimitado" className="rounded-xl bg-gray-50 border-gray-200" />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-bold text-gray-700">Subir Imagen (Opcional)</Label>
                      <div className="flex gap-2 items-center">
                       <Input 
                         type="file" 
                         accept="image/*"
                         disabled={isUploading}
                         onChange={async (e) => {
                           if (e.target.files && e.target.files[0]) {
                             const url = await uploadImage(e.target.files[0]);
                             if (url) setEditProductImage(url);
                           }
                         }} 
                         className="rounded-xl bg-gray-50 border-gray-200 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                       />
                       {editProductImage && <img src={editProductImage} alt="preview" className="h-10 w-10 object-cover rounded-md" />}
                     </div>
                    </div>
                    <Button type="submit" disabled={isUploading} className="w-full font-black text-lg h-12 bg-blue-600 hover:bg-blue-700 rounded-xl mt-4 text-white">
                      {isUploading ? 'Subiendo...' : 'Actualizar Producto'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="font-black text-gray-900 w-[80px]">Img</TableHead>
                    <TableHead className="font-black text-gray-900">Nombre</TableHead>
                    <TableHead className="font-black text-gray-900">Categoría</TableHead>
                    <TableHead className="font-black text-gray-900">Precio</TableHead>
                    <TableHead className="font-black text-gray-900">Stock</TableHead>
                    <TableHead className="font-black text-gray-900 text-center">Estado</TableHead>
                    <TableHead className="font-black text-gray-900 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500 font-bold">Cargando...</TableCell></TableRow>
                  ) : products.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {p.image_url ? (
                           <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded-lg bg-gray-100 border border-gray-200" />
                        ) : (
                           <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center"><ImageIcon size={16} className="text-gray-400"/></div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">{p.name}</TableCell>
                      <TableCell>
                        {p.category ? (
                           <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{p.category.name}</Badge>
                        ) : (
                           <span className="text-xs text-gray-400 font-bold">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-black text-blue-600">${p.price.toFixed(2)}</TableCell>
                      <TableCell>
                         {p.stock !== null ? <Badge variant="outline">{p.stock} unid.</Badge> : <span className="text-gray-400 text-xs font-bold">Ilimitado</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <button 
                          onClick={() => toggleAvailability(p.id, p.is_available)}
                          className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${p.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          {p.is_available ? 'ACTIVO' : 'INACTIVO'}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(p)} className="text-blue-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg">
                            <Pencil size={18} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteProduct(p.id)} className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg">
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {products.length === 0 && !loading && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500 font-bold">No hay productos. Crea uno arriba.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl border-gray-200">
                  <ChevronLeft size={20} />
                </Button>
                <span className="font-bold text-gray-600 text-sm">Página {currentPage} de {totalPages}</span>
                <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-xl border-gray-200">
                  <ChevronRight size={20} />
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="combos" className="mt-6 space-y-4 animate-in fade-in duration-300">
             <div className="flex justify-end">
              <Dialog open={isAddComboOpen} onOpenChange={setIsAddComboOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 px-6">
                    <Layers className="mr-2" size={18}/> Crear Nuevo Combo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-black text-xl">Crear Súper Combo</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddCombo} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="font-bold text-gray-700">Nombre del Combo</Label>
                          <Input required value={newComboName} onChange={e=>setNewComboName(e.target.value)} placeholder="Combo Familiar" className="rounded-xl bg-gray-50 border-gray-200" />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-bold text-gray-700">Precio Total ($)</Label>
                          <Input required type="number" step="0.01" value={newComboPrice} onChange={e=>setNewComboPrice(e.target.value)} placeholder="Ej. 15.00" className="rounded-xl bg-gray-50 border-gray-200" />
                        </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="font-bold text-gray-700">Descripción (Opcional)</Label>
                      <Input value={newComboDesc} onChange={e=>setNewComboDesc(e.target.value)} placeholder="Incluye varios productos..." className="rounded-xl bg-gray-50 border-gray-200" />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-bold text-gray-700">Selecciona Productos para el Combo</Label>
                      <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto bg-gray-50 p-2 space-y-1">
                        {allIndividualProducts.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                             <div className="flex items-center gap-3">
                               <input 
                                 type="checkbox" 
                                 checked={!!selectedComboItems.find(item => item.product_id === p.id)}
                                 onChange={() => toggleProductInCombo(p.id)}
                                 className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                               />
                               <span className="font-bold text-sm text-gray-700">{p.name} <span className="text-gray-400">(${p.price})</span></span>
                             </div>
                             {selectedComboItems.find(item => item.product_id === p.id) && (
                                <Input 
                                  type="number" 
                                  min="1" 
                                  className="w-16 h-8 text-center text-sm font-bold bg-purple-50 border-purple-200 text-purple-700" 
                                  value={selectedComboItems.find(item => item.product_id === p.id)?.quantity || 1}
                                  onChange={(e) => updateComboItemQuantity(p.id, parseInt(e.target.value))}
                                />
                             )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="font-bold text-gray-700">Subir Imagen (Opcional)</Label>
                      <div className="flex gap-2 items-center">
                       <Input 
                         type="file" 
                         accept="image/*"
                         disabled={isUploading}
                         onChange={async (e) => {
                           if (e.target.files && e.target.files[0]) {
                             const url = await uploadImage(e.target.files[0]);
                             if (url) setNewComboImage(url);
                           }
                         }} 
                         className="rounded-xl bg-gray-50 border-gray-200 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" 
                       />
                       {newComboImage && <img src={newComboImage} alt="preview" className="h-10 w-10 object-cover rounded-md" />}
                     </div>
                    </div>
                    <Button type="submit" disabled={isUploading} className="w-full font-black text-lg h-12 bg-purple-600 hover:bg-purple-700 rounded-xl mt-4 text-white">
                      {isUploading ? 'Subiendo...' : 'Guardar Combo'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="font-black text-gray-900 w-[80px]">Img</TableHead>
                    <TableHead className="font-black text-gray-900">Nombre de Combo</TableHead>
                    <TableHead className="font-black text-gray-900">Productos Incluidos</TableHead>
                    <TableHead className="font-black text-gray-900">Precio Especial</TableHead>
                    <TableHead className="font-black text-gray-900 text-center">Estado</TableHead>
                    <TableHead className="font-black text-gray-900 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500 font-bold">Cargando...</TableCell></TableRow>
                  ) : products.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>
                        {c.image_url ? (
                           <img src={c.image_url} alt={c.name} className="w-10 h-10 object-cover rounded-lg bg-gray-100 border border-gray-200" />
                        ) : (
                           <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center"><Layers size={16} className="text-gray-400"/></div>
                        )}
                      </TableCell>
                      <TableCell className="font-black text-gray-900">{c.name}</TableCell>
                      <TableCell>
                         <div className="flex flex-wrap gap-1">
                           {c.comboItems?.map(ci => (
                              <Badge key={ci.product_id} variant="secondary" className="bg-gray-100 text-gray-600 text-[10px]">
                                {ci.quantity}x {ci.product.name}
                              </Badge>
                           ))}
                         </div>
                      </TableCell>
                      <TableCell className="font-black text-purple-600">${c.price.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <button 
                          onClick={() => toggleAvailability(c.id, c.is_available)}
                          className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${c.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          {c.is_available ? 'ACTIVO' : 'INACTIVO'}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => deleteProduct(c.id)} className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg">
                          <Trash2 size={18} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {products.length === 0 && !loading && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500 font-bold">No hay combos. Crea uno arriba.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl border-gray-200">
                  <ChevronLeft size={20} />
                </Button>
                <span className="font-bold text-gray-600 text-sm">Página {currentPage} de {totalPages}</span>
                <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-xl border-gray-200">
                  <ChevronRight size={20} />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
    </AdminLayout>
  );
}
