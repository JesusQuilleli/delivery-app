import { useLayoutEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

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
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

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
  // Si el contenedor exterior es más estrecho que el ancho objetivo del dispositivo, calculamos la escala
  const scale = containerWidth > 0 && containerWidth < targetWidth
    ? Math.min(1, containerWidth / targetWidth)
    : 1;

  const frameHeight = 680;
  const scaledHeight = scale < 1 ? Math.round(frameHeight / scale) : frameHeight;

  // Inyectar estilos del documento principal al iframe para emulación real de media queries
  const setupIframe = useCallback((iframe: HTMLIFrameElement | null) => {
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;

      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
      doc.head.innerHTML = styles.map((s) => s.outerHTML).join('\n') + `
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            min-height: 100%;
            overflow-x: hidden;
            font-family: inherit;
            background-color: transparent;
            -webkit-font-smoothing: antialiased;
          }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 9999px; }
        </style>
      `;

      doc.body.className = document.body.className;
      setMountNode(doc.body);
    } catch (e) {
      console.warn('Error inicializando iframe sandbox de vista previa:', e);
    }
  }, []);

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
        <div
          style={{
            width: `${targetWidth}px`,
            height: `${scaledHeight}px`,
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: 'top left'
          }}
          className="h-full w-full"
        >
          <iframe
            ref={setupIframe}
            title={label || 'Device Preview'}
            style={{ width: `${targetWidth}px`, height: `${scaledHeight}px` }}
            className="w-full h-full border-none block bg-transparent"
          />
          {mountNode && createPortal(children, mountNode)}
        </div>
      </div>
    </div>
  );
}
