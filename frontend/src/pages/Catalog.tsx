import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { CartContext } from '../context/CartContext';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Store, Plus, Minus, Search, AlertTriangle, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import { formatPrice } from '../utils/currency';

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  is_combo?: boolean;
  description?: string | null;
  category_id?: number | null;
  stock?: number | null;
  is_available?: boolean;
  requires_prescription?: boolean;
  prescription_type?: string;
}

export default function Catalog() {
  const { slug, categoryId } = useParams<{ slug: string, categoryId: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>(categoryId ? Number(categoryId) : 'ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const { cart, addToCart, removeFromCart } = useContext(CartContext);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const [storeError, setStoreError] = useState<string | null>(null);

  // F2C-13: Módulo Cotizador por Récipe
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteName, setQuoteName] = useState('');
  const [quotePhone, setQuotePhone] = useState('');
  const [quoteAddress, setQuoteAddress] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteImageUrl, setQuoteImageUrl] = useState('');
  const [isUploadingRecipe, setIsUploadingRecipe] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  const handleRecipeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El récipe no debe pesar más de 5MB");
      return;
    }
    setIsUploadingRecipe(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setQuoteImageUrl(res.data.imageUrl);
      toast.success("Foto del récipe cargada");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al subir foto del récipe");
    } finally {
      setIsUploadingRecipe(false);
    }
  };

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteName || !quotePhone || !quoteImageUrl) {
      toast.error("Por favor completa tu nombre, teléfono y foto del récipe.");
      return;
    }
    setIsSubmittingQuote(true);
    try {
      await api.post(`/orders/prescription-quote/${slug}`, {
        customer_name: quoteName,
        customer_phone: quotePhone,
        delivery_address: quoteAddress,
        prescription_url: quoteImageUrl,
        notes: quoteNotes
      });
      toast.success("¡Récipe enviado con éxito! La farmacia revisará disponibilidad y te enviará la cotización por WhatsApp.");
      setIsQuoteOpen(false);
      setQuoteName('');
      setQuotePhone('');
      setQuoteAddress('');
      setQuoteNotes('');
      setQuoteImageUrl('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al enviar la solicitud de cotización");
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: ITEMS_PER_PAGE.toString(),
      categoryId: selectedCategory.toString()
    });
    if (debouncedSearchTerm) {
      params.append('search', debouncedSearchTerm);
    }

    api.get(`/stores/${slug}/products?${params.toString()}`)
      .then(res => {
        setProducts(res.data.products);
        // Sólo setear categorías la primera vez para no perder el filtro al buscar
        if (res.data.categories && categories.length === 0) {
          setCategories(res.data.categories);
        }
        setStoreConfig(res.data.store);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages);
        } else {
          setTotalPages(1);
        }
      })
      .catch(err => {
        console.error("Error cargando productos", err);
        if (err.response?.status === 404 || err.response?.status === 403) {
          setStoreError(err.response?.data?.error || 'Esta tienda se encuentra temporalmente inactiva o no existe.');
        }
      })
      .finally(() => setIsLoading(false));
  }, [slug, debouncedSearchTerm, selectedCategory, currentPage]);

  // Si cambia el parámetro de URL, actualizar la categoría
  useEffect(() => {
    if (categoryId) {
      setSelectedCategory(Number(categoryId));
    } else {
      setSelectedCategory('ALL');
    }
  }, [categoryId]);

  // Si cambia la categoría o la búsqueda, volver a la página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, debouncedSearchTerm]);

  const getProductQuantity = (productId: number) => {
    const item = cart.find(i => i.product_id === productId);
    return item ? item.quantity : 0;
  };

  if (storeError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full text-center p-8 border border-border shadow-xl rounded-3xl">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-black mb-2">Tienda no disponible</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {storeError}
          </p>
          <Button onClick={() => navigate('/')} className="w-full rounded-2xl font-bold">
            Volver al Inicio
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 bg-background min-h-screen pb-20">
      
      {/* Cabecera de Compras */}
      <div className="bg-primary text-primary-foreground pt-10 pb-16 px-4 relative overflow-hidden rounded-b-[2rem] sm:rounded-b-[3rem] shadow-sm">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md text-primary">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-3 tracking-tight capitalize font-display">
            Catálogo {slug?.replace('-', ' ')}
          </h1>
          <p className="text-primary-foreground/90 text-sm sm:text-lg max-w-xl mx-auto font-medium">
            Encuentra y agrega rápidamente los productos que necesitas.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto -mt-8 relative z-20">
        {/* F2C-13: Botón Pedir con mi Récipe para Farmacias */}
        {(storeConfig?.industry?.toUpperCase() === 'PHARMACY' || storeConfig?.industry?.toUpperCase() === 'FARMACIA') && (
          <div className="px-4 mb-4 flex justify-center">
            <button
              onClick={() => setIsQuoteOpen(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-2xl font-black text-sm sm:text-base shadow-lg shadow-emerald-600/20 flex items-center gap-2 transform hover:scale-[1.02] transition-all"
            >
              <FileText className="w-5 h-5 text-emerald-200" />
              ¿Tienes Récipe Médico? Pide subiendo tu foto aquí
            </button>
          </div>
        )}
        {/* Buscador */}
        <div className="px-4 mb-6">
          <div className="max-w-2xl mx-auto bg-card p-2 rounded-2xl shadow-lg flex items-center gap-2 border border-border focus-within:ring-2 ring-primary transition-all">
            <Search className="text-muted-foreground ml-3" size={24} />
            <Input 
              placeholder="Buscar productos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-none shadow-none text-base sm:text-lg h-12 focus-visible:ring-0 px-2 bg-transparent"
            />
          </div>
        </div>

        {/* Categorías */}
        {categories.length > 0 && (
          <div className="px-4 mb-8">
            <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
              <Button 
                variant={selectedCategory === 'ALL' ? 'default' : 'outline'}
                className="rounded-full font-bold whitespace-nowrap bg-background shadow-sm hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => setSelectedCategory('ALL')}
              >
                Todas
              </Button>
              {categories.map(c => (
                <Button 
                  key={c.id}
                  variant={selectedCategory === c.id ? 'default' : 'outline'}
                  className="rounded-full font-bold whitespace-nowrap bg-background shadow-sm hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={() => setSelectedCategory(c.id)}
                >
                  {c.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Productos */}
        <div className="px-4 relative">
          {isLoading ? (
            <div className="text-center py-20 text-muted-foreground font-bold flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              Buscando productos...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground font-bold">No se encontraron productos con estos criterios.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {products.map(p => {
                  const qty = getProductQuantity(p.id);
                  const soldOut = p.is_available === false || (p.stock != null && p.stock <= 0);
                  const maxed = p.stock != null && qty >= p.stock;
                return (
                  <Card key={p.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border group flex flex-col h-full bg-card">
                    <div 
                      onClick={() => navigate(`/${slug}/productos/${p.id}`)}
                      className="aspect-square bg-muted/30 flex items-center justify-center p-4 sm:p-6 group-hover:bg-primary/5 transition-colors relative cursor-pointer"
                    >
                      {p.is_combo && (
                        <div className="absolute top-2 left-2 z-10">
                          <Badge className="bg-purple-600 text-white shadow-md border-0 px-2 py-0.5 text-xs font-black uppercase tracking-wider">Combo</Badge>
                        </div>
                      )}
                      {p.prescription_type === 'RETAIN_ORIGINAL' && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge className="bg-rose-600 text-white shadow-md border-0 px-2 py-0.5 text-[10px] font-bold">
                            🔒 Retención Récipe
                          </Badge>
                        </div>
                      )}
                      {p.prescription_type === 'SHOW_ONLY' && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge className="bg-sky-600 text-white shadow-md border-0 px-2 py-0.5 text-[10px] font-bold">
                            📄 Mostrar Récipe
                          </Badge>
                        </div>
                      )}
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className={`w-full h-full object-contain mix-blend-multiply ${soldOut ? "opacity-35 grayscale" : ""}`} />
                      ) : (
                        <img src="https://placehold.co/400x400/f8fafc/94a3b8?text=Sin+Imagen" alt={p.name} className="w-full h-full object-contain mix-blend-multiply opacity-50" />
                      )}
                    </div>
                    <CardContent className="p-3 sm:p-5 flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground leading-tight mb-1 sm:mb-2 line-clamp-2 text-sm sm:text-base">{p.name}</h3>
                        {p.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-snug font-medium">{p.description}</p>}
                      </div>
                      <p className="text-lg sm:text-xl font-black text-primary font-display">{formatPrice(p.price, storeConfig?.currency)}</p>
                    </CardContent>
<CardFooter className="p-2 sm:p-5 pt-0 mt-auto">
  <div className="flex items-center gap-1.5 sm:gap-2 w-full">
    <Button 
      onClick={() => navigate(`/${slug}/productos/${p.id}`)}
      variant="outline"
      className="flex-1 font-bold shadow-sm hover:shadow-md transition-all text-[10px] sm:text-sm h-8 sm:h-10 rounded-lg sm:rounded-xl text-primary border-primary/30 hover:bg-primary/10 whitespace-nowrap px-1"
    >
      Ver Detalles
    </Button>
    {qty === 0 ? (
      <Button 
        onClick={() => addToCart({ id: p.id, name: p.name, price: p.price, stock: p.stock, requires_prescription: p.requires_prescription, prescription_type: p.prescription_type })}
        disabled={soldOut}
        className="flex-1 font-bold shadow-sm hover:shadow-md transition-all text-[10px] sm:text-sm h-8 sm:h-10 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg sm:rounded-xl px-1 whitespace-nowrap disabled:opacity-50"
      >
        {soldOut ? 'Agotado' : 'Agregar'}
      </Button>
    ) : (
      <div className="flex items-center justify-between w-full bg-primary/10 rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-primary/20 h-8 sm:h-10 flex-1">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => removeFromCart(p.id)}
          className="h-7 w-6 sm:h-8 sm:w-8 text-primary hover:bg-primary/20 hover:text-primary rounded-lg"
        >
          <Minus size={13} className="sm:w-4 sm:h-4" />
        </Button>
        <span className="font-black text-primary text-sm sm:text-base w-5 sm:w-8 text-center">{qty}</span>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => addToCart({ id: p.id, name: p.name, price: p.price, stock: p.stock, requires_prescription: p.requires_prescription, prescription_type: p.prescription_type })}
          disabled={maxed}
          className="h-7 w-6 sm:h-8 sm:w-8 text-primary hover:bg-primary/20 hover:text-primary rounded-lg disabled:opacity-40"
        >
          <Plus size={13} className="sm:w-4 sm:h-4" />
        </Button>
      </div>
    )}
  </div>
</CardFooter>
                  </Card>
                );
              })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12 mb-8">
                  <Button 
                    variant="outline" 
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage(prev => Math.max(prev - 1, 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="rounded-xl font-bold bg-card hover:bg-muted"
                  >
                    Anterior
                  </Button>
                  
                  <span className="text-sm font-bold text-muted-foreground mx-2">
                    Página {currentPage} de {totalPages}
                  </span>

                  <Button 
                    variant="outline" 
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage(prev => Math.min(prev + 1, totalPages));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="rounded-xl font-bold bg-card hover:bg-muted"
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* F2C-13: Modal Pedir con mi Récipe */}
      <Dialog open={isQuoteOpen} onOpenChange={setIsQuoteOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-gray-900">
              <FileText className="text-emerald-600" /> Pedir con mi Récipe Médico
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600">
              Sube la foto de tu récipe manuscrito. Nuestro farmaceuta validará la disponibilidad en stock y te enviará la cotización con el total directo a tu WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendQuote} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase">Tu Nombre y Apellido</label>
              <Input
                required
                placeholder="Ej. Carmen Rodríguez"
                value={quoteName}
                onChange={e => setQuoteName(e.target.value)}
                className="rounded-xl bg-gray-50 border-gray-200 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase">Teléfono / WhatsApp</label>
              <Input
                required
                placeholder="Ej. +584121234567"
                value={quotePhone}
                onChange={e => setQuotePhone(e.target.value)}
                className="rounded-xl bg-gray-50 border-gray-200 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase">Dirección de Entrega (Opcional)</label>
              <Input
                placeholder="Sector, calle y punto de referencia..."
                value={quoteAddress}
                onChange={e => setQuoteAddress(e.target.value)}
                className="rounded-xl bg-gray-50 border-gray-200 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase">Notas adicionales para el farmaceuta</label>
              <Input
                placeholder="Ej. ¿Tienen en jarabe? ¿Tienen marcas genéricas?"
                value={quoteNotes}
                onChange={e => setQuoteNotes(e.target.value)}
                className="rounded-xl bg-gray-50 border-gray-200 text-sm"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-gray-700 uppercase">Foto del Récipe Médico</label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingRecipe}
                  onChange={handleRecipeUpload}
                  className="rounded-xl bg-gray-50 border-gray-200 text-xs file:bg-emerald-100 file:text-emerald-800 file:border-0 file:rounded-lg file:font-semibold"
                />
                {quoteImageUrl && (
                  <img src={quoteImageUrl} alt="Récipe" className="h-12 w-12 object-cover rounded-lg border border-emerald-300 shadow-sm" />
                )}
              </div>
              {isUploadingRecipe && <p className="text-xs text-emerald-600 animate-pulse">Subiendo foto...</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmittingQuote || isUploadingRecipe || !quoteImageUrl}
              className="w-full h-12 font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white mt-4 shadow-lg shadow-emerald-600/20"
            >
              {isSubmittingQuote ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" size={18} />}
              Enviar Récipe a Farmacia
            </Button>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
