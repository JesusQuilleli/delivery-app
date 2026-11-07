import type { CSSProperties, ReactNode } from 'react';
import { resolveTheme, resolveThemeHex } from '@/lib/themes';

interface ThemeScopeProps {
  themeColor?: string | null;
  children: ReactNode;
  className?: string;
}

export function ThemeScope({ themeColor, children, className }: ThemeScopeProps) {
  const oklch = resolveTheme(themeColor);
  const hex = resolveThemeHex(themeColor);

  const style = {
    '--primary': oklch,
    '--theme-primary': hex,
    '--color-primary': hex
  } as CSSProperties;

  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}
