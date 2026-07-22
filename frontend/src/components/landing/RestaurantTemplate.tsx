import { Link } from "react-router-dom";
import { ArrowRight, Utensils, Clock, Star, Flame } from "lucide-react";
import { motion } from "framer-motion";

export default function RestaurantTemplate({ store, categories, offers, combos }: any) {
  return (
    <div className="min-h-screen bg-orange-50 text-gray-900 font-sans">
      {/* Basic Navbar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <div className="font-black text-2xl text-orange-600 flex items-center gap-2">
            <Utensils className="w-6 h-6" /> {store?.name || "Restaurante"}
          </div>
          <Link to={`/${store?.slug}/productos`} className="bg-orange-600 text-white px-5 py-2 rounded-full font-bold hover:bg-orange-700 transition">
            Ver Menú
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-16 pb-12 overflow-hidden">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-sm font-bold">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Caliente y recién hecho
                </span>
                <h1 className="mt-6 font-display font-black text-5xl lg:text-7xl leading-[1.1] text-gray-900">
                  El sabor que amas, <br/>
                  <span className="text-orange-600">directo a tu mesa.</span>
                </h1>
                <p className="mt-6 text-lg text-gray-600 max-w-xl">
                  Disfruta de nuestros mejores platillos sin salir de casa. Delivery súper rápido para que tu comida llegue perfecta.
                </p>
                <div className="mt-8 flex gap-4">
                  <Link
                    to={`/${store?.slug}/productos`}
                    className="inline-flex items-center gap-2 rounded-full bg-orange-600 text-white px-8 py-4 font-bold shadow-xl shadow-orange-600/20 hover:-translate-y-1 transition"
                  >
                    Hacer Pedido <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="aspect-square rounded-full bg-orange-200/50 absolute -inset-4 blur-3xl -z-10" />
                <img 
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop" 
                  alt="Comida deliciosa" 
                  className="rounded-3xl shadow-2xl object-cover aspect-[4/3] w-full"
                />
                
                {/* Floating badge */}
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4">
                  <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                    <Star className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <div className="font-black text-xl">4.9/5</div>
                    <div className="text-sm text-gray-500 font-medium">Reseñas de clientes</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Categorías o "Nuestro Menú" */}
        {categories?.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-5 lg:px-8">
              <h2 className="text-3xl font-black mb-8 text-center">Explora nuestro menú</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((cat: any) => (
                  <Link 
                    key={cat.id} 
                    to={`/${store?.slug}/categorias/${cat.id}`}
                    className="group relative overflow-hidden rounded-2xl aspect-square bg-gray-100"
                  >
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-300">
                        <Utensils className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                      <h3 className="text-white font-bold text-lg">{cat.name}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12 text-center">
        <div className="font-black text-2xl text-white mb-4 flex items-center justify-center gap-2">
          <Utensils className="w-6 h-6" /> {store?.name || "Restaurante"}
        </div>
        <p>© {new Date().getFullYear()} {store?.name}. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
