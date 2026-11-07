import type { ReactNode } from 'react';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

interface PreviewFrameProps {
  device: PreviewDevice;
  label?: string;
  children: ReactNode;
}

const deviceClass: Record<PreviewDevice, string> = {
  desktop: 'w-full max-w-[1280px]',
  tablet: 'w-[768px] max-w-full',
  mobile: 'w-[375px] max-w-full'
};

export function PreviewFrame({ device, label, children }: PreviewFrameProps) {
  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-2">
      {label && (
        <span className="rounded-full bg-muted/80 border px-3 py-1 text-[11px] font-black uppercase tracking-widest text-muted-foreground shadow-sm">
          {label}
        </span>
      )}
      <div className={`${deviceClass[device]} overflow-hidden rounded-2xl border-2 border-border/80 bg-white shadow-xl transition-all`}>
        <div className="h-[680px] overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
