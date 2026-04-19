import theme from '../config/theme.json';

const { colors, font, radius } = theme;

const light = colors.light;
const dark = colors.dark;

export const themeCSS = `
:root {
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

.dark {
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
