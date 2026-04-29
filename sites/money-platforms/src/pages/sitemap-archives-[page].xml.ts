import { createArchiveSitemapGET, getArchiveSitemapStaticPaths } from '@astro-money-farm/core/routes';
import { getSiteUrl } from '../config';

export const getStaticPaths = getArchiveSitemapStaticPaths;
export const GET = createArchiveSitemapGET(getSiteUrl);
