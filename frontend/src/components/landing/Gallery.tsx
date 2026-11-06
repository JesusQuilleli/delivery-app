import { motion } from 'framer-motion';
import { Camera, Sparkles } from 'lucide-react';

interface GalleryProps {
  images?: string[];
  storeName?: string;
}

export function Gallery({ images = [], storeName = "Nuestro Negocio" }: GalleryProps) {
  if (!images || images.length === 0) return null;

  return (
    <section id="galeria" className="py-16 bg-muted/20 border-y border-border/40">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Camera className="w-3.5 h-3.5" /> Conoce Nuestras Instalaciones
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Fotos de {storeName}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base">
            Visítanos o pide con total confianza. Un espacio pensado para brindarte la mejor atención y calidad.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group relative h-64 rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <img
                src={img}
                alt={`${storeName} foto ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-white text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Instalaciones & Calidad
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
export default Gallery;
