import { Navbar } from "@/components/farma/Navbar";
import { Hero } from "@/components/farma/Hero";
import { Categories } from "@/components/farma/Categories";
import { Delivery } from "@/components/farma/Delivery";
import { Offers } from "@/components/farma/Offers";
import { Combos } from "@/components/farma/Combos";
import { About } from "@/components/farma/About";
import { Testimonials } from "@/components/farma/Testimonials";
import { Contact } from "@/components/farma/Contact";
import { Footer } from "@/components/farma/Footer";
import { WhatsAppFab } from "@/components/farma/WhatsAppFab";
import { Gallery } from "@/components/landing/Gallery";

export default function PharmacyTemplate({ store, categories, offers, combos, preview }: any) {
  const landing = store?.landing_config || {};
  const visibility = landing.sections_visibility || {
    categories: true,
    delivery_info: true,
    offers: true,
    combos: true,
    gallery: true,
    about: false,
    testimonials: false,
    contact: true
  };
  const galleryImages = landing.gallery_images || [];
  const testimonials = Array.isArray(landing.testimonials) ? landing.testimonials : [];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar store={store} />
      <main>
        <Hero store={store} />
        {visibility.categories !== false && <Categories categories={categories} />}
        {visibility.delivery_info !== false && <Delivery />}
        {visibility.offers !== false && <Offers offers={offers} store={store} />}
        {visibility.combos !== false && <Combos combos={combos} store={store} />}
        {visibility.gallery !== false && galleryImages.length > 0 && (
          <Gallery images={galleryImages} storeName={store?.name} />
        )}
        {visibility.about !== false && <About store={store} />}
        {visibility.testimonials === true && <Testimonials items={testimonials} />}
        {visibility.contact !== false && <Contact store={store} />}
      </main>
      <Footer store={store} />
      {!preview && <WhatsAppFab store={store} />}
    </div>
  );
}
