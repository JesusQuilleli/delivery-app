import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/api";
import PharmacyTemplate from "@/components/landing/PharmacyTemplate";
import RestaurantTemplate from "@/components/landing/RestaurantTemplate";
import SupermarketTemplate from "@/components/landing/SupermarketTemplate";
import { ThemeProvider } from "@/components/ThemeProvider";

interface StoreConfig {
  industry?: string;
  theme_color?: string;
  name?: string;
  slug?: string;
  branches?: any[];
}

interface Category {
  id?: number;
  name?: string;
}

interface Product {
  id?: number;
  is_combo?: boolean;
}

export default function Landing() {
  const { slug } = useParams<{ slug: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [offers, setOffers] = useState<Product[]>([]);
  const [combos, setCombos] = useState<Product[]>([]);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.get(`/stores/${slug}/products`);
        const allProducts: Product[] = res.data.products || [];
        setStoreConfig(res.data.store || null);
        setCategories(res.data.categories ? res.data.categories.slice(0, 3) : []);
        setCombos(allProducts.filter((p) => p.is_combo));
        setOffers(allProducts.filter((p) => !p.is_combo).slice(0, 4));
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
    
      {/* F2E-06: Selector de Sucursales Multi-Branch */}
      {storeConfig?.branches && storeConfig.branches.length > 0 && (
        <div className="bg-primary/10 border-b border-primary/20 py-2.5 px-4 text-center text-xs md:text-sm font-semibold flex items-center justify-center gap-2 flex-wrap">
          <span>📍 Esta tienda cuenta con varias sucursales:</span>
          <span className="font-bold underline">{storeConfig.name}</span>
          <span className="text-muted-foreground">• Otras sedes:</span>
          {storeConfig.branches.map((b: any) => (
            <a
              key={b.id}
              href={`/${b.slug}`}
              className="inline-flex items-center gap-1 bg-white text-primary px-3 py-1 rounded-full border border-primary/30 font-bold hover:bg-primary hover:text-white transition-colors"
            >
              📍 {b.name}
            </a>
          ))}
        </div>
      )}

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
