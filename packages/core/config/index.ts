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

export interface CategoryLinkConfig {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
}

export type CategoryConfigEntry = string | CategoryLinkConfig;

export interface AboutSectionConfig {
  title: string;
  paragraphs?: string[];
  items?: string[];
  timeline?: Array<[string, string]>;
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
  home?: {
    heroTitle?: string;
    heroHighlight?: string;
    heroDescription?: string;
    primaryCta?: string;
    secondaryCta?: string;
    featuredTitle?: string;
    categoriesTitle?: string;
    latestTitle?: string;
    viewAllLabel?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  about?: {
    title?: string;
    description?: string;
    pageTitle?: string;
    sections?: AboutSectionConfig[];
    contactTitle?: string;
    contactIntro?: string;
    emailLabel?: string;
    extraContacts?: string[];
  };
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
    action?: string;
    method?: 'GET' | 'POST';
  };
  featuredCategories?: CategoryConfigEntry[];
  categoryMeta?: Record<string, Omit<CategoryLinkConfig, 'name'>>;
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
    categories?: CategoryConfigEntry[];
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
