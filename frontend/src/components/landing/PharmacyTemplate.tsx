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

export default function PharmacyTemplate({ store, categories, offers, combos }: any) {
  const landing = store?.landing_config || {};
  const visibility = landing.sections_visibility || {
    categories: true,
    delivery: true,
    offers: true,
    combos: true,
    gallery: true,
    about: true,
    testimonials: true,
    contact: true
  };
  const galleryImages = landing.gallery_images || [];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar store={store} />
      <main>
        <Hero store={store} />
        {visibility.categories !== false && <Categories categories={categories} />}
        {visibility.delivery !== false && <Delivery />}
        {visibility.offers !== false && <Offers offers={offers} store={store} />}
        {visibility.combos !== false && <Combos combos={combos} store={store} />}
        {visibility.gallery !== false && galleryImages.length > 0 && (
          <Gallery images={galleryImages} storeName={store?.name} />
        )}
        {visibility.about !== false && <About />}
        {visibility.testimonials !== false && <Testimonials />}
        {visibility.contact !== false && <Contact />}
      </main>
      <Footer store={store} />
      <WhatsAppFab store={store} />
    </div>
  );
}
