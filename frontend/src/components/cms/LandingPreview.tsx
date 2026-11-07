import { useState } from 'react';
import Storefront from '@/components/landing/Storefront';
import { normalizeLandingDraft, type LandingConfig } from '@/lib/landing';
import { PreviewFrame, type PreviewDevice } from './PreviewFrame';
import { Columns2, ArrowLeftRight } from 'lucide-react';

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
  const [compareStyle, setCompareStyle] = useState<'side-by-side' | 'toggle'>('toggle');
  const [activeCompareTab, setActiveCompareTab] = useState<'draft' | 'current'>('draft');

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
      <div className="w-full flex flex-col gap-3">
        {/* Barra de opciones de comparación */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 p-2 sm:p-2.5 rounded-2xl border border-border/60">
          <span className="text-xs font-black text-muted-foreground flex items-center gap-1.5 pl-1">
            <Columns2 size={15} className="text-primary" /> Comparación Visual:
          </span>
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-border/80 shadow-xs">
            <button
              type="button"
              onClick={() => setCompareStyle('side-by-side')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                compareStyle === 'side-by-side'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ◫ Lado a Lado
            </button>
            <button
              type="button"
              onClick={() => setCompareStyle('toggle')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                compareStyle === 'toggle'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowLeftRight size={13} /> Alternar (Ancho Completo)
            </button>
          </div>
        </div>

        {compareStyle === 'side-by-side' ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 w-full items-start">
            <div className="w-full min-w-0">
              <PreviewFrame device={device} label="Ahora (Publicado)">
                {renderStorefront(currentConfig, currentTheme)}
              </PreviewFrame>
            </div>
            <div className="w-full min-w-0">
              <PreviewFrame device={device} label="Con cambios (Borrador)">
                {renderStorefront(draftConfig, draftTheme)}
              </PreviewFrame>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1 bg-muted/80 p-1 rounded-full border border-border shadow-xs">
                <button
                  type="button"
                  onClick={() => setActiveCompareTab('current')}
                  className={`text-xs px-4 py-1.5 rounded-full font-black transition-all ${
                    activeCompareTab === 'current'
                      ? 'bg-white text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  👁️ Ahora (Publicado)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCompareTab('draft')}
                  className={`text-xs px-4 py-1.5 rounded-full font-black transition-all ${
                    activeCompareTab === 'draft'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ✨ Con Cambios (Borrador)
                </button>
              </div>
            </div>

            <PreviewFrame
              device={device}
              label={activeCompareTab === 'draft' ? 'Con cambios (Borrador)' : 'Ahora (Publicado)'}
            >
              {activeCompareTab === 'draft'
                ? renderStorefront(draftConfig, draftTheme)
                : renderStorefront(currentConfig, currentTheme)}
            </PreviewFrame>
          </div>
        )}
      </div>
    );
  }

  return (
    <PreviewFrame device={device} label={mode === 'draft' ? 'Con cambios (Borrador)' : 'Ahora (Publicado)'}>
      {mode === 'draft'
        ? renderStorefront(draftConfig, draftTheme)
        : renderStorefront(currentConfig, currentTheme)}
    </PreviewFrame>
  );
}
