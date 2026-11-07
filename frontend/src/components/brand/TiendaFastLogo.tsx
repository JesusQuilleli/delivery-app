import type { CSSProperties } from 'react';

type LogoVariant = 'horizontal' | 'compact' | 'stacked' | 'icon' | 'monochrome';

interface TiendaFastLogoProps {
  variant?: LogoVariant;
  size?: number;
  onDark?: boolean;
  showTagline?: boolean;
  className?: string;
}

const FOREST = '#123B2F';
const CREAM = '#FCF7ED';
const CORAL = '#F26A3D';

function BrandIcon({ size, monochrome = false }: { size: number; monochrome?: boolean }) {
  if (monochrome) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect x="1.5" y="1.5" width="61" height="61" rx="17.5" stroke="currentColor" strokeWidth="3" />
        <path d="M22 25v-4a10 10 0 0 1 20 0v4" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M13 24h38v31a1 1 0 0 1-1 1H14a1 1 0 0 1-1-1V24Z" stroke="currentColor" strokeWidth="3" />
        <path d="M35 28h-9l-3 8h5l-3 9 12-12h-6l4-5Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="64" height="64" rx="18" fill={FOREST} />
      <path d="M22 25v-4a10 10 0 0 1 20 0v4" stroke={CREAM} strokeWidth="4" strokeLinecap="round" />
      <path d="M13 24h38v31a1 1 0 0 1-1 1H14a1 1 0 0 1-1-1V24Z" fill={CREAM} />
      <path d="M35 28h-9l-3 8h5l-3 9 12-12h-6l4-5Z" fill={FOREST} />
    </svg>
  );
}

export function TiendaFastLogo({
  variant = 'horizontal',
  size = 40,
  onDark = false,
  showTagline = true,
  className = ''
}: TiendaFastLogoProps) {
  const wordmarkSize = Math.max(18, Math.round(size * 0.58));
  const taglineSize = Math.max(8, Math.round(size * 0.2));
  const textStyle: CSSProperties = {
    color: onDark ? CREAM : FOREST,
    fontSize: wordmarkSize,
    lineHeight: 1
  };

  if (variant === 'icon') {
    return (
      <span className={className} aria-label="TiendaFast">
        <BrandIcon size={size} />
      </span>
    );
  }

  if (variant === 'monochrome') {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`} aria-label="TiendaFast">
        <BrandIcon size={size} monochrome />
        <span className="font-display font-extrabold tracking-tight" style={textStyle}>
          Tienda<span style={{ color: onDark ? CREAM : CORAL }}>Fast</span>
        </span>
      </span>
    );
  }

  const wordmark = (
    <span className="flex flex-col" style={{ gap: Math.max(3, Math.round(size * 0.08)) }}>
      <span className="font-display font-extrabold tracking-[-0.04em]" style={textStyle}>
        Tienda<span style={{ color: CORAL }}>Fast</span>
      </span>
      {showTagline && (
        <span
          className="font-sans font-bold uppercase tracking-[0.22em]"
          style={{
            color: onDark ? 'rgba(252,247,237,0.72)' : 'rgba(18,59,47,0.62)',
            fontSize: taglineSize
          }}
        >
          Entregas al instante
        </span>
      )}
    </span>
  );

  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center ${className}`} style={{ gap: Math.round(size * 0.18) }} aria-label="TiendaFast">
        <BrandIcon size={size} />
        <span className="font-display font-extrabold tracking-[-0.04em]" style={textStyle}>
          Tienda<span style={{ color: CORAL }}>Fast</span>
        </span>
      </span>
    );
  }

  if (variant === 'stacked') {
    return (
      <span className={`inline-flex flex-col items-center text-center ${className}`} style={{ gap: Math.round(size * 0.2) }} aria-label="TiendaFast">
        <BrandIcon size={size} />
        {wordmark}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center ${className}`} style={{ gap: Math.round(size * 0.22) }} aria-label="TiendaFast">
      <BrandIcon size={size} />
      {wordmark}
    </span>
  );
}
