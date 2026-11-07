export const THEME_OPTIONS = [
  { value: 'blue', label: 'Azul (Profesional / Farmacia)', primary: '0.52 0.11 165' },
  { value: 'green', label: 'Verde (Natural / Víveres)', primary: '0.62 0.15 145' },
  { value: 'orange', label: 'Naranja (Cálido / Comida)', primary: '0.65 0.18 45' },
  { value: 'coral', label: 'Coral (Cercano / Comercio)', primary: '0.65 0.18 20' },
  { value: 'purple', label: 'Púrpura (Premium)', primary: '0.55 0.18 300' },
  { value: 'red', label: 'Rojo (Energía / Ofertas)', primary: '0.58 0.22 25' }
] as const;

export type ThemeValue = (typeof THEME_OPTIONS)[number]['value'];

export const THEME_ALIASES: Record<string, ThemeValue> = {
  emerald: 'green',
  rose: 'coral',
  amber: 'orange'
};

export const THEME_PRIMARY: Record<string, string> = Object.fromEntries(
  THEME_OPTIONS.map((theme) => [theme.value, theme.primary])
);

export function resolveTheme(themeColor?: string | null): string {
  if (!themeColor) return THEME_PRIMARY.blue;
  const normalized = THEME_ALIASES[themeColor] || themeColor;
  return THEME_PRIMARY[normalized] || THEME_PRIMARY.blue;
}

export function resolveThemeValue(themeColor?: string | null): ThemeValue {
  if (!themeColor) return 'blue';
  return (THEME_ALIASES[themeColor] || themeColor) as ThemeValue;
}
