import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/api";
import PharmacyTemplate from "@/components/landing/PharmacyTemplate";
import RestaurantTemplate from "@/components/landing/RestaurantTemplate";
import SupermarketTemplate from "@/components/landing/SupermarketTemplate";
import { ThemeProvider } from "@/components/ThemeProvider";

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

  if (storeConfig?.industry === 'RESTAURANT') {
    return (
      <>
        {storeConfig?.theme_color && <ThemeProvider themeColor={storeConfig.theme_color} />}
        <RestaurantTemplate store={storeConfig} categories={categories} offers={offers} combos={combos} />
      </>
    );
  }

  if (storeConfig?.industry === 'SUPERMARKET') {
    return (
      <>
        {storeConfig?.theme_color && <ThemeProvider themeColor={storeConfig.theme_color} />}
        <SupermarketTemplate store={storeConfig} categories={categories} offers={offers} combos={combos} />
      </>
    );
  }

  // Default to Pharmacy
  return (
    <>
      {storeConfig?.theme_color && <ThemeProvider themeColor={storeConfig.theme_color} />}
      <PharmacyTemplate store={storeConfig} categories={categories} offers={offers} combos={combos} />
    </>
  );
}
