import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/api';
import Storefront from '@/components/landing/Storefront';

interface StoreConfig {
  industry?: string;
  theme_color?: string;
  name?: string;
  slug?: string;
  [key: string]: unknown;
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
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.get(`/stores/${slug}/products`);
        const allProducts: Product[] = res.data.products || [];
        setStoreConfig(res.data.store || null);
        setCategories(res.data.categories ? res.data.categories.slice(0, 3) : []);
        setCombos(allProducts.filter((p) => p.is_combo));
        setOffers(allProducts.filter((p) => !p.is_combo).slice(0, 4));
      } catch (fetchError) {
        console.error('Error fetching landing data', fetchError);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchCatalog();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Cargando...</div>;
  }

  if (error || !storeConfig) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="font-display text-2xl font-extrabold">Tienda no disponible</h1>
        <p className="text-sm text-muted-foreground">Revisa el enlace o contacta al negocio.</p>
        <a href="/" className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
          Ir a TiendaFast
        </a>
      </div>
    );
  }

  return <Storefront store={storeConfig} categories={categories} offers={offers} combos={combos} />;
}
