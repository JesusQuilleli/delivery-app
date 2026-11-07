import { useMemo, useState } from 'react';
import { ThemeScope } from '@/components/ThemeScope';
import { haversineKm } from '@/utils/geo';
import PharmacyTemplate from './PharmacyTemplate';
import RestaurantTemplate from './RestaurantTemplate';
import SupermarketTemplate from './SupermarketTemplate';

interface Branch {
  id: number;
  name: string;
  slug: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

interface StoreConfig {
  industry?: string;
  theme_color?: string;
  name?: string;
  slug?: string;
  branches?: Branch[];
  [key: string]: unknown;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface StorefrontProps {
  store: StoreConfig | null;
  categories?: unknown[];
  offers?: unknown[];
  combos?: unknown[];
  preview?: boolean;
}

function BranchSelector({ store, preview }: { store: StoreConfig | null; preview?: boolean }) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const branches = store?.branches;

  const requestLocation = () => {
    if (preview) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => setUserLocation(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  };

  const rankedBranches = useMemo(() => {
    return (branches ?? [])
      .map((branch) => {
        const hasCoordinates = branch.latitude != null && branch.longitude != null;
        const distanceKm = userLocation && hasCoordinates
          ? haversineKm(
              userLocation.latitude,
              userLocation.longitude,
              Number(branch.latitude),
              Number(branch.longitude)
            )
          : Number.POSITIVE_INFINITY;
        return { branch, distanceKm: Number.isFinite(distanceKm) ? distanceKm : null };
      })
      .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));
  }, [branches, userLocation]);

  if (!branches || branches.length === 0) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20 py-2.5 px-4 text-center text-xs md:text-sm font-semibold flex items-center justify-center gap-2 flex-wrap">
      <span>Esta tienda cuenta con varias sucursales:</span>
      <span className="font-bold underline">{store?.name}</span>
      <span className="text-muted-foreground">Elige la más cercana:</span>
      {!userLocation && (
        <button
          type="button"
          onClick={requestLocation}
          disabled={preview}
          className="inline-flex items-center gap-1 bg-white text-primary px-3 py-1 rounded-full border border-primary/30 font-bold hover:bg-primary hover:text-white transition-colors disabled:opacity-60"
        >
          Usar mi ubicación
        </button>
      )}
      {rankedBranches.map(({ branch, distanceKm }, index) => (
        <a
          key={branch.id}
          href={`/${branch.slug}`}
          tabIndex={preview ? -1 : undefined}
          className="inline-flex items-center gap-1 bg-white text-primary px-3 py-1 rounded-full border border-primary/30 font-bold hover:bg-primary hover:text-white transition-colors"
        >
          {branch.name}
          {distanceKm != null && (
            <span className="font-normal">
              ({distanceKm.toFixed(1)} km{index === 0 ? ', la más cercana' : ''})
            </span>
          )}
        </a>
      ))}
    </div>
  );
}

export default function Storefront({ store, categories = [], offers = [], combos = [], preview = false }: StorefrontProps) {
  const template = store?.industry === 'RESTAURANT'
    ? <RestaurantTemplate store={store} categories={categories} offers={offers} combos={combos} preview={preview} />
    : store?.industry === 'SUPERMARKET'
      ? <SupermarketTemplate store={store} categories={categories} offers={offers} combos={combos} preview={preview} />
      : <PharmacyTemplate store={store} categories={categories} offers={offers} combos={combos} preview={preview} />;

  return (
    <ThemeScope themeColor={store?.theme_color} className={preview ? 'pointer-events-none select-none' : undefined}>
      <div aria-hidden={preview || undefined}>
        <BranchSelector store={store} preview={preview} />
        {template}
      </div>
    </ThemeScope>
  );
}
