import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';

export function About({ store }: { store?: any }) {
  const landing = store?.landing_config || {};
  const title = landing.about_title || 'Sobre nosotros';
  const text = landing.about_text || '';
  const images: string[] = Array.isArray(landing.about_images) && landing.about_images.length > 0
    ? landing.about_images
    : Array.isArray(landing.gallery_images)
      ? landing.gallery_images.slice(0, 2)
      : [];

  if (!text) return null;

  return (
    <section id="nosotros" className="py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 grid grid-cols-12 gap-5">
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-4"
          >
            {images.slice(0, 2).map((image, index) => (
              <div
                key={`${image}-${index}`}
                className={`rounded-3xl overflow-hidden ${index === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-square'}`}
              >
                <img src={image} alt={`${store?.name || 'Negocio'} - foto ${index + 1}`} loading="lazy" className="w-full h-full object-cover" />
              </div>
            ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`col-span-12 ${images.length > 0 ? 'lg:col-span-5 lg:pl-6' : 'lg:col-span-8 lg:col-start-3'} flex flex-col justify-center`}
        >
          <span className="text-coral font-semibold text-sm uppercase tracking-widest">Sobre nosotros</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl mt-2 leading-tight">
            {title}
          </h2>
          <p className="mt-5 text-muted-foreground whitespace-pre-line">{text}</p>
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <BadgeCheck className="w-4 h-4 text-primary" />
            Información publicada por {store?.name || 'el negocio'}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
