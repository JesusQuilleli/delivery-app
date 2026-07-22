import { Link } from "react-router-dom";
import { ArrowRight, ShoppingCart, Apple, Package, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

export default function SupermarketTemplate({ store, categories, offers, combos }: any) {
  return (
    <div className="min-h-screen bg-green-50 text-gray-900 font-sans">
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-green-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <div className="font-black text-2xl text-green-700 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" /> {store?.name || "Supermercado"}
          </div>
          <Link to={`/${store?.slug}/productos`} className="bg-green-600 text-white px-5 py-2 rounded-full font-bold hover:bg-green-700 transition">
            Ir a la tienda
          </Link>
        </div>
      </nav>

      <main>
        <section className="relative pt-16 pb-16 overflow-hidden bg-gradient-to-b from-green-50 to-white">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="font-display font-black text-5xl lg:text-7xl text-gray-900 leading-tight">
                  Tu despensa llena <br className="hidden sm:block"/>
                  <span className="text-green-600">sin salir de casa.</span>
                </h1>
                <p className="mt-6 text-xl text-gray-600">
                  Frescura garantizada, miles de productos y entrega en la puerta de tu hogar. Todo lo que necesitas para tu semana está aquí.
                </p>
                <div className="mt-10 flex justify-center gap-4">
                  <Link
                    to={`/${store?.slug}/productos`}
                    className="inline-flex items-center gap-2 rounded-xl bg-green-600 text-white px-8 py-4 font-bold shadow-lg hover:bg-green-700 transition"
                  >
                    Empezar a comprar <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-xl text-green-700"><Apple /></div>
                <div>
                  <h3 className="font-bold text-lg">Frescura 100%</h3>
                  <p className="text-gray-500 text-sm mt-1">Seleccionamos los mejores vegetales y carnes para ti.</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-xl text-blue-700"><Package /></div>
                <div>
                  <h3 className="font-bold text-lg">Miles de productos</h3>
                  <p className="text-gray-500 text-sm mt-1">Desde víveres hasta limpieza, todo en un solo lugar.</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex items-start gap-4">
                <div className="bg-purple-100 p-3 rounded-xl text-purple-700"><CreditCard /></div>
                <div>
                  <h3 className="font-bold text-lg">Pago seguro</h3>
                  <p className="text-gray-500 text-sm mt-1">Paga con punto de venta, transferencia o efectivo al recibir.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {categories?.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-5 lg:px-8">
              <h2 className="text-3xl font-black mb-8">Nuestros Pasillos</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {categories.map((cat: any) => (
                  <Link 
                    key={cat.id} 
                    to={`/${store?.slug}/categorias/${cat.id}`}
                    className="flex flex-col items-center p-4 border border-gray-100 rounded-2xl hover:border-green-300 hover:shadow-md transition bg-gray-50/50"
                  >
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-16 h-16 object-cover rounded-full mb-3" />
                    ) : (
                      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                    )}
                    <h3 className="text-gray-900 font-bold text-center text-sm">{cat.name}</h3>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-green-900 text-green-200 py-12 text-center">
        <div className="font-black text-2xl text-white mb-4 flex items-center justify-center gap-2">
          <ShoppingCart className="w-6 h-6" /> {store?.name || "Supermercado"}
        </div>
        <p>© {new Date().getFullYear()} {store?.name}. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
