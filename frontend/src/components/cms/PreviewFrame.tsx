import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

interface PreviewFrameProps {
  device: PreviewDevice;
  label?: string;
  children: ReactNode;
}

const DEVICE_TARGET_WIDTHS: Record<PreviewDevice, number> = {
  desktop: 1120,
  tablet: 768,
  mobile: 375
};

export function PreviewFrame({ device, label, children }: PreviewFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const w = el.clientWidth;
      if (w > 0) setContainerWidth(w);
    };

    updateWidth();
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [device]);

  const targetWidth = DEVICE_TARGET_WIDTHS[device];
  // Si el contenedor es más estrecho que el ancho objetivo del dispositivo, calculamos la escala
  const scale = containerWidth > 0 && containerWidth < targetWidth
    ? Math.min(1, containerWidth / targetWidth)
    : 1;

  const frameHeight = 680;
  const scaledHeight = scale < 1 ? Math.round(frameHeight / scale) : frameHeight;

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-2">
      {label && (
        <span className="rounded-full bg-muted/80 border px-3 py-1 text-[11px] font-black uppercase tracking-widest text-muted-foreground shadow-sm">
          {label}
        </span>
      )}

      {/* Contenedor Exterior con tamaño fijo del viewport */}
      <div
        ref={containerRef}
        className={`w-full ${
          device === 'mobile' ? 'max-w-[390px]' : device === 'tablet' ? 'max-w-[780px]' : 'max-w-full'
        } overflow-hidden rounded-2xl border-2 border-border/80 bg-white shadow-xl transition-all relative`}
        style={{ height: `${frameHeight}px` }}
      >
        {scale < 1 ? (
          // Lienzo Escalado (Artboard Zoom) para resoluciones donde el contenedor es estrecho (ej. Comparar lado a lado)
          <div
            style={{
              width: `${targetWidth}px`,
              height: `${scaledHeight}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left'
            }}
            className="overflow-y-auto overflow-x-hidden"
          >
            {children}
          </div>
        ) : (
          // Renderizado 100% natural cuando hay suficiente ancho
          <div className="h-full w-full overflow-y-auto overflow-x-hidden">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
