import assert from 'node:assert/strict';
import test from 'node:test';

const { buildThemeCSS, resolveTheme } = await import('../packages/core/config/theme-utils.ts');

const classicTheme = {
  name: 'classic',
  colors: {
    light: {
      primary: '#111111',
      primaryDark: '#000000',
      background: '#ffffff',
      backgroundSecondary: '#f4f4f4',
      text: '#202020',
      textSecondary: '#606060',
      border: '#dddddd'
    },
    dark: {
      primary: '#eeeeee',
      primaryDark: '#ffffff',
      background: '#101010',
      backgroundSecondary: '#181818',
      text: '#f7f7f7',
      textSecondary: '#bdbdbd',
      border: '#333333'
    }
  },
  font: { family: "'Literata', serif" },
  radius: {
    small: '2px',
    medium: '6px',
    large: '12px'
  }
};

const multiTheme = {
  activeTheme: 'ledger',
  themes: {
    orchard: {
      ...classicTheme,
      name: 'orchard',
      colors: {
        ...classicTheme.colors,
        light: {
          ...classicTheme.colors.light,
          primary: '#2f7d32'
        }
      }
    },
    ledger: {
      ...classicTheme,
      name: 'ledger',
      colors: {
        ...classicTheme.colors,
        light: {
          ...classicTheme.colors.light,
          primary: '#0f766e'
        }
      },
      font: { family: "'Alegreya Sans', sans-serif" }
    }
  }
};

test('resolveTheme keeps the existing single-theme config format compatible', () => {
  assert.deepEqual(resolveTheme(classicTheme), classicTheme);
});

test('resolveTheme selects the site activeTheme from a multi-theme config', () => {
  assert.equal(resolveTheme(multiTheme).name, 'ledger');
  assert.equal(resolveTheme(multiTheme).colors.light.primary, '#0f766e');
});

test('resolveTheme falls back to the first theme when activeTheme is missing', () => {
  const resolved = resolveTheme({ ...multiTheme, activeTheme: 'missing' });

  assert.equal(resolved.name, 'orchard');
});

test('buildThemeCSS emits variables from the resolved active theme', () => {
  const css = buildThemeCSS(multiTheme);

  assert.match(css, /--accent-color: #0f766e;/);
  assert.match(css, /--font-family: 'Alegreya Sans', sans-serif;/);
  assert.match(css, /html\.dark,\s*\.dark \{/);
});
