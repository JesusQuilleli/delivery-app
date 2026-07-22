import { useContext, useState, useEffect } from 'react';
import { useParams, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Store, ArrowLeft, X } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { Button } from './ui/button';
import api from '../api';
import { formatPrice } from '../utils/currency';

export default function Layout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, total, removeFromCart, isCartOpen, setIsCartOpen } = useContext(CartContext);
  const { token, user } = useContext(AuthContext);
  const [storeConfig, setStoreConfig] = useState<any>(null);

  useEffect(() => {
    if (slug) {
      api.get(`/stores/${slug}/products`).then(res => {
        setStoreConfig(res.data.store || null);
      }).catch(console.error);
    }
  }, [slug]);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isCheckout = location.pathname.includes('/checkout');
  const isCatalog = location.pathname.endsWith('/productos');

  const goToCheckout = () => {
    setIsCartOpen(false);
    navigate(`/${slug}/checkout`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar Global */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
            onClick={() => navigate(`/${slug}`)}
          >
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-inner">
              <Store className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-black tracking-tight text-gray-900 capitalize hidden sm:block">
              {slug?.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {token && user?.role === 'CLIENT' && (
              <Button
                variant="ghost"
                onClick={() => navigate(`/${slug}/mis-pedidos`)}
                className="font-bold text-gray-700 p-2 sm:px-4 sm:py-2"
                title="Mis Pedidos"
              >
                <span className="hidden sm:inline">Mis Pedidos</span>
                <span className="sm:hidden text-xl" role="img" aria-label="Pedidos">📦</span>
              </Button>
            )}

            {!isCheckout && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-600 hover:text-orange-500 transition-colors"
              >
                <ShoppingCart size={28} />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            )}

            {isCheckout && (
              <Button variant="ghost" onClick={() => navigate(`/${slug}`)} className="text-gray-500 hover:text-gray-900 font-bold">
                <ArrowLeft className="mr-2" size={18} /> Volver a Tienda
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="max-w-5xl mx-auto pb-20">
        <Outlet />
      </main>

      {/* Modal Lateral del Carrito */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay oscuro */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Panel Lateral */}
          <div className="relative w-full max-w-full sm:max-w-md h-full bg-white shadow-2xl flex flex-col">
            <div className="p-4 sm:p-6 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2 tracking-tight">
                <ShoppingCart size={24} className="text-orange-500" /> Mi Pedido
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-full hover:bg-gray-100 border shadow-sm transition">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <ShoppingCart size={40} className="text-gray-300" />
                  </div>
                  <p className="text-xl font-bold text-gray-600">Tu carrito está vacío</p>
                  <p className="text-sm mt-2 text-center">Explora nuestro catálogo y agrega productos para tu salud.</p>
                  <Button variant="outline" className="mt-8 font-bold" onClick={() => setIsCartOpen(false)}>
                    Explorar Productos
                  </Button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product_id} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm items-center hover:shadow-md transition">
                    <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-orange-100">
                      <Store className="text-orange-500/50" size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 leading-tight">{item.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                          {item.quantity} x {formatPrice(item.unit_price, storeConfig?.currency)}
                        </span>
                        <span className="font-black text-gray-900 text-lg">
                          {formatPrice(item.quantity * item.unit_price, storeConfig?.currency)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 sm:p-6 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] pb-8 sm:pb-6">
                <div className="flex justify-between items-end mb-4 sm:mb-6">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-xs sm:text-sm">Total a pagar</span>
                  <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">{formatPrice(total, storeConfig?.currency)}</span>
                </div>
                <Button
                  variant="brand"
                  onClick={goToCheckout}
                  className="w-full h-14 sm:h-16 text-lg sm:text-xl font-black shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 rounded-2xl"
                >
                  Proceder al Pago
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
