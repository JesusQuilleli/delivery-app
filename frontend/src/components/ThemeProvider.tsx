import { useEffect } from 'react';

// Valores OKLCH para los diferentes temas de color
const THEMES: Record<string, string> = {
  blue: '0.52 0.11 165',
  red: '0.58 0.22 25',
  green: '0.62 0.15 145',
  purple: '0.55 0.18 300',
  orange: '0.65 0.18 45',
  coral: '0.65 0.18 20',
};

interface ThemeProviderProps {
  themeColor: string;
}

export function ThemeProvider({ themeColor }: ThemeProviderProps) {
  useEffect(() => {
    const oklchValue = THEMES[themeColor] || THEMES['blue'];
    
    // Inyectar la variable CSS --primary en la raíz (html)
    document.documentElement.style.setProperty('--primary', oklchValue);

    return () => {
      // Limpiar al desmontar (opcional, aunque normalmente si navegas a otra tienda debería sobrescribirse)
      document.documentElement.style.removeProperty('--primary');
    };
  }, [themeColor]);

  return null; // Este componente no renderiza nada visible
}
