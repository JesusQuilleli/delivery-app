import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/api";
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

export default function Landing() {
  const { slug } = useParams<{ slug: string }>();
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);
  const [combos, setCombos] = useState([]);
  const [storeConfig, setStoreConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.get(`/stores/${slug}/products`);
        const allProducts = res.data.products || [];
        setStoreConfig(res.data.store || null);
        setCategories(res.data.categories ? res.data.categories.slice(0, 3) : []);
        setCombos(allProducts.filter((p: any) => p.is_combo));
        setOffers(allProducts.filter((p: any) => !p.is_combo).slice(0, 4));
      } catch (error) {
        console.error("Error fetching landing data", error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchCatalog();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      <main>
        <Hero />
        <Categories categories={categories} />
        <Delivery />
        <Offers offers={offers} store={storeConfig} />
        <Combos combos={combos} store={storeConfig} />
        <About />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
