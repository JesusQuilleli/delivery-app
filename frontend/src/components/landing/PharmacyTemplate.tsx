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

export default function PharmacyTemplate({ store, categories, offers, combos }: any) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      <main>
        <Hero store={store} />
        <Categories categories={categories} />
        <Delivery />
        <Offers offers={offers} store={store} />
        <Combos combos={combos} store={store} />
        <About />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
