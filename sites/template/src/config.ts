import rawConfig from './config/site.json';
import rawTheme from './config/theme.json';
import {
  getLang as getCoreLang,
  getSiteUrl as getCoreSiteUrl,
  type FriendLinkGroup,
  type FriendLinkSite,
  type SiteConfig,
  type SupportedLang
} from '@astro-money-farm/core/config';

const config = {
  ...(rawConfig as SiteConfig),
  theme: rawTheme
} satisfies SiteConfig;

export type { FriendLinkGroup, FriendLinkSite, SiteConfig, SupportedLang };

export function getLang() {
  return getCoreLang(config);
}

export function getSiteUrl() {
  return getCoreSiteUrl(config);
}

export default config;
