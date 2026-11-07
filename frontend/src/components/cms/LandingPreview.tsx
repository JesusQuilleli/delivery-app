import Storefront from '@/components/landing/Storefront';
import { normalizeLandingDraft, type LandingConfig } from '@/lib/landing';
import { PreviewFrame, type PreviewDevice } from './PreviewFrame';

export type PreviewMode = 'current' | 'draft' | 'compare';

interface LandingPreviewProps {
  store: Record<string, unknown> | null;
  currentConfig: LandingConfig;
  draftConfig: LandingConfig;
  currentTheme: string;
  draftTheme: string;
  mode: PreviewMode;
  device: PreviewDevice;
  categories?: unknown[];
  offers?: unknown[];
  combos?: unknown[];
}

export function LandingPreview({
  store,
  currentConfig,
  draftConfig,
  currentTheme,
  draftTheme,
  mode,
  device,
  categories = [],
  offers = [],
  combos = []
}: LandingPreviewProps) {
  const baseStore = store || { name: 'Tu negocio', industry: 'PHARMACY' };

  const buildStore = (config: LandingConfig, themeColor: string) => ({
    ...baseStore,
    theme_color: themeColor,
    landing_config: normalizeLandingDraft(config)
  });

  const renderStorefront = (config: LandingConfig, themeColor: string) => (
    <Storefront
      store={buildStore(config, themeColor)}
      categories={categories}
      offers={offers}
      combos={combos}
      preview
    />
  );

  if (mode === 'compare') {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        <div className="min-w-[320px] flex-1">
          <PreviewFrame device={device} label="Ahora">
            {renderStorefront(currentConfig, currentTheme)}
          </PreviewFrame>
        </div>
        <div className="min-w-[320px] flex-1">
          <PreviewFrame device={device} label="Con cambios">
            {renderStorefront(draftConfig, draftTheme)}
          </PreviewFrame>
        </div>
      </div>
    );
  }

  return (
    <PreviewFrame device={device} label={mode === 'draft' ? 'Con cambios' : 'Ahora'}>
      {mode === 'draft'
        ? renderStorefront(draftConfig, draftTheme)
        : renderStorefront(currentConfig, currentTheme)}
    </PreviewFrame>
  );
}
