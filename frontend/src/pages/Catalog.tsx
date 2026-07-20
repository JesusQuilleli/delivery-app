import { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { CartContext } from '../context/CartContext';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Store, Plus, Minus, Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
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
}

export default function Catalog() {
  const { slug, categoryId } = useParams<{ slug: string, categoryId: string }>();
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
        localStorage.setItem('current_store_id', res.data.store.id.toString());
      })
      .catch(err => console.error("Error cargando productos", err))
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
                return (
                  <Card key={p.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border group flex flex-col h-full bg-card">
                    <div className="aspect-square bg-muted/30 flex items-center justify-center p-4 sm:p-6 group-hover:bg-primary/5 transition-colors relative">
                      {p.is_combo && (
                        <div className="absolute top-2 left-2 z-10">
                          <Badge className="bg-purple-600 text-white shadow-md border-0 px-2 py-0.5 text-xs font-black uppercase tracking-wider">🔥 Combo</Badge>
                        </div>
                      )}
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-contain mix-blend-multiply" />
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
                    <CardFooter className="p-3 sm:p-5 pt-0 mt-auto">
                      {qty === 0 ? (
                        <Button 
                          onClick={() => addToCart({ id: p.id, name: p.name, price: p.price })}
                          className="w-full font-bold shadow-sm hover:shadow-md transition-all text-xs sm:text-sm h-9 sm:h-10 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
                        >
                          Agregar
                        </Button>
                      ) : (
                        <div className="flex items-center justify-between w-full bg-primary/10 rounded-xl p-1 border border-primary/20 h-9 sm:h-10">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeFromCart(p.id)}
                            className="h-7 w-7 sm:h-8 sm:w-8 text-primary hover:bg-primary/20 hover:text-primary rounded-lg"
                          >
                            <Minus size={14} className="sm:w-4 sm:h-4" />
                          </Button>
                          <span className="font-black text-primary text-sm sm:text-base w-6 sm:w-8 text-center">{qty}</span>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => addToCart({ id: p.id, name: p.name, price: p.price })}
                            className="h-7 w-7 sm:h-8 sm:w-8 text-primary hover:bg-primary/20 hover:text-primary rounded-lg"
                          >
                            <Plus size={14} className="sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      )}
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
    </div>
  );
}
