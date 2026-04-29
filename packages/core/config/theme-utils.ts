export interface ThemePalette {
  primary: string;
  primaryDark: string;
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
}

export interface SingleThemeConfig {
  name?: string;
  colors: {
    light: ThemePalette;
    dark: ThemePalette;
  };
  font: {
    family: string;
  };
  radius: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface MultiThemeConfig {
  activeTheme?: string;
  themes: Record<string, SingleThemeConfig>;
}

export type ThemeConfig = SingleThemeConfig | MultiThemeConfig;

function isMultiThemeConfig(theme: ThemeConfig): theme is MultiThemeConfig {
  return 'themes' in theme && typeof theme.themes === 'object' && theme.themes !== null;
}

export function resolveTheme(theme: ThemeConfig): SingleThemeConfig {
  if (!isMultiThemeConfig(theme)) {
    return theme;
  }

  const themeNames = Object.keys(theme.themes);
  const activeTheme = theme.activeTheme && theme.themes[theme.activeTheme];

  return activeTheme || theme.themes[themeNames[0]];
}

export function buildThemeCSS(theme: ThemeConfig) {
  const { colors, font, radius } = resolveTheme(theme);
  const light = colors.light;
  const dark = colors.dark;

  return `
:root {
  color-scheme: light;
  --bg-primary: ${light.background};
  --bg-secondary: ${light.backgroundSecondary};
  --bg-tertiary: ${light.background};
  --text-primary: ${light.text};
  --text-secondary: ${light.textSecondary};
  --border-color: ${light.border};
  --accent-color: ${light.primary};
  --accent-color-dark: ${light.primaryDark};
  --font-family: ${font.family};
  --radius-small: ${radius.small};
  --radius-medium: ${radius.medium};
  --radius-large: ${radius.large};
}

html.dark,
.dark {
  color-scheme: dark;
  --bg-primary: ${dark.background};
  --bg-secondary: ${dark.backgroundSecondary};
  --bg-tertiary: ${dark.background};
  --text-primary: ${dark.text};
  --text-secondary: ${dark.textSecondary};
  --border-color: ${dark.border};
  --accent-color: ${dark.primary};
  --accent-color-dark: ${dark.primaryDark};
}
`.trim();
}
