import type { CSSProperties, ReactNode } from 'react';
import { resolveTheme } from '@/lib/themes';

interface ThemeScopeProps {
  themeColor?: string | null;
  children: ReactNode;
  className?: string;
}

export function ThemeScope({ themeColor, children, className }: ThemeScopeProps) {
  const style = {
    '--primary': resolveTheme(themeColor)
  } as CSSProperties;

  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}
