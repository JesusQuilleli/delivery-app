import { Link } from "react-router-dom";
import { ArrowRight, ShoppingCart, Apple, Package, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { Gallery } from "./Gallery";

export default function SupermarketTemplate({ store, categories }: any) {
  const landing = store?.landing_config || {};
  const visibility = landing.sections_visibility || {
    categories: true,
    features: true,
    banners: true,
    gallery: true
  };
  const banners = landing.banners || [];
  const galleryImages = landing.gallery_images || [];

  return (
    <div className="min-h-screen bg-green-50/50 text-gray-900 font-sans">
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
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold uppercase tracking-wider mb-4">
                  {landing.badge_promo || "Compras Rápidas para el Hogar"}
                </span>
                <h1 className="font-display font-black text-5xl lg:text-7xl text-gray-900 leading-tight">
                  {landing.slogan || (
                    <>
                      Tu despensa llena <br className="hidden sm:block"/>
                      <span className="text-green-600">sin salir de casa.</span>
                    </>
                  )}
                </h1>
                <p className="mt-6 text-xl text-gray-600">
                  {landing.subtitle || "Frescura garantizada, miles de productos y entrega en la puerta de tu hogar. Todo lo que necesitas para tu semana está aquí."}
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
            
            {visibility.features !== false && (
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
                    <p className="text-gray-500 text-sm mt-1">Seleccionamos los mejores víveres, frutas y verduras para ti.</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex items-start gap-4">
                  <div className="bg-green-100 p-3 rounded-xl text-green-700"><Package /></div>
                  <div>
                    <h3 className="font-bold text-lg">Empaque Cuidadoso</h3>
                    <p className="text-gray-500 text-sm mt-1">Tus compras pesadas y delicadas viajan protegidas hasta tu casa.</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex items-start gap-4">
                  <div className="bg-green-100 p-3 rounded-xl text-green-700"><CreditCard /></div>
                  <div>
                    <h3 className="font-bold text-lg">Pago Móvil & Efectivo</h3>
                    <p className="text-gray-500 text-sm mt-1">Paga a tasa oficial BCV en bolívares o en dólares sin complicaciones.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* Banners Promocionales */}
        {visibility.banners !== false && banners.length > 0 && (
          <section className="py-8 bg-green-100/40">
            <div className="max-w-7xl mx-auto px-5 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banners.map((banner: any, i: number) => (
                  <div key={i} className="rounded-2xl overflow-hidden shadow-md bg-white border border-green-200/60 flex flex-col">
                    {banner.image_url && (
                      <img src={banner.image_url} alt={banner.title || "Promoción"} className="h-44 w-full object-cover" />
                    )}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{banner.title}</h4>
                        {banner.subtitle && <p className="text-xs text-gray-500 mt-1">{banner.subtitle}</p>}
                      </div>
                      {banner.link_url && (
                        <Link to={banner.link_url} className="mt-3 inline-flex items-center text-xs font-bold text-green-600 hover:text-green-700">
                          Ver productos <ArrowRight size={14} className="ml-1" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Categorías */}
        {visibility.categories !== false && categories?.length > 0 && (
          <section className="py-16 bg-white border-t border-green-50">
            <div className="max-w-7xl mx-auto px-5 lg:px-8">
              <h2 className="text-3xl font-black mb-8 text-center text-gray-900">Categorías Populares</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {categories.map((cat: any) => (
                  <Link 
                    key={cat.id} 
                    to={`/${store?.slug}/categorias/${cat.id}`}
                    className="p-4 rounded-2xl bg-green-50/50 border border-green-100 hover:bg-green-100/50 hover:border-green-300 transition text-center flex flex-col items-center gap-3 group"
                  >
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden p-2">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-full h-full object-contain" />
                      ) : (
                        <ShoppingCart className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                    <span className="font-bold text-sm text-gray-800 group-hover:text-green-700">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Galería del Local */}
        {visibility.gallery !== false && galleryImages.length > 0 && (
          <Gallery images={galleryImages} storeName={store?.name} />
        )}
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12 text-center">
        <div className="font-black text-2xl text-white mb-4 flex items-center justify-center gap-2">
          <ShoppingCart className="w-6 h-6" /> {store?.name || "Supermercado"}
        </div>
        <p>© {new Date().getFullYear()} {store?.name}. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
