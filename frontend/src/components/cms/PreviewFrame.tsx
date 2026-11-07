import type { ReactNode } from 'react';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

interface PreviewFrameProps {
  device: PreviewDevice;
  label?: string;
  children: ReactNode;
}

const deviceClass: Record<PreviewDevice, string> = {
  desktop: 'w-full',
  tablet: 'w-[820px] max-w-full',
  mobile: 'w-[390px] max-w-full'
};

export function PreviewFrame({ device, label, children }: PreviewFrameProps) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      {label && (
        <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      )}
      <div className={`${deviceClass[device]} overflow-hidden rounded-2xl border border-border bg-white shadow-inner`}>
        <div className="h-[620px] overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
