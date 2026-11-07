import { useEffect } from 'react';
import { resolveTheme } from '@/lib/themes';

interface ThemeProviderProps {
  themeColor: string;
}

export function ThemeProvider({ themeColor }: ThemeProviderProps) {
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', resolveTheme(themeColor));

    return () => {
      document.documentElement.style.removeProperty('--primary');
    };
  }, [themeColor]);

  return null;
}
