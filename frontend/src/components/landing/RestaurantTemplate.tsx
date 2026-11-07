import { Link } from "react-router-dom";
import { ArrowRight, Utensils, Star, Flame, Sparkles, ShoppingBag, Clock, Tag, Compass, Heart, Award } from "lucide-react";
import { motion } from "framer-motion";
import { Gallery } from "./Gallery";
import { WhatsAppFab } from "@/components/farma/WhatsAppFab";

export default function RestaurantTemplate({ store, categories = [], preview }: any) {
  const landing = store?.landing_config || {};
  const layoutVariant = landing.layout_variant || 'hero_split';
  const visibility = landing.sections_visibility || {
    categories: true,
    banners: true,
    gallery: true,
    about: true
  };
  const banners = landing.banners || [];
  const galleryImages = landing.gallery_images || [];
  const heroImage = landing.hero_image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop";

  return (
    <div className={`min-h-screen font-sans ${layoutVariant === 'magazine_editorial' ? 'bg-gray-950 text-white' : 'bg-primary/[0.02] text-gray-900'}`}>
      {/* Navbar con color de tema dinámico */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md shadow-xs border-b ${
        layoutVariant === 'magazine_editorial'
          ? 'bg-gray-950/90 border-gray-800 text-white'
          : 'bg-white/90 border-primary/10 text-gray-900'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="font-black text-xl sm:text-2xl text-primary flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Utensils className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span>{store?.name || "Restaurante"}</span>
          </div>
          <Link
            to={`/${store?.slug}/productos`}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-full font-bold text-sm shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            Ver Menú
          </Link>
        </div>
      </nav>

      <main>
        {/* DISEÑO 1: HERO SPLIT (Moderno Gastronómico - Todos los planes) */}
        {layoutVariant === 'hero_split' && (
          <section className="relative pt-10 sm:pt-16 pb-12 overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary border border-primary/20 px-3.5 py-1.5 text-xs sm:text-sm font-black">
                    <Flame className="w-4 h-4 text-primary" />
                    {landing.badge_promo || "Caliente y recién hecho"}
                  </span>
                  <h1 className="mt-5 font-black text-4xl sm:text-5xl lg:text-7xl leading-[1.1] text-gray-950 tracking-tight">
                    {landing.slogan || (
                      <>
                        El sabor que amas, <br/>
                        <span className="text-primary">directo a tu mesa.</span>
                      </>
                    )}
                  </h1>
                  <p className="mt-5 text-base sm:text-lg text-gray-600 max-w-xl font-medium leading-relaxed">
                    {landing.subtitle || "Disfruta de nuestros mejores platillos sin salir de casa. Delivery súper rápido para que tu comida llegue perfecta."}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <Link
                      to={`/${store?.slug}/productos`}
                      className="inline-flex items-center gap-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 font-black shadow-xl shadow-primary/25 hover:-translate-y-1 transition-all text-base"
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
                  <div className="aspect-square rounded-full bg-primary/20 absolute -inset-4 blur-3xl -z-10" />
                  <img 
                    src={heroImage} 
                    alt={store?.name || "Plato estrella"} 
                    className="rounded-3xl shadow-2xl object-cover aspect-[4/3] w-full border border-primary/10"
                  />
                  
                  <div className="absolute -bottom-5 -left-4 sm:-bottom-6 sm:-left-6 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-xl flex items-center gap-3.5 border border-primary/20">
                    <div className="bg-amber-100 p-2.5 sm:p-3 rounded-full text-amber-600 shrink-0">
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                    </div>
                    <div>
                      <div className="font-black text-base sm:text-lg text-gray-900">{landing.badge_delivery_time || "Entrega Rápida"}</div>
                      <div className="text-xs sm:text-sm text-gray-500 font-medium">Directo a tu puerta</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        )}

        {/* DISEÑO 2: BANNER SHOWCASE (Marketplace Promocional Ancho Completo - Plan Negocio) */}
        {layoutVariant === 'minimal_banner' && (
          <section className="relative overflow-hidden">
            <div className="relative min-h-[420px] sm:min-h-[500px] flex items-center justify-center text-center px-4 sm:px-6">
              <img
                src={heroImage}
                alt="Portada de tienda"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/60 to-gray-900/40 backdrop-blur-[1px]" />
              
              <div className="relative z-10 max-w-4xl mx-auto py-12">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/90 text-primary-foreground px-4 py-1.5 text-xs sm:text-sm font-black mb-4 shadow-lg shadow-primary/30">
                  <Sparkles className="w-4 h-4" />
                  {landing.badge_promo || "Promociones y Delivery Express"}
                </span>
                <h1 className="font-black text-4xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-tight">
                  {landing.slogan || store?.name || "Tu Comida Favorita en Minutos"}
                </h1>
                <p className="mt-4 text-base sm:text-xl text-gray-200 max-w-2xl mx-auto font-medium">
                  {landing.subtitle || "Ordena ahora y recibe tus platos recién preparados con la mejor sazón de la ciudad."}
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                  <Link
                    to={`/${store?.slug}/productos`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3.5 font-black text-base shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                  >
                    <ShoppingBag size={18} /> Explorar Catálogo
                  </Link>
                  <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-4 py-2.5 rounded-full text-xs font-bold border border-white/20">
                    <Clock size={14} className="text-primary" /> {landing.badge_delivery_time || "Entrega Rápida"}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* DISEÑO 3: GRID GOURMET (Elegante / Vitrina Directa de Combos - Plan Negocio) */}
        {layoutVariant === 'grid_showcase' && (
          <section className="pt-8 sm:pt-12 pb-8 bg-gradient-to-b from-primary/10 via-white to-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-primary text-primary-foreground rounded-2xl p-4 sm:p-5 shadow-lg shadow-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="p-2.5 bg-white/20 rounded-xl">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-base sm:text-lg">{landing.slogan || "Vitrina Gourmet y Combos Especiales"}</h2>
                    <p className="text-xs sm:text-sm text-primary-foreground/90 font-medium">{landing.subtitle || "Platos preparados al momento con ingredientes frescos."}</p>
                  </div>
                </div>
                <Link
                  to={`/${store?.slug}/productos`}
                  className="bg-white text-gray-900 hover:bg-white/90 px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md shrink-0 transition"
                >
                  Ver Todo el Menú →
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-primary/20 shadow-md flex flex-col justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-black text-xs uppercase tracking-wider mb-4">
                      ⭐ Recomendación del Chef
                    </span>
                    <h3 className="text-2xl sm:text-4xl font-black text-gray-950 tracking-tight leading-snug">
                      {landing.badge_promo || "Sabor Insuperable y Entrega Inmediata"}
                    </h3>
                    <p className="mt-3 text-gray-600 text-sm sm:text-base font-medium">
                      {landing.subtitle || "Selecciona tus platos favoritos y recíbelos en la puerta de tu hogar o trabajo sin complicaciones."}
                    </p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <Clock size={16} className="text-primary" />
                      <span>{landing.badge_delivery_time || "Entrega Rápida"}</span>
                    </div>
                    <Link
                      to={`/${store?.slug}/productos`}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition"
                    >
                      Pedir Ahora
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5 rounded-3xl overflow-hidden shadow-md border border-primary/15 relative min-h-[260px]">
                  <img
                    src={heroImage}
                    alt="Plato estrella"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
                    <span className="text-white font-black text-lg">Calidad 100% Garantizada</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* DISEÑO 4: BOUTIQUE ELEGANTE (Minimalista - Plan Corporativo) */}
        {layoutVariant === 'clean_catalog' && (
          <section className="pt-12 sm:pt-20 pb-12 bg-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-4">
                <Award size={14} /> {landing.badge_promo || "Selección Exclusiva & Menú de Autor"}
              </span>
              <h1 className="font-serif font-black text-4xl sm:text-6xl text-gray-950 tracking-tight leading-tight">
                {landing.slogan || store?.name || "Gastronomía con Estilo y Distinción"}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-gray-500 max-w-2xl mx-auto font-serif italic">
                "{landing.subtitle || "Cada platillo es una obra elaborada con técnicas culinarias refinadas para deleitar tu paladar."}"
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Link
                  to={`/${store?.slug}/productos`}
                  className="px-8 py-3.5 bg-primary text-primary-foreground font-black text-sm rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition"
                >
                  Explorar la Carta
                </Link>
              </div>

              <div className="mt-12 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 max-h-[420px]">
                <img src={heroImage} alt="Boutique" className="w-full h-full object-cover" />
              </div>
            </div>
          </section>
        )}

        {/* DISEÑO 5: STORIES APP (Visual Móvil - Plan Corporativo) */}
        {layoutVariant === 'story_reel' && (
          <section className="pt-4 sm:pt-8 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              {/* Barra de Stories */}
              <div className="mb-6 p-3 bg-white rounded-2xl border border-primary/15 shadow-sm">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2 px-1 flex items-center gap-1">
                  <Flame size={12} className="text-primary" /> Stories & Destacados del Día
                </p>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  <div className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
                    <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-primary to-purple-600 shadow-sm">
                      <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden">
                        <img src={heroImage} alt="Especial" className="w-full h-full object-cover rounded-full" />
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-gray-800">Especial</span>
                  </div>
                  {categories.slice(0, 5).map((cat: any) => (
                    <Link key={cat.id} to={`/${store?.slug}/categorias/${cat.id}`} className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
                      <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-primary/60 to-primary shadow-sm hover:scale-105 transition-transform">
                        <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden flex items-center justify-center">
                          {cat.image_url ? (
                            <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <Utensils size={18} className="text-primary" />
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-gray-700 truncate max-w-[68px]">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Banner Compacto tipo Feed Móvil */}
              <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[16/9] sm:aspect-[21/9] flex items-end p-6 sm:p-10">
                <img src={heroImage} alt="Feed" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                <div className="relative z-10 max-w-lg">
                  <span className="bg-primary text-primary-foreground text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                    {landing.badge_promo || "En Vivo"}
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">{landing.slogan || store?.name}</h2>
                  <p className="text-xs sm:text-sm text-gray-200 mt-1 font-medium">{landing.subtitle || "Pide en 3 toques desde tu celular."}</p>
                  <Link
                    to={`/${store?.slug}/productos`}
                    className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-gray-900 font-black text-xs shadow-md hover:bg-gray-100 transition"
                  >
                    Hacer Pedido Ahora <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* DISEÑO 6: EDITORIAL GOURMET (Dark Mode - Plan Corporativo) */}
        {layoutVariant === 'magazine_editorial' && (
          <section className="pt-12 sm:pt-20 pb-16 bg-gray-950 text-white border-b border-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <div className="flex items-center gap-2">
                    <span className="h-px w-8 bg-primary" />
                    <span className="text-xs uppercase tracking-widest text-primary font-black">
                      {landing.badge_promo || "Edición Gastronómica"}
                    </span>
                  </div>
                  <h1 className="font-serif font-black text-4xl sm:text-6xl lg:text-7xl leading-tight text-white">
                    {landing.slogan || (
                      <>
                        La Alta Cocina <br />
                        <span className="text-primary italic">en tu propio hogar.</span>
                      </>
                    )}
                  </h1>
                  <p className="text-gray-400 font-serif text-base sm:text-lg max-w-xl leading-relaxed">
                    {landing.subtitle || "Una experiencia sensorial sin precedentes. Cada receta preserva el legado de nuestros mejores ingredientes artesanales."}
                  </p>
                  <div className="pt-2 flex items-center gap-4">
                    <Link
                      to={`/${store?.slug}/productos`}
                      className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm rounded-full shadow-lg shadow-primary/30 transition hover:scale-105"
                    >
                      Reservar Pedido
                    </Link>
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Clock size={14} className="text-primary" /> {landing.badge_delivery_time || "Entrega Exprés"}
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 relative">
                  <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
                    <img src={heroImage} alt="Editorial" className="w-full h-full object-cover filter brightness-90 hover:brightness-100 transition duration-700" />
                  </div>
                  <div className="absolute -bottom-6 -right-6 p-4 rounded-2xl bg-gray-900/90 border border-gray-800 text-white shadow-xl backdrop-blur-md">
                    <div className="font-black text-xl text-primary">100%</div>
                    <div className="text-[11px] text-gray-400 font-medium">Sabor Auténtico</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Banners Promocionales (Adaptable a todos los diseños) */}
        {visibility.banners !== false && banners.length > 0 && (
          <section className={`py-8 border-y ${
            layoutVariant === 'magazine_editorial'
              ? 'bg-gray-900/50 border-gray-800'
              : 'bg-primary/[0.04] border-primary/10'
          }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-5">
                <h3 className={`font-black text-xl sm:text-2xl flex items-center gap-2 ${
                  layoutVariant === 'magazine_editorial' ? 'text-white' : 'text-gray-900'
                }`}>
                  <Sparkles size={20} className="text-primary" /> Promociones y Ofertas
                </h3>
                <span className="text-xs font-bold text-primary">Válidas por tiempo limitado</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {banners.map((banner: any, i: number) => (
                  <div key={i} className={`rounded-2xl overflow-hidden shadow-sm hover:shadow-md border flex flex-col transition-all ${
                    layoutVariant === 'magazine_editorial'
                      ? 'bg-gray-900 border-gray-800 text-white'
                      : 'bg-white border-primary/20 text-gray-900'
                  }`}>
                    {banner.image_url && (
                      <img src={banner.image_url} alt={banner.title || "Promoción"} className="h-44 w-full object-cover" />
                    )}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-black text-base sm:text-lg">{banner.title}</h4>
                        {banner.subtitle && <p className={`text-xs mt-1 font-medium ${
                          layoutVariant === 'magazine_editorial' ? 'text-gray-400' : 'text-gray-500'
                        }`}>{banner.subtitle}</p>}
                      </div>
                      {banner.link_url && (
                        <Link to={banner.link_url} className="mt-3 inline-flex items-center text-xs font-bold text-primary hover:underline">
                          Ver promo <ArrowRight size={14} className="ml-1" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Categorías o "Nuestro Menú" */}
        {visibility.categories !== false && categories?.length > 0 && (
          <section className={`py-12 sm:py-16 ${layoutVariant === 'magazine_editorial' ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-primary font-black text-xs uppercase tracking-widest">Catálogo Completo</span>
                <h2 className={`text-3xl sm:text-4xl font-black mt-1 tracking-tight ${
                  layoutVariant === 'magazine_editorial' ? 'text-white' : 'text-gray-950'
                }`}>Explora Nuestro Menú</h2>
                <p className={`text-sm font-medium mt-2 ${
                  layoutVariant === 'magazine_editorial' ? 'text-gray-400' : 'text-gray-500'
                }`}>Elige tu categoría preferida y descubre nuestras mejores opciones preparadas al instante.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {categories.map((cat: any) => (
                  <Link 
                    key={cat.id} 
                    to={`/${store?.slug}/categorias/${cat.id}`}
                    className={`group relative overflow-hidden rounded-2xl aspect-square border shadow-xs hover:shadow-lg transition-all duration-300 ${
                      layoutVariant === 'magazine_editorial'
                        ? 'bg-gray-900 border-gray-800 hover:border-primary/50'
                        : 'bg-gray-50 border-primary/10 hover:border-primary/30'
                    }`}
                  >
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                        <Utensils className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-4">
                      <div>
                        <h3 className="text-white font-black text-base sm:text-lg group-hover:text-primary transition-colors">{cat.name}</h3>
                        <span className="text-gray-300 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                          Explorar platillos →
                        </span>
                      </div>
                    </div>
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

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12 text-center border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="font-black text-xl sm:text-2xl text-white mb-2 flex items-center justify-center gap-2">
            <Utensils className="w-5 h-5 text-primary" /> {store?.name || "Restaurante"}
          </div>
          <p className="text-xs text-gray-500 font-medium">Pedidos directos y delivery en tiempo real con TiendaFast.</p>
          <p className="text-xs text-gray-600 mt-4">© {new Date().getFullYear()} {store?.name}. Todos los derechos reservados.</p>
        </div>
      </footer>
      {!preview && <WhatsAppFab store={store} />}
    </div>
  );
}
