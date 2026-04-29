import { createPostSitemapGET, getPostSitemapStaticPaths } from '@astro-money-farm/core/routes';
import { getSiteUrl } from '../config';

export const getStaticPaths = getPostSitemapStaticPaths;
export const GET = createPostSitemapGET(getSiteUrl);
