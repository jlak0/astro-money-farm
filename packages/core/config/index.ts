import rawConfig from './site.json';
import rawTheme from './theme.json';
export type { MultiThemeConfig, SingleThemeConfig, ThemeConfig, ThemePalette };
import { buildThemeCSS as buildResolvedThemeCSS, resolveTheme, type ThemeConfig } from './theme-utils';

export type SupportedLang = 'zh-CN' | 'en-US';

export interface FriendLinkSite {
  name: string;
  url: string;
  description?: string;
  logo?: string;
  priority?: number;
  nofollow?: boolean;
}

export interface FriendLinkGroup {
  name: string;
  sites: FriendLinkSite[];
}

export interface SiteConfig {
  site: {
    name: string;
    description: string;
    url: string;
    lang: string;
  };
  language?: string;
  theme?: ThemeConfig;
  ads?: {
    enabled: boolean;
    placements?: Record<'top' | 'inline' | 'sidebar', boolean>;
    google?: {
      enabled: boolean;
      clientId: string;
      slotTop?: string;
      slotInline?: string;
      slotSidebar?: string;
    };
    custom?: {
      topBanner?: string;
      inlineAd?: string;
      sidebarAd?: string;
    };
  };
  subscribe?: {
    enabled: boolean;
    title: string;
    description: string;
    placeholder: string;
  };
  social?: {
    twitter?: string;
    github?: string;
    email?: string;
  };
  analytics?: {
    enabled: boolean;
    baidu?: string;
    umami?: {
      enabled: boolean;
      url?: string;
      id?: string;
    };
  };
  affiliate?: {
    enabled: boolean;
    links?: Record<string, string>;
  };
  friendLinks?: {
    enabled?: boolean;
    groups?: FriendLinkGroup[];
    globalNofollow?: boolean;
    openInNewTab?: boolean;
  };
  internalLinks?: {
    enabled?: boolean;
  };
  links?: {
    friendlyLinks?: SiteConfig['friendLinks'];
    internalLinks?: {
      relatedPosts?: {
        enabled?: boolean;
        maxCount?: number;
        matchBy?: string;
      };
      autoLink?: {
        enabled?: boolean;
        keywords?: Array<{ from: string; to: string }>;
      };
      contextualLinks?: {
        enabled?: boolean;
        linksPerParagraph?: number;
      };
    };
  };
  footer?: {
    copyright: string;
    ICP?: string;
    police?: string;
  };
}

const config = {
  ...(rawConfig as SiteConfig),
  theme: rawTheme as ThemeConfig
} satisfies SiteConfig;

export function getSiteUrl(siteConfig: SiteConfig = config) {
  const envUrl = import.meta.env.PUBLIC_SITE_URL || import.meta.env.SITE_URL;
  return (envUrl || siteConfig.site.url).replace(/\/$/, '');
}

export function getLang(siteConfig: SiteConfig = config): SupportedLang {
  const lang = siteConfig.site?.lang || siteConfig.language || 'zh-CN';
  return lang === 'en-US' || lang === 'en' ? 'en-US' : 'zh-CN';
}

export { resolveTheme };

export function buildThemeCSS(theme: ThemeConfig = rawTheme as ThemeConfig) {
  return buildResolvedThemeCSS(theme);
}

export default config;
