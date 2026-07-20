import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { CartContext } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Store, Plus, Minus, Package, Layers } from 'lucide-react';
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
  description: string | null;
  stock: number | null;
  is_available: boolean;
  is_combo: boolean;
  category?: Category;
  comboItems?: { product: { name: string; id: number }; quantity: number }[];
}

export default function ProductDetails() {
  const { slug, productId } = useParams<{ slug: string; productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { cart, addToCart, removeFromCart } = useContext(CartContext);

  useEffect(() => {
    api.get(`/stores/${slug}/products/${productId}`)
      .then(res => {
        setProduct(res.data.product || res.data); // Por si el backend no ha reiniciado, fallback
        setRelatedProducts(res.data.relatedProducts || []);
        setStoreConfig(res.data.store || null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando detalles del producto", err);
        setLoading(false);
      });
  }, [slug, productId]);

  const qty = product ? (cart.find(i => i.product_id === product.id)?.quantity || 0) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground font-bold">Cargando detalles...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <Package className="w-20 h-20 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-black mb-2">Producto no encontrado</h2>
        <p className="text-muted-foreground mb-6">Este producto ya no existe o no está disponible.</p>
        <Button onClick={() => navigate(`/${slug}/productos`)} className="rounded-xl px-8 h-12 text-lg font-bold">Volver al Catálogo</Button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 bg-secondary/20 min-h-screen pb-32 pt-8 px-4 flex flex-col items-center">
      {/* Botón Volver (Inline) */}
      <div className="w-full max-w-5xl mb-6">
        <Button 
          onClick={() => navigate(-1)} 
          variant="ghost" 
          className="hover:bg-black/5 text-muted-foreground font-bold"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver
        </Button>
      </div>

      <div className="w-full max-w-5xl bg-card rounded-[2rem] sm:rounded-[3rem] shadow-xl overflow-hidden flex flex-col md:flex-row border border-border/50 relative z-20">
        
        {/* Imagen Principal */}
        <div className="w-full md:w-1/2 bg-muted/20 p-8 sm:p-12 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 z-0"></div>
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full max-w-sm h-auto object-contain mix-blend-multiply relative z-10 hover:scale-105 transition-transform duration-500" style={{ maxHeight: '400px' }} />
          ) : (
            <div className="w-full max-w-xs aspect-square bg-muted flex items-center justify-center rounded-3xl relative z-10">
              <Store className="w-20 h-20 text-muted-foreground opacity-50" />
            </div>
          )}
        </div>

        {/* Detalles */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center relative z-20">
        <div className="flex flex-wrap gap-2 mb-4">
          {product.category && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0 px-3 py-1 text-sm font-bold capitalize">
              {product.category.name}
            </Badge>
          )}
          {product.is_combo && (
            <Badge className="bg-purple-600 text-white border-0 px-3 py-1 text-sm font-black uppercase tracking-wider shadow-md">
              🔥 Súper Combo
            </Badge>
          )}
        </div>
        
        <h1 className="text-3xl sm:text-5xl font-black text-foreground leading-tight mb-2 font-display">{product.name}</h1>
        
        <div className="flex items-center gap-4 mb-6">
          <p className="text-4xl font-black text-primary font-display">{formatPrice(product.price, storeConfig?.currency)}</p>
          {product.stock !== null ? (
            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Stock: {product.stock}
            </span>
          ) : (
            <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
              Stock Ilimitado
            </span>
          )}
        </div>

        {product.description && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-foreground mb-2">Descripción del Producto</h3>
            <p className="text-muted-foreground text-base leading-relaxed whitespace-pre-line bg-card p-4 rounded-2xl border border-border shadow-sm">
              {product.description}
            </p>
          </div>
        )}

        {product.is_combo && product.comboItems && product.comboItems.length > 0 && (
          <div className="mb-8 bg-purple-50/50 p-5 rounded-3xl border border-purple-100">
            <h3 className="text-lg font-black text-purple-900 mb-3 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              ¿Qué incluye este combo?
            </h3>
            <ul className="space-y-3">
              {product.comboItems.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-purple-50">
                  <div className="bg-purple-100 text-purple-700 font-black w-8 h-8 flex items-center justify-center rounded-lg text-sm">
                    {item.quantity}x
                  </div>
                  <span className="font-semibold text-gray-800">{item.product.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      </div>
      
      {/* Relacionados (fuera de la tarjeta principal) */}
      {relatedProducts.length > 0 && (
        <div className="w-full max-w-5xl mt-16 px-4">
            <h3 className="text-xl font-black text-foreground mb-4">También podría interesarte</h3>
            <div className="grid grid-cols-2 gap-4">
              {relatedProducts.map(rp => (
                <div key={rp.id} onClick={() => navigate(`/${slug}/productos/${rp.id}`)} className="cursor-pointer group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="aspect-square bg-muted flex items-center justify-center p-2 relative">
                    {rp.image_url ? (
                      <img src={rp.image_url} alt={rp.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                    ) : (
                       <Store className="w-8 h-8 text-muted-foreground opacity-30" />
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-sm line-clamp-2 leading-tight">{rp.name}</h4>
                    <p className="font-black text-primary mt-1">{formatPrice(rp.price, storeConfig?.currency)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


      {/* Floating Add to Cart Button */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-background via-background to-transparent z-50">
        <div className="max-w-md mx-auto">
          {qty === 0 ? (
            <Button 
              onClick={() => addToCart({ id: product.id, name: product.name, price: product.price })}
              className="w-full h-14 text-lg font-black bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-xl shadow-primary/25 transition-all transform hover:-translate-y-1"
            >
              <Plus className="mr-2 w-5 h-5" /> Añadir al Carrito
            </Button>
          ) : (
            <div className="flex items-center justify-between w-full h-14 bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/25 px-2">
              <Button 
                variant="ghost" 
                onClick={() => removeFromCart(product.id)}
                className="h-10 w-10 sm:h-12 sm:w-12 hover:bg-black/10 hover:text-white rounded-xl text-white"
              >
                <Minus size={24} />
              </Button>
              <div className="flex flex-col items-center">
                <span className="font-black text-xl leading-none">{qty}</span>
                <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">en carrito</span>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => addToCart({ id: product.id, name: product.name, price: product.price })}
                className="h-10 w-10 sm:h-12 sm:w-12 hover:bg-black/10 hover:text-white rounded-xl text-white"
              >
                <Plus size={24} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
